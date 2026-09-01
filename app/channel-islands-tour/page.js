import Link from 'next/link';
import styles from '../components/ServicePage.module.css';
import { getTourPricingLabel } from '@/lib/catalog';


// Prices come from the same catalog rows checkout uses, regenerated hourly, so a
// price changed in the database shows here without a deploy.
export const revalidate = 3600;

export const metadata = {
  title: 'Channel Islands Private Boat Tour | 6 or 8 Hour Charters',
  description:
    'Private Channel Islands boat tour from Santa Barbara. Six-hour (3/4 day) or eight-hour (full day) excursions to Santa Cruz Island with snorkeling, sea caves, whale watching & more. Up to 6 passengers. Book your private island adventure today.',
  openGraph: {
    title: 'Channel Islands Private Boat Tour | Santa Barbara Boat Charters',
    description: 'Private 6-hour (3/4 day) or 8-hour (full day) excursion to Santa Cruz Island. Snorkeling, sea caves, whale watching & beach activities for up to 6 passengers.',
    images: [{ url: 'https://www.sbboatcharters.com/images/hero-channel-islands.jpg', width: 1200, height: 630, alt: 'Channel Islands from the water' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.sbboatcharters.com/images/hero-channel-islands.jpg'],
  },
  alternates: { canonical: 'https://www.sbboatcharters.com/channel-islands-tour/' },
};

const HIGHLIGHTS = [
  { image: '/images/santa-cruz-island.webp', title: 'Santa Cruz Island', desc: 'California\'s largest Channel Island with 77 miles of rugged coastline, towering sea cliffs, and pristine beaches.' },
  { image: '/images/marine-wildlife.jpeg', title: 'Marine Wildlife', desc: 'Dolphins, seals, sea lions, and seasonal whale sightings in one of the most biodiverse marine environments.' },
  { image: '/images/instagram/SBCharters-IG-2.jpeg', title: 'Giant Sea Caves', desc: 'Explore Painted Cave — one of the world\'s largest sea caves at over 1,215 feet deep — and dozens more.' },
  { image: '/images/snorkle-diving.webp', title: 'Snorkeling & Diving', desc: 'Crystal-clear waters and lush kelp forests teeming with garibaldi, lobster, and vibrant marine life.' },
  { image: '/images/belafonte/channel-island-charters.webp', title: 'Private Beaches', desc: 'Anchor in secluded coves accessible only by boat. Swim, sunbathe, and explore without the crowds.' },
  { image: '/images/hero-orcas-channel.jpg', title: 'Whale Watching', desc: 'Gray whales (Dec–Apr), blue and humpback whales (May–Aug) — we know the migration routes.' },
];

export default async function ChannelIslandsTour() {
  const pricing = await getTourPricingLabel('full-day-island-cruise');
  return (
    <>
      <section className={styles.hero}>
        <img
          src="/images/hero-channel-islands.jpg"
          alt="Channel Islands aerial view"
          className={styles.heroBgImage}
          loading="eager"
          fetchPriority="high"
        />
        <div className={styles.heroImageOverlay}></div>
        <div className={`container ${styles.heroContent}`}>
          <span className={styles.heroLabel}>Private Island Charter · 6 or 8 Hours</span>
          <h1 className={styles.heroTitle}>Channel Islands Private Boat Tour</h1>
          <p className={styles.heroSubtitle}>
            A six-hour (3/4 day) or eight-hour (full day) private excursion to Santa Cruz Island and the Channel Islands.
            Explore sea caves, snorkel in kelp forests, and discover California's Galápagos.
          </p>
        </div>
      </section>

      <section className={`section ${styles.info}`}>
        <div className={`container ${styles.infoGrid}`}>
          <div className={styles.infoContent}>
            <span className="section-label">The Experience</span>
            <h2 className="section-title">Your Private Island Adventure</h2>
            <div className={styles.divider}></div>
            <p className={styles.infoText}>
              Our private island charter runs six hours (3/4 day) or eight hours (full day), tailored entirely to your desires.
              With over one hundred miles of coastline, we frequently head to <strong>Santa Cruz Island</strong> —
              the largest island in California and the crown jewel of the Channel Islands archipelago.
            </p>
            <p className={styles.infoText}>
              Offering steep cliffs, massive sea caves, secluded coves, and sandy beaches, the
              diversity is unmatched. Captain Garrick has spent over 20 years diving and exploring
              all 8 Channel Islands, compiling an intimate knowledge of every hidden gem along the coast.
            </p>
            <p className={styles.infoText}>
              Whether you want to explore the world-famous <strong>Painted Cave</strong>, search for
              whales and dolphins, swim through lush kelp forests, or simply anchor in a private cove
              for drinks and food — this island charter has you covered.
            </p>
          </div>
          <div className={styles.detailsCard}>
            <h3 className={styles.detailsTitle}>Trip Details</h3>
            {[
              { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, label: 'Duration', value: '6 hours (3/4 day) or 8 hours (full day)' },
              { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'Capacity', value: 'Up to 6 passengers' },
              { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, label: 'Departure', value: 'Santa Barbara Harbor, Marina 3' },
              { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l4-8 4 4 3-5 4 9"/></svg>, label: 'Crossing Time', value: '~1 hour to Santa Cruz Island' },
              { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>, label: 'Activities', value: 'Snorkeling, diving, fishing, surfing, whale watching, beach exploration' },
              { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, label: 'Pricing', value: pricing },
            ].map((d) => (
              <div key={d.label} className={styles.detailItem}>
                <span className={styles.detailIcon}>{d.svg}</span>
                <div>
                  <span className={styles.detailLabel}>{d.label}</span>
                  <span className={styles.detailValue}>{d.value}</span>
                </div>
              </div>
            ))}
            <Link href="/book/full-day-island-cruise/" className={`btn btn--primary ${styles.bookingCTA}`}>
              Book Channel Islands Tour
            </Link>
            <a href="tel:+18057222282" className={styles.phoneLink}>
              Or call (805) 722-2282
            </a>
          </div>
        </div>
      </section>

      <section className={`section ${styles.highlights}`}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="section-label">What Awaits You</span>
            <h2 className="section-title">The Channel Islands Experience</h2>
          </div>
          <div className={styles.highlightsGrid}>
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className={styles.highlightCard}>
                <div className={styles.highlightImageWrap}>
                  <img src={h.image} alt={h.title} />
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

      <section className={`section ${styles.logistics}`}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="section-label">Be Prepared</span>
            <h2 className="section-title">What to Know Before You Go</h2>
          </div>
          <div className={styles.logisticsGrid}>
            <div className={styles.logisticsCard}>
              <h3 className={styles.logisticsCardTitle}>What to Bring</h3>
              <ul className={styles.logisticsList}>
                {['Sunscreen (reef-safe preferred)', 'Hat and sunglasses', 'Layers for wind on the water', 'Swimsuit and towel', 'Camera or waterproof phone case', 'Snacks and drinks (or request catering)', 'Motion sickness medication if needed'].map(item => (
                  <li key={item} className={styles.logisticsItem}>
                    <span className={styles.logisticsCheck}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.logisticsCard}>
              <h3 className={styles.logisticsCardTitle}>Good to Know</h3>
              <ul className={styles.logisticsList}>
                {['Meet at Marina 3 gate, Santa Barbara Harbor', 'Parking available at $2.50/hr in the harbor lot', 'Porto toilet available on board', 'Food & drinks can be provided by special request', 'Every trip is customized to your preferences', 'All safety equipment provided by USCG standards', 'Tips appreciated (10–20% is standard)'].map(item => (
                  <li key={item} className={styles.logisticsItem}>
                    <span className={styles.logisticsCheck}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.serviceCTA}>
        <img src="/images/sunset-cruise.webp" alt="" className={styles.ctaBgImg} aria-hidden="true" />
        <div className="container">
          <h2 className={styles.ctaTitle}>Ready to Explore the Channel Islands?</h2>
          <p className={styles.ctaText}>
            Book your private island excursion and discover why Captain Garrick's guests
            call this "one of the best days of my life."
          </p>
          <div className={styles.ctaActions}>
            <Link href="/book/full-day-island-cruise/" className="btn btn--primary btn--large">
              Book Your Island Tour
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
