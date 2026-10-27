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
    offers: toOffers(options, url),
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

// The LocalBusiness node in the footer (on every page) carries this @id, so other
// nodes can name it as their provider instead of repeating the business details.
export const BUSINESS_ID = `${SITE}/#business`;

function toOffers(options, url) {
  return options.map((o) => ({
    '@type': 'Offer',
    name: o.label,
    price: (o.display_cents / 100).toFixed(2),
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url,
  }));
}

// TouristTrip for an experience page (/sport-fishing/ and the like). Those are
// the rich, well-linked pages, but until now only the thin /book/ pages carried
// structured data. Product stays on /book/ alone, the price source Google's
// Things to Do reads; this is a different type, so the two don't compete.
export function buildTouristTripSchema({ tour, options, path, description, image }) {
  return {
    '@type': 'TouristTrip',
    name: tour.name,
    description,
    url: absoluteUrl(path),
    image: absoluteUrl(image),
    provider: { '@id': BUSINESS_ID },
    offers: toOffers(options, tourUrl(tour.slug)),
  };
}

// Article for one Channel Report. Written from Garrick's notes, so he is the
// author; the business is the publisher.
export function buildReportSchema({ report, title, path, description }) {
  return {
    '@type': 'Article',
    headline: title,
    description,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    datePublished: new Date(report.published_at).toISOString(),
    dateModified: new Date(report.updated_at).toISOString(),
    author: { '@type': 'Person', name: 'Captain Garrick', url: absoluteUrl('/about/') },
    publisher: { '@id': BUSINESS_ID },
    image: absoluteUrl('/images/hero-channel-islands.jpg'),
    about: { '@type': 'Place', name: 'Santa Barbara Channel' },
  };
}

// crumbs: [{ name, path }], home first.
export function buildBreadcrumbSchema(crumbs) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

// Serialise for a <script type="application/ld+json"> tag. Descriptions come
// from the database, so `<` is escaped: a literal "</script>" inside a value
// must not be able to close the tag. < is still valid JSON.
export function jsonLdString(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
