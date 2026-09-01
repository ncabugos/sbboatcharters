import Link from 'next/link';
import styles from '../components/ServicePage.module.css';
import PageSlideshow from '../components/PageSlideshow';
import { getTourPricingLabel } from '@/lib/catalog';

const SLIDES = [
  { src: '/images/generated/spearfishing-underwater.png', alt: 'Spearfishing underwater', caption: 'Hunt the Santa Barbara Channel' },
  { src: '/images/instagram/SBCharters-IG-3.jpeg', alt: 'Spearfishing charter', caption: '16+ Years of Island Diving Experience' },
  { src: '/images/generated/snorkeling-kelp.png', alt: 'Kelp forest diving', caption: 'Crystal-Clear Kelp Forests' },
  { src: '/images/generated/santa-cruz-coastline.png', alt: 'Santa Cruz Island', caption: 'Secret Spots Across All 8 Channel Islands' },
  { src: '/images/instagram/SBCharters-IG-1.jpg', alt: 'Charter boat in Santa Barbara', caption: 'White Sea Bass, Yellowtail & Bluefin Tuna' },
  { src: '/images/belafonte/boating-in-santa-barbara.webp', alt: 'Boat on the water', caption: 'State-of-the-Art Electronics & Local Knowledge' },
];


// Prices come from the same catalog rows checkout uses, regenerated hourly, so a
// price changed in the database shows here without a deploy.
export const revalidate = 3600;

export const metadata = {
  title: 'Spearfishing Charters Santa Barbara | Expert Guided Expeditions',
  description:
    'Expert-guided spearfishing charters in Santa Barbara and Channel Islands. 16+ years of island diving experience. Targeting Sea Bass, Yellowtail, and Tuna. Up to 4 passengers. Book your spearfishing expedition.',
  openGraph: {
    title: 'Spearfishing Charters | Santa Barbara Boat Charters',
    description: 'Expert-guided spearfishing expeditions in Santa Barbara. 16+ years diving the Channel Islands. Sea Bass, Yellowtail, Tuna.',
    images: [{ url: 'https://www.sbboatcharters.com/images/spearfishing-gallery-1.jpeg', width: 1200, height: 630, alt: 'Spearfishing charter Santa Barbara' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.sbboatcharters.com/images/spearfishing-gallery-1.jpeg'],
  },
  alternates: { canonical: 'https://www.sbboatcharters.com/spearfishing/' },
};

const ADVANTAGES = [
  { image: '/images/captain-garrick/captain-garrick.webp', title: 'Expert Guidance', desc: 'Captain Garrick brings decades of competitive freediving and spearfishing experience. He reads the water, the current, and the fish behavior — putting you in the right place at the right time.' },
  { image: '/images/generated/santa-cruz-coastline.png', title: '16+ Years of Secret Spots', desc: 'Hard-coded marks across all 8 Channel Islands and the entire Santa Barbara coastline. We go where the fish actually are — not the popular spots everyone else hits.' },
  { image: '/images/belafonte/boating-in-santa-barbara.webp', title: 'State-of-the-Art Electronics', desc: 'High-end fish finders, real-time sonar, and local intel from active fishing reports. We track thermoclines, bait schools, and temperature breaks so you can focus on diving.' },
];

const SPECIES = [
  {
    name: 'White Sea Bass',
    image: '/images/generated/white-sea-bass.png',
    season: 'Spring – Fall',
    depth: '20–60 ft',
    habitat: 'Kelp forests & rocky reefs',
    desc: 'The prized target of Southern California divers. White sea bass school in and around kelp forests, especially around the Channel Islands. Patient, stealthy hunting in the right conditions.',
  },
  {
    name: 'Yellowtail',
    image: '/images/generated/yellowtail.png',
    season: 'June – October',
    depth: '20–80 ft',
    habitat: 'Open water & island structure',
    desc: 'Hard-fighting pelagics that push into the Channel Islands during summer. Found around kelp paddies, island kelp edges, and rocky points. Fast moving — requires quick, confident shots.',
  },
  {
    name: 'Bluefin Tuna',
    image: '/images/generated/bluefin-tuna.png',
    season: 'June – September',
    depth: 'Surface – 40 ft',
    habitat: 'Open channel & offshore',
    desc: 'The ultimate trophy fish for experienced divers. Seasonal runs bring bluefin into the Santa Barbara Channel and around the islands. High energy, high reward.',
  },
  {
    name: 'Halibut',
    image: '/images/generated/california-halibut.png',
    season: 'Year-round',
    depth: '10–60 ft',
    habitat: 'Sandy flats & mud bottom',
    desc: 'California halibut lie flat on sandy bottoms, well camouflaged and easy to miss. A staple of Santa Barbara nearshore diving. One of the finest eating fish in the channel.',
  },
  {
    name: 'Lingcod',
    image: '/images/generated/lingcod.png',
    season: 'Year-round',
    depth: '20–100 ft',
    habitat: 'Rocky reef & structure',
    desc: 'Aggressive predators found on rocky reef throughout the Channel Islands. Lingcod hold tight to structure and are a high-yield target — excellent table fish with firm white meat.',
  },
  {
    name: 'Sheephead',
    image: '/images/generated/sheephead.png',
    season: 'Year-round',
    depth: '10–100 ft',
    habitat: 'Rocky reef & kelp',
    desc: 'A kelp reef specialist and underrated eating fish. Sheephead are common around the Channel Islands and Santa Barbara coast. Large specimens are a satisfying shot for any freediver.',
  },
  {
    name: 'Calico Bass',
    image: '/images/generated/calico-bass.png',
    season: 'Year-round',
    depth: '5–60 ft',
    habitat: 'Kelp & rocky structure',
    desc: 'Abundant throughout nearshore kelp forests. Calico bass are a great target for newer divers and a fun, accessible hunt for experienced divers looking for fast action in the shallows.',
  },
  {
    name: 'Spiny Lobster',
    image: '/images/generated/spiny-lobster.png',
    season: 'Oct – Mar (lobster season)',
    depth: '10–60 ft',
    habitat: 'Rocky crevices & ledges',
    desc: 'California\'s iconic spiny lobster hide in reef crevices by day and roam at night. During lobster season, nighttime and dusk dives around the Channel Islands can yield exceptional hauls.',
  },
];


export default async function Spearfishing() {
  const pricing = await getTourPricingLabel('spearfishing');
  return (
    <>
      <section className={styles.hero}>
        <img src="/images/generated/spearfishing-underwater.png" alt="Spearfishing underwater" className={styles.heroBgImage} loading="eager" fetchPriority="high" />
        <div className={styles.heroOverlay} style={{ background: 'linear-gradient(165deg, rgba(10,22,40,0.8) 0%, rgba(10,46,53,0.65) 40%, rgba(13,80,85,0.55) 100%)' }} />
        <div className={`container ${styles.heroContent}`}>
          <span className={styles.heroLabel}>Expert Guided · Up to 4 Passengers</span>
          <h1 className={styles.heroTitle}>Spearfishing Expeditions</h1>
          <p className={styles.heroSubtitle}>
            16+ years of island and coastal diving experience, high-end electronics, and
            an active knowledge of local conditions. The ultimate spearfishing charter.
          </p>
        </div>
      </section>

      <section className={`section ${styles.info}`}>
        <div className={`container ${styles.infoGrid}`}>
          <div className={styles.infoContent}>
            <span className="section-label">The Hunt</span>
            <h2 className="section-title">Santa Barbara's Premier Spearfishing Guide</h2>
            <div className={styles.divider}></div>
            <p className={styles.infoText}>
              For those with a keen sense of adventure, spearfishing combines the thrill of diving
              with the primal satisfaction of the hunt. Captain Garrick combines <strong>16 years
              of island and coastal diving experience</strong> with high-end electronics and an
              active knowledge of local reports to position you for success.
            </p>
            <p className={styles.infoText}>
              We have marks all over the coast and Channel Islands for <strong>White Sea Bass,
              Yellowtail, and Bluefin Tuna</strong>. Whether you're targeting kelp forest species
              along the coast or heading offshore to the islands for pelagics, we'll put you on
              the fish.
            </p>
            <p className={styles.infoText}>
              The Santa Barbara Channel's unique position — where cold northern currents meet
              warm southern waters — creates one of the most diverse marine ecosystems on
              the Pacific coast. Understanding the thermoclines, water temperatures, and
              seasonal patterns is what sets our spearfishing charters apart.
            </p>
          </div>
          <div className={styles.detailsCard}>
            <h3 className={styles.detailsTitle}>Expedition Details</h3>
            {[
              { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'Capacity', value: 'Up to 4 passengers' },
              { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, label: 'Departure', value: 'Santa Barbara Harbor, Marina 3' },
              { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>, label: 'Target Species', value: 'White Sea Bass, Yellowtail, Bluefin Tuna, Lingcod, Sheephead' },
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
            <Link href="/book/spearfishing/" className={`btn btn--primary ${styles.bookingCTA}`}>
              Book Spearfishing
            </Link>
            <a href="tel:+18057222282" className={styles.phoneLink}>Or call (805) 722-2282</a>
          </div>
        </div>
      </section>


      <section className={styles.vesselGallery}>
        <div className={styles.vesselGalleryGrid}>
          {[1,2,3,4,5,6].map((n) => (
            <div key={n} className={styles.vesselGalleryItem} style={{ aspectRatio: '3/4' }}>
              <img src={`/images/spearfishing-gallery-${n}.jpeg`} alt={`Spearfishing charter Santa Barbara ${n}`} />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.serviceCTA}>
        <img src="/images/sunset-cruise.webp" alt="" className={styles.ctaBgImg} aria-hidden="true" />
        <div className="container">
          <h2 className={styles.ctaTitle}>Ready for the Hunt?</h2>
          <p className={styles.ctaText}>
            Contact us to plan your spearfishing expedition. We'll work with you on timing,
            location, and target species to maximize your chances.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/book/spearfishing/" className="btn btn--primary btn--large">
              Book Spearfishing
            </Link>
            <a href="tel:+18057222282" className="btn btn--secondary btn--large">Call (805) 722-2282</a>
          </div>
        </div>
      </section>
    </>
  );
}
