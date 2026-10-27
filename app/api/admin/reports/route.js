import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';
import { SECTIONS, reportPath } from '@/lib/reports';
import { pingIndexNow } from '@/lib/indexNow';

export const dynamic = 'force-dynamic';

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const bad = (error, status = 400) => NextResponse.json({ error }, { status });

const LIMITS = { summary: 400, water_temp: 40, ...Object.fromEntries(SECTIONS.map((s) => [s.key, 4000])) };

// Only known fields, trimmed and capped. Blank becomes null (summary stays a string).
function cleanFields(body) {
  const out = {};
  for (const [key, max] of Object.entries(LIMITS)) {
    if (!(key in body)) continue;
    const value = String(body[key] ?? '').trim().slice(0, max);
    out[key] = key === 'summary' ? value : value || null;
  }
  return out;
}

const validDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '') && !Number.isNaN(Date.parse(`${d}T12:00:00Z`));

// A published report changes /report/, its own page, the sitemap and the
// "latest report" line on the tour pages, so refresh the whole site's cache.
function refreshSite() {
  revalidatePath('/', 'layout');
}

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  const rows = await sql`SELECT * FROM channel_reports ORDER BY report_date DESC`;
  return NextResponse.json({ reports: rows });
}

export async function POST(request) {
  if (!(await isAdminRequest())) return unauthorized();
  const body = await request.json().catch(() => null);
  if (!body) return bad('Invalid request');
  if (!validDate(body.report_date)) return bad('Report date required (YYYY-MM-DD)');
  const f = cleanFields(body);
  try {
    const rows = await sql`
      INSERT INTO channel_reports (report_date, summary, water_temp, wildlife, fishing, diving, outlook, open_dates)
      VALUES (${body.report_date}, ${f.summary ?? ''}, ${f.water_temp ?? null}, ${f.wildlife ?? null}, ${f.fishing ?? null},
              ${f.diving ?? null}, ${f.outlook ?? null}, ${f.open_dates ?? null})
      RETURNING *`;
    return NextResponse.json({ report: rows[0] });
  } catch (err) {
    if (err.code === '23505') return bad('There is already a report for that date. Edit it instead.', 409);
    throw err;
  }
}

// Body: { id, ...fields, publish?: true | false }. Fields not sent are left alone.
export async function PATCH(request) {
  if (!(await isAdminRequest())) return unauthorized();
  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  if (!Number.isInteger(id)) return bad('id required');

  const current = (await sql`SELECT * FROM channel_reports WHERE id = ${id}`)[0];
  if (!current) return bad('Report not found', 404);

  if (body.report_date !== undefined && !validDate(body.report_date)) return bad('Report date must be YYYY-MM-DD');
  const next = { ...current, ...cleanFields(body), report_date: body.report_date ?? current.report_date };

  let publishedAt = current.published_at;
  if (body.publish === true) {
    if (!next.summary) return bad('Add a summary before publishing. It is the first thing people and search engines read.');
    if (!SECTIONS.some((s) => next[s.key])) return bad('Fill in at least one section before publishing.');
    publishedAt = current.published_at ?? new Date().toISOString();
  } else if (body.publish === false) {
    publishedAt = null;
  }

  let report;
  try {
    report = (await sql`
      UPDATE channel_reports SET
        report_date = ${next.report_date}, summary = ${next.summary}, water_temp = ${next.water_temp},
        wildlife = ${next.wildlife}, fishing = ${next.fishing}, diving = ${next.diving},
        outlook = ${next.outlook}, open_dates = ${next.open_dates},
        published_at = ${publishedAt}, updated_at = now()
      WHERE id = ${id}
      RETURNING *`)[0];
  } catch (err) {
    if (err.code === '23505') return bad('There is already a report for that date.', 409);
    throw err;
  }

  // Live before or after this change: the public pages need refreshing.
  if (current.published_at || report.published_at) refreshSite();
  if (report.published_at) await pingIndexNow([reportPath(report), '/report/']);
  return NextResponse.json({ report });
}

// Drafts only. A published report has a public URL; unpublish it first.
export async function DELETE(request) {
  if (!(await isAdminRequest())) return unauthorized();
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return bad('id required');
  const rows = await sql`DELETE FROM channel_reports WHERE id = ${id} AND published_at IS NULL RETURNING id`;
  if (!rows.length) return bad('Only unpublished drafts can be deleted. Unpublish it first.', 409);
  return NextResponse.json({ ok: true });
}
