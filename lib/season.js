// Season bounds for tours that only run part of the year (lobster diving).
// Dates are 'YYYY-MM-DD' strings — lib/db.js hands Postgres `date` columns
// through untouched, so no timezone can shift a boundary. Pure functions, so
// client components can use them too.

export function inSeason(dateStr, start, end) {
  if (start && dateStr < start) return false;
  if (end && dateStr > end) return false;
  return true;
}

// Today's calendar date on the boat, 'YYYY-MM-DD', wherever the code runs.
export function todayPt() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

// 'October 2 to March 17': the season without years, for short promo copy.
export function shortSeasonLabel(start, end) {
  if (!start || !end) return null;
  const fmt = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', timeZone: 'UTC',
  });
  return `${fmt(start)} to ${fmt(end)}`;
}

function longDate(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

// 'October 2, 2026 to March 17, 2027', or null for a year-round tour.
export function seasonLabel(start, end) {
  if (!start || !end) return null;
  return `${longDate(start)} to ${longDate(end)}`;
}
