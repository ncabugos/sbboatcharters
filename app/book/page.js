import Link from 'next/link';
import { sql } from '@/lib/db';
import { formatUsd } from '@/lib/pricing';
import styles from './book.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Book Your Adventure',
  description:
    'Book a private Santa Barbara boat charter: coastal & sunset cruises, Channel Islands tours, whale watching, fishing, foiling, and custom adventures.',
  alternates: { canonical: 'https://www.sbboatcharters.com/book' },
};

export default async function BookPage() {
  const tours = await sql`
    SELECT t.*, min(p.display_cents) AS from_cents
    FROM tours t
    JOIN pricing_options p ON p.tour_id = t.id AND p.active
    WHERE t.active
    GROUP BY t.id
    ORDER BY t.sort_order`;

  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <span className="section-label" style={{ color: 'var(--color-accent)' }}>
            Private 6-Passenger Charters
          </span>
          <h1 className={styles.heroTitle}>Book Your Adventure</h1>
          <p className={styles.heroSubtitle}>
            Pick your trip, choose a date and time, and you&apos;re on the water.
            Booking takes less than two minutes.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.grid}>
            {tours.map((tour) => (
              <article key={tour.id} className={styles.card}>
                {tour.image_url && (
                  <img src={tour.image_url} alt={tour.name} className={styles.cardImage} loading="lazy" />
                )}
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{tour.name}</h2>
                  <p className={styles.cardTagline}>{tour.tagline}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.fromPrice}>
                      From <strong>{formatUsd(tour.from_cents)}</strong>
                    </span>
                    <Link href={`/book/${tour.slug}`} className="btn btn--primary">
                      Select Date
                    </Link>
                  </div>
                </div>
              </article>
            ))}
            <article className={styles.card}>
              <div className={styles.cardBody} style={{ justifyContent: 'center', textAlign: 'center', minHeight: '16rem' }}>
                <h2 className={styles.cardTitle}>Gift Card</h2>
                <p className={styles.cardTagline}>Give them an experience they&apos;ll remember. Any amount, never expires.</p>
                <div style={{ marginTop: '0.75rem' }}>
                  <Link href="/gift-cards/purchase" className="btn btn--primary">
                    Buy a Gift Card
                  </Link>
                </div>
              </div>
            </article>
          </div>
          <p className={styles.feeNote}>
            All prices are in US dollars and include all booking fees — the price you see is the
            total you pay, with nothing added at checkout. Questions? Call{' '}
            <a href="tel:+18057222282" style={{ color: 'var(--color-accent)' }}>(805) 722-2282</a>.
          </p>
        </div>
      </section>
    </>
  );
}
