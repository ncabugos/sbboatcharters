import { getTourWithOptions } from '@/lib/catalog';
import { buildTouristTripSchema, buildBreadcrumbSchema, jsonLdString } from '@/lib/structuredData';

// TouristTrip + BreadcrumbList JSON-LD for an experience page. Offers come from
// the same catalog rows checkout uses, so prices here can't drift from /book/.
// slug: the tour's catalog slug (the /book/<slug>/ page this experience sells).
// path, title, description, image: the experience page's own canonical path,
// breadcrumb label, meta description and share image.
export default async function TripSchema({ slug, path, title, description, image }) {
  const result = await getTourWithOptions(slug);
  if (!result) return null;
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      buildTouristTripSchema({ ...result, path, description, image }),
      buildBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: title, path }]),
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}
