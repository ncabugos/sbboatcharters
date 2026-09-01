import Link from 'next/link';
import styles from './coastal-sunset-cruises.module.css';
import { getTourPricing, CALL_FOR_PRICING } from '@/lib/catalog';

// Prices come from the same catalog rows checkout uses, regenerated hourly, so a
// price changed in the database shows here without a deploy.
export const revalidate = 3600;

export async function generateMetadata() {
  const p = await getTourPricing('coastal-sunset-cruise');
  return {
    title: 'Coastal & Sunset Cruises Santa Barbara | Private Boat Charter',
    description:
      `Private coastal and sunset cruises in Santa Barbara. Watch the sun set over the Pacific from the water. Wildlife, celebrations, photography & custom routes.${p ? ` From ${p.fromUsd} for ${p.hours} hours, all fees included.` : ''} Up to 6 passengers.`,
    openGraph: {
      title: 'Coastal & Sunset Cruises | Santa Barbara Boat Charters',
      description: `Private sunset cruises on the Santa Barbara Channel. Dolphins, sea caves, golden hour views${p ? ` — from ${p.fromUsd}` : ''} for up to 6 passengers.`,
      images: [{ url: 'https://www.sbboatcharters.com/images/sunset-cruise.webp', width: 1200, height: 630, alt: 'Sunset cruise Santa Barbara' }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['https://www.sbboatcharters.com/images/sunset-cruise.webp'],
    },
    alternates: { canonical: 'https://www.sbboatcharters.com/coastal-sunset-cruises/' },
  };
}

const HIGHLIGHTS = [
  { image: '/images/generated/sunset-channel.png', title: 'Sunset Cruises', desc: 'Watch the sun descend into the Pacific in a golden blaze of color — a front-row seat from the water.' },
  { image: '/images/generated/santa-cruz-coastline.png', title: 'Coastal Sightseeing', desc: 'Panoramic views of the Santa Ynez Mountains meeting the sea. The "American Riviera" at its finest.' },
  { image: '/images/experiences-wildlife-encounters.png', title: 'Wildlife Encounters', desc: 'Dolphins, seals, pelicans, and seasonal whale sightings are a regular part of the cruise experience.' },
  { image: '/images/experiences-celebrations.jpeg', title: 'Celebrations', desc: 'Perfect for birthdays, anniversaries, proposals, or any special occasion. BYOB or request catering.' },
  { image: '/images/photography-thumbnail.webp', title: 'Photography', desc: 'Golden hour on the water provides some of the most stunning photo opportunities in Santa Barbara.' },
  { image: '/images/experiences-custom-routes.jpeg', title: 'Custom Routes', desc: 'From Carpinteria to Hollister Ranch — tell us where you want to go and we\'ll chart the course.' },
];

const DETAIL_ICONS = {
  clock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  dollar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  pin: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  sun: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
};

export default async function CoastalSunsetCruises() {
  const p = await getTourPricing('coastal-sunset-cruise');
  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <img src="/images/sunset-cruise.webp" alt="Sunset cruise on the Santa Barbara Channel" className={styles.heroBgImage} loading="eager" fetchPriority="high" />
        <div className={styles.heroOverlay} />
        <div className={`container ${styles.heroContent}`}>
          <span className={styles.heroLabel}>Private Cruises{p ? ` · From ${p.fromUsd}` : ''}</span>
          <h1 className={styles.heroTitle}>Coastal &amp; Sunset Cruises</h1>
          <p className={styles.heroSubtitle}>
            Panoramic views of the American Riviera from the water. The best way to experience Santa Barbara's legendary coastline and sunsets.
          </p>
          <div className={styles.heroActions}>
            <Link href="/book/coastal-sunset-cruise/" className="btn btn--primary btn--large">Book a Cruise</Link>
            <a href="tel:+18057222282" className="btn btn--secondary btn--large">Call (805) 722-2282</a>
          </div>
        </div>
        <div className={styles.heroScroll}><div className={styles.scrollLine} /></div>
      </section>

      {/* INFO + DETAILS CARD */}
      <section className={`section ${styles.info}`}>
        <div className={`container ${styles.infoGrid}`}>
          <div className={styles.infoContent}>
            <span className="section-label">The Experience</span>
            <h2 className="section-title">Santa Barbara's Best View is from the Water</h2>
            <div className={styles.divider} />
            <p className={styles.infoText}>
              Our private coastal and sunset cruises offer gorgeous panoramic views of the Santa Barbara coastline. Depending on conditions and your desires, the experience runs as far south as <strong>Carpinteria</strong> or as far north as the exclusive <strong>Hollister Ranch</strong>.
            </p>
            <p className={styles.infoText}>
              Clients often say this is the best view of the American Riviera — and we're inclined to agree. We know the waters, the wildlife patterns, and the perfect spots to anchor for that golden-hour moment.
            </p>
            <p className={styles.infoText}>
              Whether it's a casual afternoon with friends, a romantic sunset for two, or a small celebration on the water, we'll craft the perfect cruise for your group.
            </p>
          </div>
          <div className={styles.detailsCard}>
            <h3 className={styles.detailsTitle}>Cruise Details</h3>
            {[
              { icon: 'clock', label: 'Duration', value: '2-hour minimum (customizable)' },
              { icon: 'dollar', label: 'Pricing', value: p?.label ?? CALL_FOR_PRICING },
              { icon: 'users', label: 'Capacity', value: 'Up to 6 passengers' },
              { icon: 'pin', label: 'Departure', value: 'Santa Barbara Harbor, Marina 3' },
              { icon: 'sun', label: 'Best Time', value: 'Late afternoon for golden hour & sunset' },
            ].map((d) => (
              <div key={d.label} className={styles.detailItem}>
                <span className={styles.detailIcon}>{DETAIL_ICONS[d.icon]}</span>
                <div><span className={styles.detailLabel}>{d.label}</span><span className={styles.detailValue}>{d.value}</span></div>
              </div>
            ))}
            <Link href="/book/coastal-sunset-cruise/" className={`btn btn--primary ${styles.bookingCTA}`}>Book a Cruise</Link>
            <a href="tel:+18057222282" className={styles.phoneLink}>Or call (805) 722-2282</a>
          </div>
        </div>
      </section>

      {/* IMAGE-HEAVY EXPERIENCE GRID */}
      <section className={`section ${styles.highlights}`}>
        <div className="container">
          <div className={styles.highlightsHeader}>
            <span className="section-label">What to Expect</span>
            <h2 className="section-title">Your Cruise Experience</h2>
          </div>
          <div className={styles.highlightsGrid}>
            {HIGHLIGHTS.map((h, i) => (
              <div key={h.title} className={styles.highlightCard} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className={styles.highlightImageWrap}>
                  <img src={h.image} alt={h.title} className={styles.highlightImage} />
                  <div className={styles.highlightImageOverlay} />
                </div>
                <div className={styles.highlightBody}>
                  <h3 className={styles.highlightTitle}>{h.title}</h3>
                  <p className={styles.highlightDesc}>{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.serviceCTA}>
        <img src="/images/sunset-cruise.webp" alt="" className={styles.ctaBgImg} aria-hidden="true" />
        <div className="container">
          <h2 className={styles.ctaTitle}>Book Your Coastal Experience</h2>
          <p className={styles.ctaText}>There's no better way to see Santa Barbara than from the water. Reserve your private cruise for an unforgettable experience on the American Riviera.</p>
          <div className={styles.ctaActions}>
            <Link href="/book/coastal-sunset-cruise/" className="btn btn--primary btn--large">Book Your Cruise</Link>
            <a href="tel:+18057222282" className="btn btn--secondary btn--large">Call (805) 722-2282</a>
          </div>
        </div>
      </section>
    </>
  );
}
