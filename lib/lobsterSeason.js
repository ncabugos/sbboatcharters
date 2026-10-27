import { cache } from 'react';
import { getTourWithOptions, fromPrice } from '@/lib/catalog';

export const LOBSTER_SLUG = 'lobster-diving';

// The season is content, so it lives on the catalog row (tours.season_start /
// season_end, see scripts/apply-lobster-diving.js) where it also drives the
// booking calendar. These dates only stand in until that row exists, or when
// the database cannot be reached.
export const FALLBACK_SEASON = { start: '2026-10-02', end: '2027-03-17' };

// Season dates, party size and price for the lobster promo. Rendered from the
// root layout, so it must never throw: a database hiccup falls back to the
// static season instead of taking every page down with it.
export const getLobsterPromo = cache(async () => {
  try {
    const result = await getTourWithOptions(LOBSTER_SLUG);
    if (!result) return { ...FALLBACK_SEASON, maxParty: 4, hours: 8, price: null };
    const cheapest = fromPrice(result.options);
    return {
      start: result.tour.season_start || FALLBACK_SEASON.start,
      end: result.tour.season_end || FALLBACK_SEASON.end,
      maxParty: result.tour.max_party,
      hours: cheapest?.hours ?? 8,
      price: cheapest?.fromUsd ?? null,
    };
  } catch (err) {
    console.error('[lobster promo]', err?.message || err);
    return { ...FALLBACK_SEASON, maxParty: 4, hours: 8, price: null };
  }
});
