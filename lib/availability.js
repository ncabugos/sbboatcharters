import { sql } from './db';

// All slot math happens in the boat's timezone.
export const TIMEZONE = 'America/Los_Angeles';
// Turnaround buffer between trips; must match block_range construction everywhere.
export const BUFFER_MIN = 30;

const offsetFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE,
  timeZoneName: 'longOffset',
});

// UTC instant for a Pacific-time wall clock like ('2026-08-01', '08:00').
export function ptToUtc(dateStr, timeStr) {
  const hhmm = timeStr.slice(0, 5);
  let guess = new Date(`${dateStr}T${hhmm}:00-07:00`);
  // Correct the guess if the real offset at that instant differs (PST vs PDT).
  const part = offsetFmt.formatToParts(guess).find((p) => p.type === 'timeZoneName').value;
  const m = part.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (m) {
    const offsetMin = (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
    guess = new Date(`${dateStr}T${hhmm}:00Z`).getTime() - offsetMin * 60000;
    guess = new Date(guess);
  }
  return guess;
}

export function formatPt(date, opts = {}) {
  return new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, ...opts }).format(date);
}

function parseTimeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.replace(/^{|}$/g, '').split(',').filter(Boolean);
  }
  return null;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

async function loadContext(tourSlug, rangeStart, rangeEnd) {
  const tours = await sql`SELECT * FROM tours WHERE slug = ${tourSlug} AND active`;
  const tour = tours[0];
  if (!tour) return null;

  const options = await sql`
    SELECT * FROM pricing_options
    WHERE tour_id = ${tour.id} AND active ORDER BY sort_order`;

  let rules = await sql`
    SELECT * FROM schedule_rules WHERE active AND tour_id = ${tour.id}`;
  if (rules.length === 0) {
    rules = await sql`SELECT * FROM schedule_rules WHERE active AND tour_id IS NULL`;
  }

  const blackouts = await sql`
    SELECT starts_at, ends_at FROM blackout_dates
    WHERE starts_at < ${rangeEnd.toISOString()} AND ends_at > ${rangeStart.toISOString()}`;

  const bookings = await sql`
    SELECT lower(block_range) AS block_start, upper(block_range) AS block_end
    FROM bookings
    WHERE status IN ('pending','confirmed')
      AND (status <> 'pending' OR expires_at > now())
      AND lower(block_range) < ${rangeEnd.toISOString()}
      AND upper(block_range) > ${rangeStart.toISOString()}`;

  const blocked = [
    ...blackouts.map((b) => [new Date(b.starts_at), new Date(b.ends_at)]),
    ...bookings.map((b) => [new Date(b.block_start), new Date(b.block_end)]),
  ];
  return { tour, options, rules, blocked };
}

function slotsForDay(dateStr, ctx, now) {
  const { tour, options, rules, blocked } = ctx;
  // A calendar date string maps to a fixed day-of-week regardless of timezone.
  const dow = new Date(`${dateStr}T12:00:00Z`).getUTCDay();
  const minNoticeMs = tour.min_notice_hours * 3600000;

  const result = { options: {}, callToBook: false };
  for (const rule of rules) {
    const days = Array.isArray(rule.days_of_week)
      ? rule.days_of_week
      : parseTimeArray(rule.days_of_week).map(Number);
    if (!days.includes(dow)) continue;

    const startTimes = parseTimeArray(rule.start_times);
    const windowStart = rule.window_start.slice(0, 5);
    const windowEnd = rule.window_end.slice(0, 5);
    const windowEndUtc = ptToUtc(dateStr, windowEnd);

    for (const opt of options) {
      const durationMs = opt.duration_min * 60000;
      const candidates = [];
      if (startTimes && startTimes.length > 0) {
        candidates.push(...startTimes.map((t) => t.slice(0, 5)));
      } else {
        const step = rule.slot_step_min * 60000;
        for (
          let t = ptToUtc(dateStr, windowStart).getTime();
          t + durationMs <= windowEndUtc.getTime();
          t += step
        ) {
          candidates.push(formatPt(new Date(t), { hour: '2-digit', minute: '2-digit', hour12: false }));
        }
      }

      for (const hhmm of candidates) {
        const start = ptToUtc(dateStr, hhmm);
        const end = new Date(start.getTime() + durationMs);
        if (end > windowEndUtc) continue;
        const blockEnd = new Date(end.getTime() + BUFFER_MIN * 60000);
        if (start <= now) continue;
        if (blocked.some(([bs, be]) => overlaps(start, blockEnd, bs, be))) continue;

        if (start.getTime() - now.getTime() < minNoticeMs) {
          // Runnable but inside the notice window → "Call to book" (mirrors FareHarbor).
          result.callToBook = true;
          continue;
        }
        (result.options[opt.id] ||= []).push(hhmm);
      }
    }
  }
  return result;
}

// Month availability for the picker.
// Returns { tour, options, days: { 'YYYY-MM-DD': { options: {optionId: ['08:00',...]}, callToBook } } }
export async function getMonthAvailability(tourSlug, monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  const rangeStart = ptToUtc(`${monthStr}-01`, '00:00');
  const lastDay = daysInMonth(year, month);
  const rangeEnd = new Date(
    ptToUtc(`${monthStr}-${String(lastDay).padStart(2, '0')}`, '23:59').getTime() + 60000
  );

  const ctx = await loadContext(tourSlug, rangeStart, rangeEnd);
  if (!ctx) return null;

  const now = new Date();
  const days = {};
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${monthStr}-${String(d).padStart(2, '0')}`;
    const day = slotsForDay(dateStr, ctx, now);
    if (Object.keys(day.options).length > 0 || day.callToBook) days[dateStr] = day;
  }
  return { tour: ctx.tour, options: ctx.options, days };
}

// Server-side revalidation at checkout. Uses the same logic as the picker so
// display and enforcement can't drift; the DB exclusion constraint is the backstop.
export async function validateSlot({ tourSlug, pricingOptionId, dateStr, timeStr, partySize }) {
  const start = ptToUtc(dateStr, timeStr);
  const rangeStart = new Date(start.getTime() - 24 * 3600000);
  const rangeEnd = new Date(start.getTime() + 24 * 3600000);
  const ctx = await loadContext(tourSlug, rangeStart, rangeEnd);
  if (!ctx) return { ok: false, reason: 'unknown_tour' };

  const option = ctx.options.find((o) => o.id === Number(pricingOptionId));
  if (!option) return { ok: false, reason: 'unknown_option' };
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > ctx.tour.max_party) {
    return { ok: false, reason: 'invalid_party_size' };
  }

  const day = slotsForDay(dateStr, ctx, new Date());
  const times = day.options[option.id] || [];
  if (!times.includes(timeStr)) return { ok: false, reason: 'slot_unavailable' };

  const end = new Date(start.getTime() + option.duration_min * 60000);
  return { ok: true, tour: ctx.tour, option, tripStart: start, tripEnd: end };
}
