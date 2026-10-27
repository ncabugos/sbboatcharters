import { SITE } from '@/lib/structuredData';

// Pure helpers for the Channel Report, shared by the public pages and the
// admin editor (a client component, so nothing here may touch the database).

// Body sections in display order. Empty ones are left out of the page.
export const SECTIONS = [
  { key: 'wildlife', heading: 'Whales and Wildlife', hint: 'What you saw: species, how many, roughly where. "Two humpbacks off Hope Ranch, a pod of common dolphins most of the way out."' },
  { key: 'fishing', heading: 'Fishing', hint: 'What is biting and roughly where, what guests landed.' },
  { key: 'diving', heading: 'Diving', hint: 'Lobster counts, visibility, spearfishing.' },
  { key: 'outlook', heading: 'This Weekend', hint: 'Wind, swell and what to expect on the water.' },
  { key: 'open_dates', heading: 'Open Dates', hint: 'Which trips still have openings this week and next.' },
];

export const FIELDS = ['summary', 'water_temp', ...SECTIONS.map((s) => s.key)];

// 'October 26, 2026'. report_date arrives as 'YYYY-MM-DD' (lib/db.js), read at
// noon UTC so no timezone can move it a day.
export function longDate(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

export function reportTitle(report) {
  return `Channel Report, ${longDate(report.report_date)}`;
}

export function reportPath(report) {
  return `/report/${report.report_date}/`;
}

// Blank lines separate paragraphs.
export function paragraphs(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// The same report as plain text, for a Google Business Profile post, an
// Instagram caption or an email.
export function reportPlainText(report) {
  const parts = [`Santa Barbara ${reportTitle(report)}`, report.summary?.trim()];
  if (report.water_temp) parts.push(`Water temperature: ${report.water_temp}`);
  for (const s of SECTIONS) {
    const text = report[s.key]?.trim();
    if (text) parts.push(`${s.heading}\n${text}`);
  }
  parts.push(`Full report: ${SITE}${reportPath(report)}`);
  return parts.filter(Boolean).join('\n\n');
}
