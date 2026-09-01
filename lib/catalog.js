import { cache } from 'react';
import { sql } from '@/lib/db';
import { formatUsd } from '@/lib/pricing';

// One tour plus its active pricing options — the same rows checkout uses.
// Wrapped in React cache() so generateMetadata and the page body share a single
// round-trip per request. Returns null for an unknown or inactive slug.
export const getTourWithOptions = cache(async (slug) => {
  const tours = await sql`SELECT * FROM tours WHERE slug = ${slug} AND active`;
  const tour = tours[0];
  if (!tour) return null;
  const options = await sql`
    SELECT id, label, duration_min, base_cents, display_cents
    FROM pricing_options
    WHERE tour_id = ${tour.id} AND active
    ORDER BY sort_order`;
  return { tour, options };
});

export const CALL_FOR_PRICING = 'Call (805) 722-2282 for pricing';

// Cheapest active option as { fromUsd: '$636', hours: 2, label: 'From $636 (2 hrs) — all fees included' },
// or null when the tour has no active options. display_cents is the all-in
// advertised price and the full amount charged, so it is the only honest number.
export function fromPrice(options) {
  if (!options?.length) return null;
  const cheapest = options.reduce((a, b) => (b.display_cents < a.display_cents ? b : a));
  const hours = cheapest.duration_min / 60;
  const fromUsd = formatUsd(cheapest.display_cents);
  return { fromUsd, hours, label: `From ${fromUsd} (${hours} hrs) — all fees included` };
}

export async function getTourPricing(slug) {
  const result = await getTourWithOptions(slug);
  return fromPrice(result?.options);
}

// The live price line for a marketing page's details card.
export async function getTourPricingLabel(slug) {
  return (await getTourPricing(slug))?.label ?? CALL_FOR_PRICING;
}
