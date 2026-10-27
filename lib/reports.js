import { cache } from 'react';
import { sql } from '@/lib/db';

// The weekly Santa Barbara Channel Report. Rows live in Neon (channel_reports,
// see scripts/apply-channel-reports.js) and are written in /admin/reports, so a
// new report goes live without a deploy. The report date is the URL slug.
// Formatting helpers live in lib/reportFormat.js so the admin editor can use them.
export * from '@/lib/reportFormat';

// Published reports never throw: a missing table or an unreachable database
// shows the empty state instead of a 500.
export const getPublishedReports = cache(async (limit = 100) => {
  try {
    return await sql`
      SELECT * FROM channel_reports
      WHERE published_at IS NOT NULL
      ORDER BY report_date DESC
      LIMIT ${limit}`;
  } catch {
    return [];
  }
});

export const getPublishedReport = cache(async (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return null;
  try {
    const rows = await sql`
      SELECT * FROM channel_reports
      WHERE report_date = ${date} AND published_at IS NOT NULL`;
    return rows[0] ?? null;
  } catch {
    return null;
  }
});

export async function getLatestReport() {
  return (await getPublishedReports(1))[0] ?? null;
}
