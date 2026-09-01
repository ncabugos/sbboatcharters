import Link from 'next/link';
import styles from '../components/ServicePage.module.css';
import { getTourWithOptions, fromPrice, CALL_FOR_PRICING } from '@/lib/catalog';
import { seasonLabel } from '@/lib/season';

const SLUG = 'lobster-diving';

// The season is content, so it lives on the catalog row (tours.season_start /
// season_end, see scripts/apply-lobster-diving.js) where it also drives the
// booking calendar. These dates only stand in until that row exists.
const FALLBACK_SEASON = { start: '2026-10-02', end: '2027-03-17' };

// Price and season come from the same catalog rows checkout uses, regenerated
// hourly, so a change in the database shows here without a deploy.
export const revalidate = 3600;

export const metadata = {
  title: 'Lobster Diving Charters Santa Barbara | Day & Night Trips',
  description:
    'Private guided California spiny lobster diving charters in Santa Barbara and the Channel Islands. 8-hour day or night trips for up to 4 divers, October through March. Book your lobster dive.',
  openGraph: {
    title: 'Lobster Diving Charters | Santa Barbara Boat Charters',
    description: 'Guided spiny lobster dives in the Santa Barbara Channel, by day or after dark. 8 hours, up to 4 divers, lobster season only.',
    images: [{ url: 'https://www.sbboatcharters.com/images/lobster-diving-hero.jpg', width: 1200, height: 630, alt: 'California spiny lobster in a kelp forest' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.sbboatcharters.com/images/lobster-diving-hero.jpg'],
  },
  alternates: { canonical: 'https://www.sbboatcharters.com/lobster-diving/' },
};

const Icon = ({ children }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IconCalendar = () => <Icon><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Icon>;
const IconClock = () => <Icon><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>;
const IconPeople = () => <Icon><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>;
const IconPin = () => <Icon><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></Icon>;
const IconDollar = () => <Icon><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></Icon>;

const TRIPS = [
  {
    title: 'Day Trips',
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    desc: 'Depart in the morning and work the kelp edges, ledges and boulder fields in full visibility. Lobster tuck into crevices by day, so this is a hunt for sharp eyes and patient divers. Spot the antennae, read the hole, and commit to the grab. Great for divers who want daylight, calmer conditions and time to cover ground across the islands.',
  },
  {
    title: 'Night Trips',
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    desc: 'Depart in the late afternoon, set up on the spot as the sun goes down, and dive the dark. After nightfall lobster leave their holes and walk the open bottom, which is when the biggest bugs are out and the hauls get serious. Dive lights required. The most productive way to fill a bag, for divers comfortable in the water at night.',
  },
];

const BRING = [
  'Valid California sport fishing license',
  'Spiny lobster report card (required by CDFW)',
  'Lobster gauge (3¼" minimum carapace)',
  'Wetsuit, mask, fins, snorkel and weight belt',
  'Gloves and a catch bag',
  'Dive light plus a backup for night trips',
  'Warm layers and a towel for the ride home',
];

const KNOW = [
  'Meet at Marina 3 gate, Santa Barbara Harbor',
  'Lobster season only, see the dates above',
  'Night trips depart late afternoon and return after midnight',
  'Lobster are taken by hand and measured immediately; shorts go straight back',
  'Daily limit is 7 lobster per person',
  'Best suited to experienced freedivers',
  'Tips appreciated (10 to 20% is standard)',
];

export default async function LobsterDiving() {
  const result = await getTourWithOptions(SLUG);
  const pricing = fromPrice(result?.options)?.label ?? CALL_FOR_PRICING;
  const season = seasonLabel(
    result?.tour.season_start ?? FALLBACK_SEASON.start,
    result?.tour.season_end ?? FALLBACK_SEASON.end
  );

  return (
    <>
      <section className={styles.hero}>
        <img src="/images/lobster-diving-hero.jpg" alt="California spiny lobster on a reef in a kelp forest" className={styles.heroBgImage} loading="eager" fetchPriority="high" />
        <div className={styles.heroOverlay} style={{ background: 'linear-gradient(165deg, rgba(10,22,40,0.82) 0%, rgba(10,46,53,0.62) 40%, rgba(13,80,85,0.5) 100%)' }} />
        <div className={`container ${styles.heroContent}`}>
          <span className={styles.heroLabel}>Lobster Season · Day & Night Trips · Up to 4 Divers</span>
          <h1 className={styles.heroTitle}>Lobster Diving Charters</h1>
          <p className={styles.heroSubtitle}>
            Eight hours on the water hunting California spiny lobster with Captain Garrick.
            Dive the kelp by day, or go after dark when the bugs come out to roam.
          </p>
        </div>
      </section>

      <section className={`section ${styles.info}`}>
        <div className={`container ${styles.infoGrid}`}>
          <div className={styles.infoContent}>
            <span className="section-label">The Season</span>
            <h2 className="section-title">Santa Barbara's Spiny Lobster Charter</h2>
            <div className={styles.divider}></div>
            <p className={styles.infoText}>
              California spiny lobster season runs <strong>{season}</strong>. For those few months
              the reefs and kelp forests of the Santa Barbara Channel and the Channel Islands hold
              some of the best lobster diving on the West Coast, and Captain Garrick has spent
              <strong> 16+ seasons</strong> learning exactly where the big ones hide.
            </p>
            <p className={styles.infoText}>
              Spiny lobster are taken by hand, with no spears and no hooks. It's a freediver's game.
              Read the ledge, spot the antennae, and commit to the grab before the bug backs into
              its hole. We put you on productive structure along the coast and across all the
              islands, and the captain's local knowledge does the rest.
            </p>
            <p className={styles.infoText}>
              Choose a <strong>day trip</strong> to work the kelp and reef ledges in daylight, or a
              <strong> night trip</strong> for when lobster leave their crevices and walk the open
              bottom. Both run eight hours, both are private, and both are capped at four divers so
              everyone gets real water time.
            </p>
          </div>
          <div className={styles.detailsCard}>
            <h3 className={styles.detailsTitle}>Trip Details</h3>
            {[
              { svg: <IconCalendar />, label: 'Season', value: season },
              { svg: <IconClock />, label: 'Trip Length', value: '8 hours, day or night' },
              { svg: <IconPeople />, label: 'Capacity', value: 'Up to 4 divers' },
              { svg: <IconPin />, label: 'Departure', value: 'Santa Barbara Harbor, Marina 3' },
              { svg: <IconDollar />, label: 'Pricing', value: pricing },
            ].map((d) => (
              <div key={d.label} className={styles.detailItem}>
                <span className={styles.detailIcon}>{d.svg}</span>
                <div>
                  <span className={styles.detailLabel}>{d.label}</span>
                  <span className={styles.detailValue}>{d.value}</span>
                </div>
              </div>
            ))}
            <Link href="/book/lobster-diving/" className={`btn btn--primary ${styles.bookingCTA}`}>
              Book Lobster Diving
            </Link>
            <a href="tel:+18057222282" className={styles.phoneLink}>Or call (805) 722-2282</a>
          </div>
        </div>
      </section>

      <section className={`section ${styles.highlights}`}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="section-label">Pick Your Trip</span>
            <h2 className="section-title">Day or Night</h2>
          </div>
          <div className={`${styles.highlightsGrid} ${styles.highlightsTwo}`}>
            {TRIPS.map((t) => (
              <div key={t.title} className={styles.highlightCard}>
                <div className={styles.highlightIcon}>{t.icon}</div>
                <h3 className={styles.highlightTitle}>{t.title}</h3>
                <p className={styles.highlightDesc}>{t.desc}</p>
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
                {BRING.map((item) => (
                  <li key={item} className={styles.logisticsItem}>
                    <span className={styles.logisticsCheck}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.logisticsCard}>
              <h3 className={styles.logisticsCardTitle}>Good to Know</h3>
              <ul className={styles.logisticsList}>
                {KNOW.map((item) => (
                  <li key={item} className={styles.logisticsItem}>
                    <span className={styles.logisticsCheck}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p style={{ textAlign: 'center', marginTop: 'var(--space-xl)', fontSize: 'var(--fs-small)', color: 'var(--color-text-secondary)' }}>
            Regulations change, so check the current{' '}
            <a href="https://wildlife.ca.gov/Conservation/Marine/Invertebrates/Lobster" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>
              CDFW spiny lobster rules
            </a>{' '}
            before your trip.
          </p>
        </div>
      </section>

      <section className={styles.vesselGallery}>
        <div className={styles.vesselGalleryGrid}>
          {[
            { n: 1, alt: 'Captain Garrick holding a large California spiny lobster on the boat' },
            { n: 2, alt: 'Three guests on the dock with their lobster haul after a day trip' },
            { n: 3, alt: 'Spiny lobster and a full catch bag on deck after a night dive' },
          ].map((g) => (
            <div key={g.n} className={styles.vesselGalleryItem} style={{ aspectRatio: '4/5' }}>
              <img src={`/images/lobster-diving-gallery-${g.n}.jpeg`} alt={g.alt} loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.serviceCTA}>
        <img src="/images/lobster-diving-hero.jpg" alt="" className={styles.ctaBgImg} aria-hidden="true" />
        <div className="container">
          <h2 className={styles.ctaTitle}>Ready for Lobster Season?</h2>
          <p className={styles.ctaText}>
            Day or night, we'll put you on the ledges where the bugs are. Season dates fill fast,
            so grab yours before the opener.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/book/lobster-diving/" className="btn btn--primary btn--large">
              Book Lobster Diving
            </Link>
            <a href="tel:+18057222282" className="btn btn--secondary btn--large">Call (805) 722-2282</a>
          </div>
        </div>
      </section>
    </>
  );
}
