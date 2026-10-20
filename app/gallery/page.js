import GalleryClient from './gallery-client';

// Behold (https://behold.so) proxies our Instagram feed. Images come from
// `sizes.*.mediaUrl` (behold.pictures CDN) rather than `thumbnailUrl`
// (scontent-*.cdninstagram.com), because IG CDN URLs are signed with an `oe=`
// expiry and start 403'ing. The behold.pictures URLs are permanent.
//
// Videos have no permanent copy: `mediaUrl` is an IG CDN mp4 that expires
// about a day after Behold refreshes the feed. Regenerating the page hourly
// keeps it fresh, and the lightbox falls back to Instagram's embed player if
// the mp4 has already expired.
const BEHOLD_FEED_URL = 'https://feeds.behold.so/IPThnsG26cFRO8TKAAQS';

// ISR: rebuild the page in the background at most once an hour, so new posts
// appear without a redeploy and video URLs stay as fresh as traffic allows.
export const revalidate = 3600;

const imageFrom = (sizes, size, fallback) =>
  sizes?.[size]?.mediaUrl ||
  sizes?.large?.mediaUrl ||
  sizes?.medium?.mediaUrl ||
  sizes?.small?.mediaUrl ||
  fallback ||
  '';

const shortcodeFrom = (permalink) =>
  permalink?.match(/\/(?:p|reel|tv)\/([^/?#]+)/)?.[1] || '';

async function getInstagramFeed() {
  try {
    const res = await fetch(BEHOLD_FEED_URL);
    if (!res.ok) {
      throw new Error(`Behold feed responded ${res.status}`);
    }
    const data = await res.json();
    const posts = (data.posts || []).map((p) => {
      const isVideo = p.mediaType === 'VIDEO';
      return {
        id: p.id,
        timestamp: p.timestamp,
        permalink: p.permalink,
        shortcode: shortcodeFrom(p.permalink),
        mediaType: p.mediaType,
        isReel: Boolean(p.isReel),
        // Grid tile and lightbox image (or video poster).
        thumbnailUrl: imageFrom(p.sizes, 'medium', p.thumbnailUrl),
        imageUrl: imageFrom(p.sizes, 'large', p.thumbnailUrl),
        videoUrl: isVideo ? p.mediaUrl || '' : '',
        children: (p.children || []).map((c) => ({
          id: c.id,
          mediaType: c.mediaType,
          imageUrl: imageFrom(c.sizes, 'large', c.thumbnailUrl || c.mediaUrl),
          videoUrl: c.mediaType === 'VIDEO' ? c.mediaUrl || '' : '',
        })),
        prunedCaption: p.prunedCaption || p.caption || '',
      };
    });
    return {
      profilePictureUrl: data.profilePictureUrl || '',
      followersCount: data.followersCount || 0,
      posts,
    };
  } catch (err) {
    console.error('[gallery] Failed to fetch Behold feed:', err);
    // During a background regeneration, throwing makes Next keep serving the
    // last good page instead of caching an empty feed for an hour. At build
    // time there is no previous page, so render without Instagram posts.
    if (process.env.NEXT_PHASE !== 'phase-production-build') throw err;
    return { profilePictureUrl: '', followersCount: 0, posts: [] };
  }
}

export default async function GalleryPage() {
  const instagramData = await getInstagramFeed();
  return <GalleryClient instagramData={instagramData} />;
}
