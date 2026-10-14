import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTourWithOptions, fromPrice } from '@/lib/catalog';
import { buildTourProductSchema, buildBreadcrumbSchema, jsonLdString } from '@/lib/structuredData';
import { pageMetadata } from '@/lib/seo';
import BookingFlow from './BookingFlow';
import styles from '../book.module.css';

export const dynamic = 'force-dynamic';

// Built from the catalog row rather than the tagline, which is a few words
// ("8 Hours - Enjoy a Day of Adventure") and reads as an empty search snippet.
function describeTour(tour, options) {
  const price = fromPrice(options);
  if (!price) return tour.tagline;
  const hours = [...new Set(options.map((o) => o.duration_min / 60))].sort((a, b) => a - b);
  const span = hours.length === 1
    ? `${hours[0]} hours`
    : hours.length === 2 ? `${hours[0]} or ${hours[1]} hours` : `${hours[0]} to ${hours.at(-1)} hours`;
  return `${tour.name} in Santa Barbara: a private charter for up to ${tour.max_party} guests, ${span}, from ${price.fromUsd} with all fees included. Departs Marina 3, Santa Barbara Harbor.`;
}

export async function generateMetadata({ params }) {
  const { tour: slug } = await params;
  const result = await getTourWithOptions(slug);
  if (!result) return { title: 'Book Your Adventure' };
  const { tour, options } = result;
  return pageMetadata({
    path: `/book/${slug}/`,
    title: `Book ${tour.name}`,
    description: describeTour(tour, options),
    image: tour.image_url || undefined,
    imageAlt: tour.name,
  });
}

export default async function BookTourPage({ params, searchParams }) {
  const { tour: slug } = await params;
  const result = await getTourWithOptions(slug);
  if (!result) notFound();
  const { tour, options } = result;

  // ?date=&option=&party= preselects a trip (the abandoned-checkout email links
  // here). Anything that doesn't match this tour is ignored, not an error.
  const query = await searchParams;
  const initial = {};
  if (/^\d{4}-\d{2}-\d{2}$/.test(query.date || '')) initial.date = query.date;
  if (options.some((o) => String(o.id) === query.option)) initial.optionId = Number(query.option);
  const party = Number(query.party);
  if (Number.isInteger(party) && party >= 1 && party <= tour.max_party) initial.party = party;

  const stripeReady = Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT_ID
  );

  return (
    <>
      {/* Product/Offer schema from the live catalog — see lib/structuredData.js */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(buildTourProductSchema(tour, options)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString({
            '@context': 'https://schema.org',
            ...buildBreadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Book', path: '/book/' },
              { name: tour.name, path: `/book/${tour.slug}/` },
            ]),
          }),
        }}
      />
      <section className={styles.hero} style={{ paddingBottom: '2rem' }}>
        <div className="container">
          <p style={{ margin: '0 0 0.5rem' }}>
            <Link href="/book" style={{ color: 'var(--color-silver)', fontSize: '0.85rem', textDecoration: 'none' }}>
              ← All adventures
            </Link>
          </p>
          <h1 className={styles.heroTitle}>{tour.name}</h1>
          <p className={styles.heroSubtitle}>{tour.tagline}</p>
        </div>
      </section>

      <BookingFlow
        tour={{
          slug: tour.slug,
          name: tour.name,
          maxParty: tour.max_party,
          minNoticeHours: tour.min_notice_hours,
          meetingPoint: tour.meeting_point,
          policyText: tour.policy_text,
          callToBookPhone: tour.call_to_book_phone,
          imageUrl: tour.image_url,
          description: tour.description,
          season: tour.season_start ? { start: tour.season_start, end: tour.season_end } : null,
        }}
        options={options.map((o) => ({
          id: o.id,
          label: o.label,
          durationMin: o.duration_min,
          baseCents: o.base_cents,
          displayCents: o.display_cents,
        }))}
        stripeReady={stripeReady}
        initial={initial}
      />
    </>
  );
}
