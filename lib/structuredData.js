// schema.org Product/Offer JSON-LD for a tour, built from the same `tours` and
// `pricing_options` rows that drive checkout. Google's "Things to do" module
// was inferring prices by scraping the booking page; this gives it an explicit,
// always-current source instead. Any price change made in the database flows
// through on the next render — nothing here is hand-entered.

export const SITE = 'https://www.sbboatcharters.com';

function absoluteUrl(path) {
  if (!path) return undefined;
  return /^https?:\/\//.test(path) ? path : `${SITE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function tourUrl(slug) {
  // trailingSlash: true — the canonical form ends in a slash.
  return `${SITE}/book/${slug}/`;
}

// tour: one row from `tours`. options: its active `pricing_options` rows
// (label, display_cents). display_cents is the all-in advertised price, which
// is also the full amount charged, so it is the only honest price to publish.
export function buildTourProductSchema(tour, options) {
  const url = tourUrl(tour.slug);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: tour.name,
    description: tour.description || tour.tagline || undefined,
    image: absoluteUrl(tour.image_url),
    url,
    // No aggregateRating or review: there is no real, current source for one,
    // and a fabricated rating is worse than none.
    offers: options.map((o) => ({
      '@type': 'Offer',
      name: o.label,
      price: (o.display_cents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url,
    })),
  };
}

// ItemList of every bookable tour, for the /book/ catalog page, so a crawler
// landing there finds each Product page without depending on link discovery.
export function buildTourListSchema(tours) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Santa Barbara Boat Charters — Private Charters',
    itemListElement: tours.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      url: tourUrl(t.slug),
    })),
  };
}

// Serialise for a <script type="application/ld+json"> tag. Descriptions come
// from the database, so `<` is escaped: a literal "</script>" inside a value
// must not be able to close the tag. < is still valid JSON.
export function jsonLdString(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
