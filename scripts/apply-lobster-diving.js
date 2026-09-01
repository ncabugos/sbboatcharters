#!/usr/bin/env node
/**
 * Add the Lobster Diving tour to the catalog database.
 *
 * Lobster Diving is the first seasonal tour and the first with a night trip, so
 * this also carries the two schema additions it needs:
 *   - tours.season_start / tours.season_end (date): no bookings outside them
 *   - schedule_rules.pricing_option_id: a rule pinned to one option, so the
 *     night window only ever produces "Night" departures
 * lib/availability.js reads both and treats NULL as "year-round" / "every
 * option", so the deployed code is correct before AND after this runs.
 *
 * What it writes, in one transaction, touching nothing else:
 *   tours            lobster-diving — 4 divers, 48h notice, season 2026-10-02 → 2027-03-17
 *   pricing_options  Day / Night — 8 hours, $2,400 base, $2,544 all-in (same as spearfishing)
 *   schedule_rules   Day 08:00–20:00 (departures 8 AM–12 PM); Night 16:00–02:00
 *                    (departures 4–6 PM; an end before the start means "next day")
 *   tours            foiling → sort 7, create-your-own-adventure → sort 8 (lobster takes 6)
 *
 * Usage — no arguments:
 *   node scripts/apply-lobster-diving.js
 *
 * Connection resolution is scripts/catalog-db.js: the DATABASE_URL env var,
 * then NEON_DATABASE_URL / POSTGRES_URL / DATABASE_URL from .env.production.local,
 * then .env.local — so with NEON_DATABASE_URL in .env.local this runs against
 * production. To rehearse on the local docker catalog first:
 *   DATABASE_URL="$(grep '^DATABASE_URL=' .env.local | cut -d= -f2-)" node scripts/apply-lobster-diving.js
 *
 * Safe to re-run: the tour row converges to the definition below, existing
 * pricing options and schedule rules are left alone (a price edited in place
 * survives), and the ALTERs use IF NOT EXISTS.
 */
const { connect } = require('./catalog-db');

const SLUG = 'lobster-diving';
const TOUR = {
  name: 'Lobster Diving',
  tagline: '8 Hour Day or Night Trips - Lobster Season Only',
  description:
    'A private eight-hour guided California spiny lobster dive in the Santa Barbara Channel and Channel Islands, by day or after dark. Up to four divers, October through March.',
  max_party: 4,
  min_notice_hours: 48,
  image_url: '/images/lobster-diving-hero.jpg',
  sort_order: 6,
  policy_text:
    'Full refund for cancellations made two weeks or more before departure. Weather cancellations by the captain are fully refundable or reschedulable.',
  season_start: '2026-10-02',
  season_end: '2027-03-17',
};
// display = ceil(base * 1.06): 2400 → 2544, matching spearfishing.
const OPTIONS = [
  { label: 'Day', duration_min: 480, base_cents: 240000, display_cents: 254400, sort_order: 1 },
  { label: 'Night', duration_min: 480, base_cents: 240000, display_cents: 254400, sort_order: 2 },
];
// [window_start, window_end]; an end at or before the start runs past midnight.
const RULES = { Day: ['08:00', '20:00'], Night: ['16:00', '02:00'] };
const REORDER = { foiling: 7, 'create-your-own-adventure': 8 };

async function hasColumn(client, table, column) {
  const { rows } = await client.query(
    'SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2',
    [table, column]
  );
  return rows.length > 0;
}

async function show(client, when) {
  const seasonal = await hasColumn(client, 'tours', 'season_start');
  const pinned = await hasColumn(client, 'schedule_rules', 'pricing_option_id');

  const { rows: tours } = await client.query(
    `SELECT slug, name, max_party, sort_order, active
       ${seasonal ? ", to_char(season_start, 'YYYY-MM-DD') AS season_start, to_char(season_end, 'YYYY-MM-DD') AS season_end" : ''}
     FROM tours ORDER BY sort_order, slug`
  );
  console.log(`\n${when}: tours`);
  for (const t of tours) {
    const season = t.season_start ? `  season ${t.season_start} → ${t.season_end}` : '';
    console.log(`  ${String(t.sort_order).padStart(2)}  ${t.slug.padEnd(28)} max ${t.max_party}${t.active ? '' : '  INACTIVE'}${season}`);
  }

  const { rows: options } = await client.query(
    `SELECT p.id, p.label, p.duration_min, p.base_cents, p.display_cents, p.active
     FROM pricing_options p JOIN tours t ON t.id = p.tour_id
     WHERE t.slug = $1 ORDER BY p.sort_order`,
    [SLUG]
  );
  console.log(`${when}: ${SLUG} pricing options — ${options.length}`);
  for (const o of options) {
    console.log(`  #${o.id} ${o.label.padEnd(6)} ${o.duration_min} min  base $${o.base_cents / 100}  all-in $${o.display_cents / 100}${o.active ? '' : '  INACTIVE'}`);
  }

  const { rows: rules } = await client.query(
    `SELECT r.id, ${pinned ? 'p.label' : 'NULL AS label'}, r.window_start, r.window_end, r.start_times, r.slot_step_min, r.days_of_week, r.active
     FROM schedule_rules r JOIN tours t ON t.id = r.tour_id
     ${pinned ? 'LEFT JOIN pricing_options p ON p.id = r.pricing_option_id' : ''}
     WHERE t.slug = $1 ORDER BY r.id`,
    [SLUG]
  );
  console.log(`${when}: ${SLUG} schedule rules — ${rules.length}`);
  for (const r of rules) {
    console.log(`  #${r.id} ${(r.label || 'all options').padEnd(12)} ${r.window_start.slice(0, 5)}–${r.window_end.slice(0, 5)}  step ${r.slot_step_min} min  days ${JSON.stringify(r.days_of_week)}${r.active ? '' : '  INACTIVE'}`);
  }
  return { tours, options, rules };
}

(async () => {
  const { pool, client } = await connect();
  try {
    await show(client, 'BEFORE');

    await client.query('BEGIN');
    await client.query(
      'ALTER TABLE tours ADD COLUMN IF NOT EXISTS season_start date, ADD COLUMN IF NOT EXISTS season_end date'
    );
    await client.query(
      'ALTER TABLE schedule_rules ADD COLUMN IF NOT EXISTS pricing_option_id int REFERENCES pricing_options(id)'
    );

    for (const [slug, sort] of Object.entries(REORDER)) {
      const { rowCount } = await client.query('UPDATE tours SET sort_order = $1 WHERE slug = $2', [sort, slug]);
      if (rowCount !== 1) throw new Error(`Expected 1 "${slug}" row to reorder, found ${rowCount}`);
    }

    const { rows: [tour] } = await client.query(
      `INSERT INTO tours (slug, name, tagline, description, max_party, min_notice_hours, image_url,
                          sort_order, policy_text, season_start, season_end, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description,
         max_party = EXCLUDED.max_party, min_notice_hours = EXCLUDED.min_notice_hours,
         image_url = EXCLUDED.image_url, sort_order = EXCLUDED.sort_order,
         policy_text = EXCLUDED.policy_text, season_start = EXCLUDED.season_start,
         season_end = EXCLUDED.season_end, active = true
       RETURNING id`,
      [SLUG, TOUR.name, TOUR.tagline, TOUR.description, TOUR.max_party, TOUR.min_notice_hours,
       TOUR.image_url, TOUR.sort_order, TOUR.policy_text, TOUR.season_start, TOUR.season_end]
    );

    for (const o of OPTIONS) {
      await client.query(
        `INSERT INTO pricing_options (tour_id, label, duration_min, base_cents, display_cents, sort_order)
         SELECT $1, $2, $3, $4, $5, $6
         WHERE NOT EXISTS (SELECT 1 FROM pricing_options WHERE tour_id = $1 AND label = $2)`,
        [tour.id, o.label, o.duration_min, o.base_cents, o.display_cents, o.sort_order]
      );
    }

    for (const [label, [start, end]] of Object.entries(RULES)) {
      await client.query(
        `INSERT INTO schedule_rules (tour_id, pricing_option_id, days_of_week, window_start, window_end, slot_step_min)
         SELECT $1, p.id, '{0,1,2,3,4,5,6}', $3::time, $4::time, 60
         FROM pricing_options p
         WHERE p.tour_id = $1 AND p.label = $2
           AND NOT EXISTS (SELECT 1 FROM schedule_rules r WHERE r.tour_id = $1 AND r.pricing_option_id = p.id)`,
        [tour.id, label, start, end]
      );
    }
    await client.query('COMMIT');

    const after = await show(client, 'AFTER');
    const lobster = after.tours.find((t) => t.slug === SLUG);
    if (!lobster || !lobster.active || lobster.max_party !== TOUR.max_party ||
        lobster.season_start !== TOUR.season_start || lobster.season_end !== TOUR.season_end) {
      throw new Error('the lobster-diving tour row did not take');
    }
    const active = after.options.filter((o) => o.active).map((o) => o.label).sort();
    if (active.join(',') !== 'Day,Night') throw new Error(`expected active options Day,Night — found ${active.join(',') || 'none'}`);
    const ruleLabels = after.rules.filter((r) => r.active).map((r) => r.label).sort();
    if (ruleLabels.join(',') !== 'Day,Night') throw new Error(`expected one Day and one Night rule — found ${ruleLabels.join(',') || 'none'}`);

    console.log('\nCommitted. /book/ and /book/lobster-diving/ read this live; /lobster-diving/ needs the deploy that ships this script.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\nFailed, nothing changed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
