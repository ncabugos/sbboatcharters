const SITE = 'https://www.sbboatcharters.com';

export default function robots() {
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      // Login-gated and not pages, respectively. /book/confirmation/ is left
      // crawlable on purpose: it already carries robots: index:false, and
      // disallowing it here would stop Google reading that directive.
      disallow: ['/admin/', '/api/'],
    }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
