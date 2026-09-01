// Live Google reviews for the homepage wall, via Places API (New).
//
// Why live instead of hand-copied quotes: the things that make a review read as
// genuinely verified — the reviewer's real avatar, a link to their actual Google
// profile, a timestamp that keeps moving — can't be faked in a static array. If
// this ever falls back to curated text (see getGoogleReviews returning null),
// the page MUST drop the Google branding with it. Rendering someone else's badge
// over content Google didn't serve us is the one thing this module exists to avoid.

// Santa Barbara Boat Charters, 300 W Cabrillo Blvd. Not a secret — place IDs are
// public and Google explicitly permits storing them indefinitely (unlike the
// review payload, which is cache-limited). Kept here rather than in env so the
// listing being pointed at is greppable.
const PLACE_ID = 'ChIJ8fH3JxsT6YAR9Kr34FGVMtM';

// Billing is per-SKU and charged at the tier of the most expensive field asked
// for, so this list stays minimal. `reviews` alone puts the call in Place Details
// Enterprise; adding anything atmospheric here costs real money for no benefit.
const FIELD_MASK = 'rating,userRatingCount,googleMapsUri,reviews';

// Once a day. Google's Maps Platform terms cap caching of Places content at 30
// days, so this is well inside the line, and it keeps us at ~30 calls/month
// against a free tier in the thousands.
const REVALIDATE_SECONDS = 86_400;

// Reviews kept off the homepage wall. These are real and stay visible on Google —
// the "read all reviews" link goes to the unfiltered listing — this only governs
// what gets merchandised on the marketing page.
//
// Keyed on the trailing segment of a review's `name`, which is stable per review.
const SUPPRESSED_REVIEW_IDS = new Set([
  // Paula Christiansen, Apr 2026 — a memorial trip to scatter her brother's
  // ashes off Rincon Point. Genuine 5 stars, but not something to run as an ad
  // between a bachelor party and a fishing charter. Owner's call, Sept 2026.
  'Ci9DQUlRQUNvZENodHljRjlvT2xwSFVYWkViRGQ0ZEZaRlVEVlZiMGxVT0VOQ2IzYxAB',
]);

// Three keeps the existing 3-column grid intact. Google caps its response at 5
// anyway, so after suppression there's rarely more than one in reserve.
const MAX_CARDS = 3;

function reviewIdFrom(name) {
  // `places/{placeId}/reviews/{reviewId}`
  return typeof name === 'string' ? name.split('/').pop() : null;
}

/**
 * Fetches the live listing rating and reviews.
 *
 * Returns null on any failure — a missing key, a Google outage, a shape change.
 * The homepage treats null as "render the curated fallback, unbranded", so a bad
 * day at Google degrades the section instead of taking down the whole page.
 */
export async function getGoogleReviews() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    // Not an error: local checkouts and previews without the key just get the
    // unbranded fallback.
    return null;
  }

  let payload;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}`, {
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      // 403 here almost always means the key regained an HTTP-referrer
      // restriction — those only work for browser calls, and this one is
      // server-side, so it arrives with no referer and Google rejects it.
      console.error('[googleReviews] Places API %s: %s', res.status, await res.text());
      return null;
    }

    payload = await res.json();
  } catch (err) {
    console.error('[googleReviews] fetch failed', err);
    return null;
  }

  const reviews = (payload.reviews ?? [])
    .filter((r) => !SUPPRESSED_REVIEW_IDS.has(reviewIdFrom(r.name)))
    .filter((r) => r.text?.text && r.authorAttribution?.displayName)
    // Google orders by its own relevance ranking and offers no sort parameter.
    // Newest-first is the better fit here: the whole point of going live is that
    // a fresh review shows up on its own, and "a month ago" on the lead card is
    // what signals the wall is current rather than assembled once and forgotten.
    .sort((a, b) => new Date(b.publishTime ?? 0) - new Date(a.publishTime ?? 0))
    .slice(0, MAX_CARDS)
    .map((r) => ({
      id: reviewIdFrom(r.name),
      text: r.text.text,
      rating: r.rating ?? 5,
      // "2 weeks ago" — Google localises and maintains this string, and showing
      // their wording avoids us drifting out of sync with their timestamp.
      relativeTime: r.relativePublishTimeDescription ?? '',
      authorName: r.authorAttribution.displayName,
      authorPhoto: r.authorAttribution.photoUri ?? null,
      authorUri: r.authorAttribution.uri ?? null,
      reviewUri: r.googleMapsUri ?? null,
    }));

  // An empty wall is worse than the curated one, so fall back rather than
  // rendering a Google-branded section with nothing in it.
  if (reviews.length === 0) return null;

  return {
    rating: payload.rating ?? null,
    totalCount: payload.userRatingCount ?? null,
    // Attribution target. Google's terms require review content to link back.
    mapsUri: payload.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`,
    reviews,
  };
}
