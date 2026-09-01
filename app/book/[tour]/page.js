import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTourWithOptions } from '@/lib/catalog';
import { buildTourProductSchema, jsonLdString } from '@/lib/structuredData';
import BookingFlow from './BookingFlow';
import styles from '../book.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { tour: slug } = await params;
  const result = await getTourWithOptions(slug);
  if (!result) return { title: 'Book Your Adventure' };
  return {
    title: `Book ${result.tour.name}`,
    description: result.tour.tagline,
    alternates: { canonical: `https://www.sbboatcharters.com/book/${slug}/` },
  };
}

export default async function BookTourPage({ params }) {
  const { tour: slug } = await params;
  const result = await getTourWithOptions(slug);
  if (!result) notFound();
  const { tour, options } = result;

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
        }}
        options={options.map((o) => ({
          id: o.id,
          label: o.label,
          durationMin: o.duration_min,
          baseCents: o.base_cents,
          displayCents: o.display_cents,
        }))}
        stripeReady={stripeReady}
      />
    </>
  );
}
