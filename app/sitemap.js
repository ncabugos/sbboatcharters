import { sql } from '@/lib/db';

const SITE = 'https://www.sbboatcharters.com';

// Regenerated hourly rather than pinned at build time, so a tour added to or
// retired from the catalog appears without waiting for a deploy.
export const revalidate = 3600;

// next.config.mjs sets trailingSlash: true, so `/about` 308s to `/about/`. Every
// URL here therefore ends in a slash: a sitemap full of redirects is reported in
// Search Console as "Page with redirect" and the target never gets credited.
const MARKETING = [
  '/',
  '/about/',
  '/the-belafonte/',
  '/channel-islands-tour/',
  '/coastal-sunset-cruises/',
  '/spearfishing/',
  '/lobster-diving/',
  '/sport-fishing/',
  '/foiling/',
  '/gallery/',
  '/faq/',
  '/contact/',
  '/gift-cards/',
  '/gift-cards/purchase/',
  '/book/',
];

// Deliberately absent:
//   /admin/*                 login-gated, carries robots: index:false
//   /api/*                   not pages
//   /book/confirmation/[token]  a customer's own booking, robots: index:false
//
// lastModified is also deliberately absent. Google ignores a lastmod it finds
// untrustworthy, and there is no honest source for one here: stamping every URL
// with the build time would claim the whole site changed on every deploy, and
// Vercel's shallow clone makes git commit dates unreliable. No lastmod beats a
// lying one — priority and changefreq are omitted for the same reason, Google
// has never used them.
export default async function sitemap() {
  const entries = MARKETING.map((path) => ({ url: `${SITE}${path}` }));

  // A booking page per bookable tour. These are real landing pages with their own
  // titles and canonicals, not just checkout steps.
  try {
    const tours = await sql`SELECT slug FROM tours WHERE active ORDER BY sort_order`;
    for (const { slug } of tours) {
      entries.push({ url: `${SITE}/book/${slug}/` });
    }
  } catch {
    // The catalog lives in Neon. If it is unreachable, serve the marketing pages
    // rather than a 500 — Search Console treats a failed fetch as the whole
    // sitemap being broken, which is far worse than a temporarily short one.
  }

  return entries;
}
