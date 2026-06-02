import GalleryClient from './gallery-client';

// Behold (https://behold.so) proxies our Instagram feed and serves thumbnails
// from a stable CDN. We fetch at build time so the static export contains the
// latest posts — and crucially we use `post.sizes.*.mediaUrl` (behold.pictures
// CDN) instead of `post.thumbnailUrl` (scontent-*.cdninstagram.com), because
// the IG CDN URLs are signed with an `oe=` expiry and start 403'ing after
// ~2 weeks. The behold.pictures URLs are permanent.
const BEHOLD_FEED_URL = 'https://feeds.behold.so/IPThnsG26cFRO8TKAAQS';

async function getInstagramFeed() {
  try {
    // Compatible with `output: 'export'` — fetched once at build time and
    // baked into the static HTML. Each deploy picks up the latest posts.
    const res = await fetch(BEHOLD_FEED_URL);
    if (!res.ok) {
      throw new Error(`Behold feed responded ${res.status}`);
    }
    const data = await res.json();
    const posts = (data.posts || []).map((p) => ({
      id: p.id,
      timestamp: p.timestamp,
      permalink: p.permalink,
      mediaType: p.mediaType,
      isReel: Boolean(p.isReel),
      // Prefer the medium Behold-CDN derivative; fall back through large/small
      // before the IG CDN URL as a last resort.
      thumbnailUrl:
        p.sizes?.medium?.mediaUrl ||
        p.sizes?.large?.mediaUrl ||
        p.sizes?.small?.mediaUrl ||
        p.thumbnailUrl,
      prunedCaption: p.prunedCaption || p.caption || '',
    }));
    return {
      profilePictureUrl: data.profilePictureUrl || '',
      followersCount: data.followersCount || 0,
      posts,
    };
  } catch (err) {
    console.error('[gallery] Failed to fetch Behold feed:', err);
    return { profilePictureUrl: '', followersCount: 0, posts: [] };
  }
}

export default async function GalleryPage() {
  const instagramData = await getInstagramFeed();
  return <GalleryClient instagramData={instagramData} />;
}
