import Link from 'next/link';
import styles from '../components/ServicePage.module.css';

export const metadata = {
  title: 'The Belafonte | Stabicraft 2500 Ultracab XL Charter Boat',
  description:
    'Meet the Belafonte — a brand new Stabicraft 2500 Ultracab XL with twin Yamaha 200hp outboards. Built in New Zealand, 100% aluminum construction, USCG inspected. Your vessel for Santa Barbara adventures.',
  openGraph: {
    title: 'The Belafonte | Santa Barbara Boat Charters',
    description: 'The Belafonte — Stabicraft 2500 Ultracab XL with twin Yamaha 200hp outboards. Built for rough seas, perfect for the Santa Barbara Channel.',
    images: [{ url: 'https://www.sbboatcharters.com/images/belafonte/boating-in-santa-barbara.webp', width: 1200, height: 630, alt: 'The Belafonte charter boat Santa Barbara' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.sbboatcharters.com/images/belafonte/boating-in-santa-barbara.webp'],
  },
  alternates: { canonical: 'https://www.sbboatcharters.com/the-belafonte' },
};

export default function TheBelafonte() {
  return (
    <>
      <section className={styles.hero}>
        <img
          src="/images/belafonte/belafonte.webp"
          alt="The Belafonte — Stabicraft 2500 Ultracab XL"
          className={styles.heroBgImage}
          loading="eager"
          fetchPriority="high"
        />
        <div className={styles.heroImageOverlay}></div>
        <div className={`container ${styles.heroContent}`}>
          <span className={styles.heroLabel}>Our Vessel</span>
          <h1 className={styles.heroTitle}>The Belafonte</h1>
          <p className={styles.heroSubtitle}>
            Stabicraft 2500 Ultracab XL — built on the South Island of New Zealand for
            some of the roughest seas on earth.
          </p>
        </div>
      </section>

      <section className={`section ${styles.info}`}>
        <div className={`container ${styles.infoGrid}`}>
          <div className={styles.infoContent}>
            <span className="section-label">Step Aboard</span>
            <h2 className="section-title">Built for the Channel</h2>
            <div className={styles.divider}></div>
            <p className={styles.infoText}>
              Belafonte is a brand new <strong>Stabicraft 2500 Ultracab XL</strong> rigged with twin Yamaha
              200hp outboards. She was built on the South Island of New Zealand and is designed
              for some of the roughest seas on earth.
            </p>
            <p className={styles.infoText}>
              One of the first things you'll notice is the vessel's <strong>100% aluminum construction</strong> —
              a more durable and rigid material versus fiberglass. Stabicrafts are built with
              <strong> 9,000 lbs of positive buoyancy</strong>, meaning this boat is an aluminum RIB with
              built-in air chambers running the length of the boat on both sides. This adds
              stability in heavy water and provides unsurpassed safety.
            </p>
            <p className={styles.infoText}>
              Belafonte can make it across the Santa Barbara Channel in under an hour in fair seas.
              In rougher conditions, she has 400hp to push her way through whatever the channel
              throws at her. Belafonte undergoes <strong>yearly Coast Guard examinations</strong> to stay
              up to date with the latest regulations and provide the safest service possible.
            </p>
          </div>
          <div className={styles.detailsCard}>
            <h3 className={styles.detailsTitle}>Vessel Specifications</h3>
            <div className={styles.detailItem}><span className={styles.detailIcon}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="8" x2="12" y2="22"/><path d="M5 15c1.8 2.4 4.2 4 7 4s5.2-1.6 7-4"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span><div><span className={styles.detailLabel}>Model</span><span className={styles.detailValue}>Stabicraft 2500 Ultracab XL</span></div></div>
            <div className={styles.detailItem}><span className={styles.detailIcon}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span><div><span className={styles.detailLabel}>Power</span><span className={styles.detailValue}>Twin Yamaha 200hp (400hp total)</span></div></div>
            <div className={styles.detailItem}><span className={styles.detailIcon}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span><div><span className={styles.detailLabel}>Construction</span><span className={styles.detailValue}>100% aluminum with 9,000 lbs buoyancy</span></div></div>
            <div className={styles.detailItem}><span className={styles.detailIcon}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg></span><div><span className={styles.detailLabel}>Built In</span><span className={styles.detailValue}>South Island, New Zealand</span></div></div>
            <div className={styles.detailItem}><span className={styles.detailIcon}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></span><div><span className={styles.detailLabel}>Capacity</span><span className={styles.detailValue}>6 passengers</span></div></div>
            <div className={styles.detailItem}><span className={styles.detailIcon}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></span><div><span className={styles.detailLabel}>Safety</span><span className={styles.detailValue}>USCG inspected annually</span></div></div>
            <Link href="/book/" className={`btn btn--primary ${styles.bookingCTA}`}>Book Your Charter</Link>
          </div>
        </div>
      </section>

      {/* ===== VESSEL PHOTO GALLERY ===== */}
      <section className={styles.vesselGallery}>
        <div className={styles.vesselGalleryGrid}>
          <div className={styles.vesselGalleryItem}>
            <img src="/images/belafonte/belafonte.webp" alt="The Belafonte" />
          </div>
          <div className={styles.vesselGalleryItem}>
            <img src="/images/belafonte/channel-island-charters.webp" alt="Channel Island charters" />
          </div>
          <div className={styles.vesselGalleryItem}>
            <img src="/images/belafonte/boating-in-santa-barbara.webp" alt="Boating in Santa Barbara" />
          </div>
        </div>
      </section>

      <section className={styles.serviceCTA}>
        <img src="/images/sunset-cruise.webp" alt="" className={styles.ctaBgImg} aria-hidden="true" />
        <div className="container">
          <h2 className={styles.ctaTitle}>Ready to Step Aboard the Belafonte?</h2>
          <p className={styles.ctaText}>
            Book your private charter and experience the Santa Barbara Channel
            on the safest, most capable vessel in the harbor.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/book/" className="btn btn--primary btn--large">
              Book Your Charter
            </Link>
            <a href="tel:+18057222282" className="btn btn--secondary btn--large">
              Call (805) 722-2282
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
