import Link from 'next/link';
import styles from '../about/about.module.css';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  path: '/gift-cards/',
  title: 'Boat Charter Gift Cards',
  description:
    'Give the gift of adventure. Santa Barbara Boat Charters gift cards work for Channel Islands tours, sunset cruises, fishing charters and more.',
  image: '/images/sunset-cruise.webp',
  imageAlt: 'Santa Barbara boat charter gift card',
});

export default function GiftCards() {
  return (
    <>
      <section className={styles.hero}>
        <img src="/images/generated/sunset-channel.png" alt="Sunset on the Santa Barbara Channel" className={styles.heroBgImage} loading="eager" fetchPriority="high" />
        <div className={styles.heroOverlay} style={{ background: 'rgba(10,15,22,0.68)' }} />
        <div className={`container ${styles.heroContent}`}>
          <span className={styles.heroLabel}>Give Adventure</span>
          <h1 className={styles.heroTitle}>Gift Cards</h1>
          <p className={styles.heroSubtitle}>
            Give the gift of an unforgettable experience on the Santa Barbara coast.
          </p>
        </div>
      </section>

      <section className={`section ${styles.story}`}>
        <div className="container container--narrow" style={{ textAlign: 'center' }}>
          <span className="section-label">The Perfect Gift</span>
          <h2 className="section-title">Give an Ocean Experience</h2>
          <p className={styles.text} style={{ marginInline: 'auto', marginBottom: '1.5rem' }}>
            Looking for a unique gift? Give your loved ones a private boat charter experience
            in Santa Barbara. Whether it's a sunset cruise, a Channel Islands adventure, or a
            thrilling spearfishing expedition, our gift cards let them choose their own adventure.
          </p>
          <p className={styles.text} style={{ marginInline: 'auto', marginBottom: '3rem' }}>
            Gift cards are available in any amount and can be applied to any of our charter
            experiences. They never expire and make the perfect birthday, anniversary, or
            holiday gift.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/gift-cards/purchase/" className="btn btn--primary btn--large">
              Purchase Gift Card
            </Link>
            <a href="tel:+18057222282" className="btn btn--outline-dark btn--large">
              Call to Order
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
