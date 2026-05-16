import styles from '../about/about.module.css';

export const metadata = {
  title: 'Gift Cards | Santa Barbara Boat Charter Experiences',
  description: 'Give the gift of adventure. Purchase Santa Barbara Boat Charter gift cards for Channel Islands tours, sunset cruises, fishing charters, and more.',
  openGraph: {
    title: 'Gift Cards | Santa Barbara Boat Charters',
    description: 'Give the gift of an unforgettable ocean adventure. Gift cards for Channel Islands tours, sunset cruises, spearfishing, and more.',
    images: [{ url: 'https://www.sbboatcharters.com/images/sunset-cruise.webp', width: 1200, height: 630, alt: 'Santa Barbara boat charter gift card' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.sbboatcharters.com/images/sunset-cruise.webp'],
  },
  alternates: { canonical: 'https://www.sbboatcharters.com/gift-cards' },
};

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
            <a href="https://fareharbor.com/embeds/book/boatcharterssb/?full-items=yes" target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--large">
              Purchase Gift Card
            </a>
            <a href="tel:+18057222282" className="btn btn--outline-dark btn--large">
              Call to Order
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
