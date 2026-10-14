import { SITE } from '@/lib/structuredData';

export const SITE_NAME = 'Santa Barbara Boat Charters';

// 1200x630, the size every share card renders without cropping.
export const DEFAULT_OG_IMAGE = '/og-image.jpg';

// Next merges metadata shallowly: a page that sets its own `openGraph` replaces
// the root one wholesale, silently dropping og:url, og:type and og:site_name, and
// a page that sets none inherits the homepage's og:url and title. Every page
// builds its tags here so none go missing and og:url always equals the canonical.
//
// path: canonical path with its trailing slash ('/sport-fishing/').
// title: the page title before the layout template adds the brand, or
//   { absolute } for a page that writes its own full title (the homepage).
export function pageMetadata({ path, title, description, image = DEFAULT_OG_IMAGE, imageAlt }) {
  const url = `${SITE}${path}`;
  const imageUrl = /^https?:\/\//.test(image) ? image : `${SITE}${image}`;
  const shareTitle = typeof title === 'string' ? `${title} | ${SITE_NAME}` : title.absolute;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      url,
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_US',
      title: shareTitle,
      description,
      images: [{ url: imageUrl, alt: imageAlt || shareTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      images: [imageUrl],
    },
  };
}
