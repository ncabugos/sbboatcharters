import Link from 'next/link';
import styles from '../components/ServicePage.module.css';
import { getTourWithOptions, fromPrice, CALL_FOR_PRICING } from '@/lib/catalog';
import { formatUsd } from '@/lib/pricing';
import { pageMetadata } from '@/lib/seo';
import { jsonLdString } from '@/lib/structuredData';
import TripSchema from '../components/TripSchema';

const SLUG = 'whale-watching';

// Prices and trip lengths come from the same catalog rows checkout uses,
// regenerated hourly, so a change in the database shows here without a deploy.
export const revalidate = 3600;

// "Whale watching santa barbara" belongs to the 100+ passenger boats, so the
// title leads with what they can't offer: a private boat.
// Shared by the page's metadata and its TouristTrip schema, so they can't drift.
const META = {
  path: '/whale-watching/',
  title: 'Private Whale Watching in Santa Barbara',
  description:
    'Private whale watching charters from Santa Barbara Harbor for up to 6 guests. Gray whales in winter and spring, humpbacks and blue whales in summer.',
  image: '/images/whale-watching-og.jpg',
  imageAlt: 'Orcas swimming in the Santa Barbara Channel with the Santa Ynez Mountains behind',
};

export const metadata = pageMetadata(META);

const Icon = ({ children }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IconCalendar = () => <Icon><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Icon>;
const IconClock = () => <Icon><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>;
const IconPeople = () => <Icon><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>;
const IconPin = () => <Icon><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></Icon>;
const IconDollar = () => <Icon><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></Icon>;

// Months from NOAA's Channel Islands National Marine Sanctuary and the National
// Park Service (checked October 2026), not from the other pages on this site.
const SEASONS = [
  { name: 'Gray whale', when: 'December to May', note: 'Migrating between Alaska and Mexico. Southbound December to February, northbound with calves February to May. Often close to the coast.' },
  { name: 'Humpback whale', when: 'Spring to fall', note: 'Feeding in the channel, busiest in summer. The whale most likely to breach and slap its tail.' },
  { name: 'Blue whale', when: 'Late May to September', note: 'The largest animal on Earth, here to feed on krill. The sanctuary hosts the largest gathering of blue whales in the world.' },
  { name: 'Fin whale', when: 'Late May to September', note: 'The second largest whale, often feeding near the blues.' },
  { name: 'Orca', when: 'Any time, rarely', note: 'Pods pass through the channel without a schedule. A lucky day.' },
  { name: 'Dolphins', when: 'Year round', note: 'Common dolphins in large pods, plus Risso\'s and bottlenose dolphins.' },
];

// Stills from public/videos/sbboat-highlight-whales-web.mp4, our own footage.
const SPECIES = [
  { image: '/images/whale-watching-humpback.jpg', alt: 'Humpback whale with white pectoral fins seen from above', name: 'Humpback Whales', tag: 'Spring to fall', desc: 'Long white flippers, big blows and the occasional breach. Humpbacks feed across the channel through the warm months.' },
  { image: '/images/whale-watching-gray-whales.jpg', alt: 'Gray whales surfacing and blowing in the Santa Barbara Channel', name: 'Gray Whales', tag: 'December to May', desc: 'The great migration passes right along the Santa Barbara coast, with mothers and calves heading north in spring.' },
  { image: '/images/whale-watching-orcas.jpg', alt: 'Orca dorsal fins off the Santa Barbara coast', name: 'Orcas', tag: 'Any time, rarely', desc: 'Killer whales visit the channel a few days at a time. When they show up, nothing else on the water compares.' },
  { image: '/images/marine-wildlife.jpeg', alt: 'Common dolphin leaping off the Santa Barbara coast', name: 'Dolphins', tag: 'Year round', desc: 'Pods of common dolphins ride the bow and race the boat. Sea lions and seabirds are part of most trips too.' },
];

const BRING = [
  'Warm layers and a windbreaker, it is cooler on the water',
  'Sunscreen, hat and sunglasses',
  'Binoculars and a camera',
  'Snacks and drinks (a cooler is welcome)',
  'Motion sickness medicine, taken before the trip',
];

const KNOW = [
  'Meet at Marina 3 gate, Santa Barbara Harbor',
  'Arrive 10 to 15 minutes early',
  'Private boat: up to 6 guests, no strangers',
  'We stay 100 yards from whales, as federal law requires',
  'Sightings are likely in season but never guaranteed',
  'Tips appreciated (10 to 20% is standard)',
];

// "2, 3 or 4 hours" from whichever options are active.
function hoursLabel(options) {
  const hours = [...new Set(options.map((o) => o.duration_min / 60))].sort((a, b) => a - b);
  if (!hours.length) return null;
  if (hours.length === 1) return `${hours[0]} hours`;
  return `${hours.slice(0, -1).join(', ')} or ${hours.at(-1)} hours`;
}

function faqs({ options, maxParty }) {
  const prices = options
    .map((o) => `${formatUsd(o.display_cents)} for ${o.duration_min / 60} hours`)
    .join(', ');
  return [
    {
      q: 'When is whale watching season in Santa Barbara?',
      a: 'All year, with different whales in each season. Gray whales migrate past Santa Barbara from December to May. Humpbacks feed in the channel from spring to fall, and blue and fin whales arrive from late May to September. Dolphins are here year round.',
    },
    {
      q: 'How much is a private whale watching charter?',
      a: prices
        ? `${prices}. That is the price for the whole boat, up to ${maxParty} guests, with all fees included.`
        : `Call (805) 722-2282 for current prices. The price is for the whole boat, up to ${maxParty} guests.`,
    },
    {
      q: 'Which trip length should I book?',
      a: 'Gray whales travel close to shore, so two hours often works in winter and spring. In summer, blue whales and humpbacks usually feed farther out in the channel, so three or four hours gives more time to find them and stay with them.',
    },
    {
      q: 'Will we see whales?',
      a: 'No one can promise wildlife. What a private boat adds is time and choice: we go where whales have been feeding and stay with them as long as your trip allows. Dolphins, sea lions and seabirds are common on the way.',
    },
    {
      q: 'How close do we get to the whales?',
      a: 'Federal law requires boats to stay at least 100 yards from whales. If a whale chooses to come closer, we put the engines in neutral and let it pass. Curious humpbacks and gray whales sometimes do.',
    },
    {
      q: 'Where do we meet?',
      a: 'At the Marina 3 gate in Santa Barbara Harbor, next to the paid harbor lot ($2.50 an hour). Please arrive 10 to 15 minutes early.',
    },
  ];
}

export default async function WhaleWatching() {
  const result = await getTourWithOptions(SLUG);
  const options = result?.options ?? [];
  const maxParty = result?.tour.max_party ?? 6;
  const from = fromPrice(options);
  const pricing = from?.label ?? CALL_FOR_PRICING;
  const lengths = hoursLabel(options) ?? '2 to 4 hours';
  const cheapest = options.length ? Math.min(...options.map((o) => o.display_cents)) : null;
  const perPerson = cheapest ? formatUsd(Math.ceil(cheapest / maxParty / 100) * 100) : null;
  const FAQS = faqs({ options, maxParty });

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <TripSchema slug={SLUG} {...META} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqSchema) }} />

      <section className={styles.hero}>
        <img src="/images/whale-watching-hero.jpg" alt="Orcas swimming in the Santa Barbara Channel with the Santa Ynez Mountains behind" className={styles.heroBgImage} loading="eager" fetchPriority="high" />
        <div className={styles.heroOverlay} style={{ background: 'linear-gradient(165deg, rgba(10,22,40,0.8) 0%, rgba(10,46,70,0.55) 45%, rgba(13,80,110,0.4) 100%)' }} />
        <div className={`container ${styles.heroContent}`}>
          <h1 className={styles.heroTitle}>Private Whale Watching in Santa Barbara</h1>
          <p className={styles.heroSubtitle}>
            Just your group and Captain Garrick on the Santa Barbara Channel. {lengths}, up to {maxParty} guests,
            leaving from Santa Barbara Harbor.
          </p>
        </div>
      </section>

      <section className={`section ${styles.info}`}>
        <div className={`container ${styles.infoGrid}`}>
          <div className={styles.infoContent}>
            <h2 className="section-title">Private Whale Watching Charters</h2>
            <div className={styles.divider}></div>
            <p className={styles.infoText}>
              Most whale watching in Santa Barbara happens on a shared boat with a hundred or more
              people. Ours is private: <strong>just your group, up to {maxParty} guests</strong>, aboard
              the Belafonte with Captain Garrick. You pick the day and the start time, and we stay with
              the whales as long as your trip allows.
            </p>
            <p className={styles.infoText}>
              The Santa Barbara Channel is one of the best places in the world to see whales. 27 species
              of whales and dolphins have been recorded here, and every summer the Channel Islands
              National Marine Sanctuary hosts <strong>the largest gathering of blue whales on Earth</strong>.
              Something is passing through in every month of the year.
            </p>
            <p className={styles.infoText}>
              Captain Garrick has spent more than 20 years on these waters and knows where whales tend
              to feed and travel each season.
              {perPerson && <> Split {maxParty} ways, a {from.hours} hour trip comes to <strong>{perPerson} a person</strong>.</>}
            </p>
          </div>
          <div className={styles.detailsCard}>
            <h3 className={styles.detailsTitle}>Trip Details</h3>
            {[
              { svg: <IconCalendar />, label: 'Season', value: 'Year round, whales change by season' },
              { svg: <IconClock />, label: 'Trip Length', value: lengths },
              { svg: <IconPeople />, label: 'Capacity', value: `Up to ${maxParty} guests, private` },
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
            <Link href="/book/whale-watching/" className={`btn btn--primary ${styles.bookingCTA}`}>
              Book Whale Watching
            </Link>
            <a href="tel:+18057222282" className={styles.phoneLink}>Or call (805) 722-2282</a>
          </div>
        </div>
      </section>

      <section className={`section ${styles.logistics}`}>
        <div className="container container--narrow">
          <div style={{ textAlign: 'center' }}>
            <h2 className="section-title">When to See Whales</h2>
          </div>
          <div className={styles.seasonTableWrap}>
            <table className={styles.seasonTable}>
              <thead>
                <tr><th scope="col">Species</th><th scope="col">When</th><th scope="col">What to expect</th></tr>
              </thead>
              <tbody>
                {SEASONS.map((s) => (
                  <tr key={s.name}>
                    <th scope="row">{s.name}</th>
                    <td className={styles.seasonWhen}>{s.when}</td>
                    <td>{s.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.sourceNote}>
            Seasons from{' '}
            <a href="https://channelislands.noaa.gov/visit/what-will-i-see.html" target="_blank" rel="noopener noreferrer">NOAA&apos;s Channel Islands National Marine Sanctuary</a>{' '}
            and the{' '}
            <a href="https://www.nps.gov/chis/planyourvisit/whale-watching.htm" target="_blank" rel="noopener noreferrer">National Park Service</a>.
            Whales keep their own schedules.
          </p>
        </div>
      </section>

      <section className={`section ${styles.highlights}`}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <h2 className="section-title">What You Might See</h2>
          </div>
          <div className={styles.speciesGrid}>
            {SPECIES.map((s) => (
              <div key={s.name} className={styles.speciesCard}>
                <div className={styles.speciesImageWrap}>
                  <img src={s.image} alt={s.alt} loading="lazy" decoding="async" />
                  <div className={styles.speciesOverlay} />
                  <h3 className={styles.speciesName}>{s.name}</h3>
                </div>
                <div className={styles.speciesMeta}>
                  <span className={styles.speciesTag}>{s.tag}</span>
                </div>
                <p className={styles.speciesDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.videoSection}>
        <div className="container container--narrow">
          <div style={{ textAlign: 'center' }}>
            <h2 className="section-title section-title--light">From Our Trips</h2>
          </div>
          <video
            className={styles.videoPlayer}
            controls
            muted
            playsInline
            preload="none"
            poster="/images/whale-watching-video-poster.jpg"
            aria-label="Orcas, humpbacks and gray whales filmed in the Santa Barbara Channel"
          >
            <source src="/videos/sbboat-highlight-whales-web.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      <section className={`section ${styles.logistics}`}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <h2 className="section-title">What to Know</h2>
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
        </div>
      </section>

      {/* Visible answers, in plain HTML, are what search and AI answers quote. */}
      <section className={`section ${styles.info}`}>
        <div className="container container--narrow">
          <div style={{ textAlign: 'center' }}>
            <h2 className="section-title">Common Questions</h2>
          </div>
          <div className={styles.faqList}>
            {FAQS.map((f) => (
              <details key={f.q} className={styles.faqItem}>
                <summary className={styles.faqQuestion}>{f.q}</summary>
                <p className={styles.faqAnswer}>{f.a}</p>
              </details>
            ))}
          </div>
          <p className={styles.sourceNote}>
            Heading to the islands too? Whales are often part of our{' '}
            <Link href="/channel-islands-tour/">Channel Islands tour</Link>.
          </p>
        </div>
      </section>

      <section className={styles.serviceCTA}>
        <img src="/images/whale-watching-hero.jpg" alt="" className={styles.ctaBgImg} aria-hidden="true" />
        <div className="container">
          <h2 className={styles.ctaTitle}>Book a Private Whale Watching Trip</h2>
          <p className={styles.ctaText}>
            Pick a day, a start time and {lengths}. Just your group on board.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/book/whale-watching/" className="btn btn--primary btn--large">
              Book Whale Watching
            </Link>
            <a href="tel:+18057222282" className="btn btn--secondary btn--large">Call (805) 722-2282</a>
          </div>
        </div>
      </section>
    </>
  );
}
