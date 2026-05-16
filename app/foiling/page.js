import styles from '../components/ServicePage.module.css';

export const metadata = {
  title: 'Foiling Adventures Santa Barbara | Learn to Fly Above the Water',
  description:
    'Foiling lessons and charters in Santa Barbara. Learn to hydrofoil above the water on the protected Santa Barbara coast. All skill levels welcome. Private sessions with expert instruction.',
  openGraph: {
    title: 'Foiling Adventures | Santa Barbara Boat Charters',
    description: 'Experience the thrill of foiling above the water in Santa Barbara. Private lessons for all skill levels on the beautiful California coast.',
    images: [{ url: 'https://www.sbboatcharters.com/images/foiling-sbboatcharters.jpeg', width: 1200, height: 630, alt: 'Foiling in Santa Barbara' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.sbboatcharters.com/images/foiling-sbboatcharters.jpeg'],
  },
  alternates: { canonical: 'https://www.sbboatcharters.com/foiling' },
};

export default function Foiling() {
  return (
    <>
      <section className={styles.hero}>
        <img src="/images/instagram/SBCharters-IG-3.jpeg" alt="Foiling on the water" className={styles.heroBgImage} loading="eager" fetchPriority="high" />
        <div className={styles.heroOverlay} style={{ background: 'linear-gradient(165deg, rgba(10,22,40,0.78) 0%, rgba(13,79,82,0.6) 100%)' }} />
        <div className={`container ${styles.heroContent}`}>
          <span className={styles.heroLabel}>Adventure Sport · All Levels</span>
          <h1 className={styles.heroTitle}>Foiling Adventures</h1>
          <p className={styles.heroSubtitle}>
            Take your board skills to the next level. Experience the thrill of flying
            above the water on the beautiful Santa Barbara coast.
          </p>
        </div>
      </section>

      <section className={`section ${styles.info}`}>
        <div className={`container ${styles.infoGrid}`}>
          <div className={styles.infoContent}>
            <span className="section-label">The Thrill</span>
            <h2 className="section-title">Learn to Fly Above the Water</h2>
            <div className={styles.divider}></div>
            <p className={styles.infoText}>
              Foiling is one of the most exhilarating water sports in the world. Using a hydrofoil
              mounted beneath your board, you literally lift out of the water and glide above
              the surface — a sensation unlike anything else.
            </p>
            <p className={styles.infoText}>
              Santa Barbara's calm, protected waters make it an ideal location to learn foiling.
              Whether you're transitioning from surfing, kiteboarding, or starting fresh,
              our lessons are tailored to your experience level.
            </p>
            <p className={styles.infoText}>
              This sport will take your board skills to the next level. The feeling of rising
              above the chop and gliding silently across the surface is something our guests
              never forget.
            </p>
          </div>
          <div className={styles.detailsCard}>
            <h3 className={styles.detailsTitle}>Foiling Details</h3>
            {[
              { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, label: 'Location', value: 'Santa Barbara Coast' },
              { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>, label: 'Experience', value: 'All levels welcome' },
              { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, label: 'Pricing', value: 'Contact us for details' },
            ].map((d) => (
              <div key={d.label} className={styles.detailItem}>
                <span className={styles.detailIcon}>{d.svg}</span>
                <div><span className={styles.detailLabel}>{d.label}</span><span className={styles.detailValue}>{d.value}</span></div>
              </div>
            ))}
            <a href="https://fareharbor.com/embeds/book/boatcharterssb/?full-items=yes" target="_blank" rel="noopener noreferrer" className={`btn btn--primary ${styles.bookingCTA}`}>Book Foiling</a>
            <a href="tel:+18057222282" className={styles.phoneLink}>Or call (805) 722-2282</a>
          </div>
        </div>
      </section>

      <section className={styles.vesselGallery}>
        <div className={styles.vesselGalleryGrid}>
          {[
            { src: '/images/foiling-sbboatcharters.jpeg', alt: 'Foiling in Santa Barbara' },
            { src: '/images/foiling-santa-barbara.webp', alt: 'Foiling above the water in Santa Barbara' },
            { src: '/images/foiling.webp', alt: 'Foiling charter Santa Barbara' },
          ].map((img) => (
            <div key={img.src} className={styles.vesselGalleryItem} style={{ aspectRatio: '3/4' }}>
              <img src={img.src} alt={img.alt} />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.serviceCTA}>
        <img src="/images/sunset-cruise.webp" alt="" className={styles.ctaBgImg} aria-hidden="true" />
        <div className="container">
          <h2 className={styles.ctaTitle}>Ready to Fly?</h2>
          <p className={styles.ctaText}>Contact us to arrange your foiling lesson and experience the future of water sports in Santa Barbara.</p>
          <div className={styles.ctaActions}>
            <a href="https://fareharbor.com/embeds/book/boatcharterssb/?full-items=yes" target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--large">Book Foiling</a>
            <a href="tel:+18057222282" className="btn btn--secondary btn--large">Call (805) 722-2282</a>
          </div>
        </div>
      </section>
    </>
  );
}
