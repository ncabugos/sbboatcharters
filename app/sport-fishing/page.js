import Link from 'next/link';
import styles from '../components/ServicePage.module.css';
import PageSlideshow from '../components/PageSlideshow';

const SLIDES = [
  { src: '/images/instagram/SBCharters-IG-3.jpeg', alt: 'Sport fishing charter', caption: 'Private Sport Fishing Charters' },
  { src: '/images/generated/santa-cruz-coastline.png', alt: 'Santa Barbara Channel fishing grounds', caption: 'World-Class Fishing Grounds' },
  { src: '/images/instagram/SBCharters-IG-2.jpeg', alt: 'Fishing in the channel', caption: 'Calico Bass, Yellowtail & White Seabass' },
  { src: '/images/belafonte/channel-island-charters.webp', alt: 'Belafonte fishing boat', caption: 'Premium Tackle & Advanced Electronics' },
  { src: '/images/instagram/SBCharters-IG-6.jpeg', alt: 'Santa Barbara coastline', caption: 'Fish the Reef, Wreck & Open Water' },
  { src: '/images/belafonte/boating-in-santa-barbara.webp', alt: 'Boat on the water', caption: 'Up to 6 Passengers · Private Charter' },
];

export const metadata = {
  title: 'Private Sport Fishing Charter Santa Barbara | Expert Captain',
  description:
    'Private sport fishing charters in the Santa Barbara Channel and Channel Islands. Premium tackle, expert captain with 20+ years experience. Up to 6 passengers. Book your fishing adventure.',
  openGraph: {
    title: 'Private Sport Fishing Charters | Santa Barbara Boat Charters',
    description: 'Fish the Santa Barbara Channel on a private charter. Calico Bass, Yellowtail, White Seabass & Halibut. Expert captain, premium tackle, up to 6 passengers.',
    images: [{ url: 'https://www.sbboatcharters.com/images/hero-sportfishing-sbboatcharters.jpg', width: 1200, height: 630, alt: 'Sport fishing charter Santa Barbara' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.sbboatcharters.com/images/hero-sportfishing-sbboatcharters.jpg'],
  },
  alternates: { canonical: 'https://www.sbboatcharters.com/sport-fishing/' },
};

const HIGHLIGHTS = [
  { image: '/images/instagram/SBCharters-IG-3.jpeg', title: 'Calico Bass', desc: 'Abundant in nearshore kelp forests and rocky structure. Great action year-round for all skill levels.' },
  { image: '/images/instagram/SBCharters-IG-2.jpeg', title: 'Yellowtail', desc: 'Powerful fighters found around the Channel Islands from June through October. A favorite of charter guests.' },
  { image: '/images/generated/snorkeling-kelp.png', title: 'White Seabass', desc: 'The prize catch of Southern California. Found in kelp beds and around island structure during spring and summer.' },
  { image: '/images/belafonte/boating-in-santa-barbara.webp', title: 'Halibut', desc: 'Sandy bottom specialist of the Santa Barbara Channel. Prime season from spring through fall.' },
  { image: '/images/instagram/SBCharters-IG-6.jpeg', title: 'Live Bait Fishing', desc: 'We run live bait when available for maximum effectiveness. Quality tackle and gear provided.' },
  { image: '/images/belafonte/channel-island-charters.webp', title: 'Advanced Electronics', desc: 'State-of-the-art fish finders and chart plotters. We locate the fish before you wet a line.' },
];


export default function SportFishing() {
  return (
    <>
      <section className={styles.hero}>
        <img src="/images/hero-sportfishing-sbboatcharters.jpg" alt="Sport fishing charter" className={styles.heroBgImage} loading="eager" fetchPriority="high" />
        <div className={styles.heroOverlay} style={{ background: 'linear-gradient(165deg, rgba(10,22,40,0.8) 0%, rgba(18,51,74,0.65) 40%, rgba(26,82,118,0.55) 100%)' }} />
        <div className={`container ${styles.heroContent}`}>
          <span className={styles.heroLabel}>Private Charters · Premium Experience</span>
          <h1 className={styles.heroTitle}>Private Sport Fishing Charters</h1>
          <p className={styles.heroSubtitle}>
            Fish the rich waters of the Santa Barbara Channel aboard a private charter
            with an expert captain who knows every reef, wreck, and hotspot.
          </p>
        </div>
      </section>

      <section className={`section ${styles.info}`}>
        <div className={`container ${styles.infoGrid}`}>
          <div className={styles.infoContent}>
            <span className="section-label">The Fishing</span>
            <h2 className="section-title">World-Class Fishing, Private Experience</h2>
            <div className={styles.divider}></div>
            <p className={styles.infoText}>
              The Santa Barbara Channel is one of the richest fishing grounds on the Pacific coast.
              Where cold northern currents meet warm southern waters, an incredible diversity of
              game fish thrives — and Captain Garrick knows exactly where to find them.
            </p>
            <p className={styles.infoText}>
              Your private sport fishing charter means you fish the spots you want, stay
              as long as you like, and keep all the fish. No schedules but your own.
            </p>
            <p className={styles.infoText}>
              With 20+ years of local knowledge and premium electronics, we maximize your time
              on the water and your chances of landing quality fish.
            </p>
            <p className={styles.infoText}>
              Whether you're an experienced angler chasing trophy fish or a family looking for
              a fun day of fishing, we tailor the experience to your skill level and goals.
            </p>
          </div>
          <div className={styles.detailsCard}>
            <h3 className={styles.detailsTitle}>Charter Details</h3>
            {[
              { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'Capacity', value: 'Up to 6 passengers' },
              { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, label: 'Departure', value: 'Santa Barbara Harbor, Marina 3' },
              { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>, label: 'Target Species', value: 'Calico Bass, Yellowtail, White Seabass, Halibut, Lingcod' },
              { svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, label: 'Pricing', value: 'Please call for customized pricing' },
            ].map((d) => (
              <div key={d.label} className={styles.detailItem}>
                <span className={styles.detailIcon}>{d.svg}</span>
                <div><span className={styles.detailLabel}>{d.label}</span><span className={styles.detailValue}>{d.value}</span></div>
              </div>
            ))}
            <Link href="/book/sport-fishing/" className={`btn btn--primary ${styles.bookingCTA}`}>Book Sport Fishing</Link>
            <a href="tel:+18057222282" className={styles.phoneLink}>Or call (805) 722-2282</a>
          </div>
        </div>
      </section>


      <section className={styles.vesselGallery}>
        <div className={styles.vesselGalleryGrid}>
          {[
            { src: '/images/sportfishing-sbboatcharters.jpg', alt: 'Sport fishing charter Santa Barbara' },
            { src: '/images/fishing-sport.jpeg', alt: 'Sport fishing in the Santa Barbara Channel' },
            { src: '/images/sport-fishing-kid.webp', alt: 'Family sport fishing charter Santa Barbara' },
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
          <h2 className={styles.ctaTitle}>Let's Go Fishing</h2>
          <p className={styles.ctaText}>Book your private sport fishing charter and experience Santa Barbara's world-class fishing from a vessel built for the job.</p>
          <div className={styles.ctaActions}>
            <Link href="/book/sport-fishing/" className="btn btn--primary btn--large">Book Sport Fishing</Link>
            <a href="tel:+18057222282" className="btn btn--secondary btn--large">Call (805) 722-2282</a>
          </div>
        </div>
      </section>
    </>
  );
}
