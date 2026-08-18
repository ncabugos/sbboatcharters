import Link from 'next/link';
import styles from './page.module.css';

const IconIsland = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17h18"/><path d="M12 3C8 3 5 8 5 11h14c0-3-3-8-7-8z"/><path d="M8 17c0 2 1.5 3 4 3s4-1 4-3"/></svg>;
const IconSunset = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const IconDive = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h4m16 0h-4M12 6v2m0 8v2"/></svg>;
const IconFish = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 3.15 5.5 6.5-.48 2.9-2.84 4.9-5 6.5"/><path d="M2 12c.5-4 4-7 8-7"/><circle cx="6" cy="18" r="2"/></svg>;
const IconWave = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c1.5-3 3.5-4.5 6-4s5 3 8 3 4.5-1.5 6-4"/><path d="M2 18c1.5-3 3.5-4.5 6-4s5 3 8 3 4.5-1.5 6-4"/></svg>;

const SERVICES = [
  {
    title: 'Channel Islands Tour',
    description: 'Private excursions to Santa Cruz Island with snorkeling, sea caves, and wildlife. A 6-hour (3/4 day) or 8-hour (full day) adventure tailored to your desires.',
    href: '/channel-islands-tour',
    icon: <IconIsland />,
    tag: '6 or 8 Hours',
    image: '/images/santa-cruz-island.webp',
  },
  {
    title: 'Coastal & Sunset Cruises',
    description: 'Panoramic views of the American Riviera coastline from Carpinteria to Hollister Ranch. Perfect for celebrations and special occasions.',
    href: '/coastal-sunset-cruises',
    icon: <IconSunset />,
    tag: 'From $636',
    image: '/images/sunset-cruise.webp',
  },
  {
    title: 'Spearfishing',
    description: 'Expert-guided spearfishing expeditions with 16+ years of island diving experience. Targeting Sea Bass, Yellowtail, and Tuna.',
    href: '/spearfishing',
    icon: <IconDive />,
    tag: 'Expert Guided',
    image: '/images/spearfishing-gallery-1.jpeg',
  },
  {
    title: 'Sport Fishing',
    description: 'Private sport fishing charters in the rich waters of the Santa Barbara Channel and Channel Islands. Premium tackle and electronics.',
    href: '/sport-fishing',
    icon: <IconFish />,
    tag: 'Private Charter',
    image: '/images/sportfishing-sbboatcharters.jpg',
  },
  {
    title: 'Foiling',
    description: 'Take your board skills to the next level with hydrofoil lessons on the beautiful Santa Barbara coast. An unforgettable thrill.',
    href: '/foiling',
    icon: <IconWave />,
    tag: 'Adventure',
    image: '/images/foiling-sbboatcharters.jpeg',
  },
];

const TESTIMONIALS = [
  {
    text: "Captain Garrick is incredibly knowledgeable, skilled and accommodating. He gave us a magical tour of the islands on a perfect day out on the channel. His experience on boats and as a spear fisherman showed in his amazing stories, local knowledge of the islands and its wildlife, and in his smooth demeanor. And such good pricing! Would highly recommend chartering him.",
    author: 'Louisa',
    service: 'Channel Islands Tour',
  },
  {
    text: "We had the BEST TIME on Garrick's boat! He is the best captain, making everyone feel comfortable and at ease. He seems to have a direct line of communication with the whales, dolphins and sharks, leading us directly to them. Most of all though, his warm personality and humor made it one of the best days of my summer.",
    author: 'Christian',
    service: 'Coastal Cruise',
  },
  {
    text: "I've taken many boat tours over the years and this is one I will never forget! The personalized experience of a small private boat versus a large tourist vessel is incomparable. Captain Garrick's knowledge of the Channel Islands is unmatched.",
    author: 'Recent Guest',
    service: 'Sunset Cruise',
  },
];

const FEATURE_ICONS = {
  experience: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-ocean-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  ),
  passengers: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-ocean-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  licensed: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-ocean-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  tailored: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-ocean-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
    </svg>
  ),
};

const FEATURES = [
  {
    iconKey: 'experience',
    title: '20+ Years Experience',
    description: 'Over two decades of diving and exploring every mile of the California coast and all 8 Channel Islands.',
  },
  {
    iconKey: 'passengers',
    title: 'Private 6 Passengers',
    description: 'Intimate, personalized adventures — never a crowded tourist boat. Your group, your pace, your experience.',
  },
  {
    iconKey: 'licensed',
    title: 'USCG Licensed',
    description: 'Captain Garrick holds a USCG OUPV license, and Belafonte undergoes yearly Coast Guard examinations for your safety.',
  },
  {
    iconKey: 'tailored',
    title: 'Tailored Adventures',
    description: 'Every charter is customized to your desires. We craft unique experiences you won\'t find anywhere else.',
  },
];

const GALLERY_STRIP = [
  { src: '/images/instagram/SBCharters-IG-1.jpg', alt: 'SB Boat Charters' },
  { src: '/images/instagram/SBCharters-IG-2.jpeg', alt: 'SB Boat Charters' },
  { src: '/images/instagram/SBCharters-IG-3.jpeg', alt: 'SB Boat Charters' },
  { src: '/images/instagram/SBCharters-IG-4.jpeg', alt: 'SB Boat Charters' },
  { src: '/images/instagram/SBCharters-IG-5.jpeg', alt: 'SB Boat Charters' },
  { src: '/images/instagram/SBCharters-IG-6.jpeg', alt: 'SB Boat Charters' },
  { src: '/images/instagram/SBCharters-IG-7.jpeg', alt: 'SB Boat Charters' },
  { src: '/images/instagram/SBCharters-IG-1.jpg', alt: 'SB Boat Charters' },
  { src: '/images/instagram/SBCharters-IG-2.jpeg', alt: 'SB Boat Charters' },
  { src: '/images/instagram/SBCharters-IG-3.jpeg', alt: 'SB Boat Charters' },
  { src: '/images/instagram/SBCharters-IG-4.jpeg', alt: 'SB Boat Charters' },
  { src: '/images/instagram/SBCharters-IG-5.jpeg', alt: 'SB Boat Charters' },
  { src: '/images/instagram/SBCharters-IG-6.jpeg', alt: 'SB Boat Charters' },
  { src: '/images/instagram/SBCharters-IG-7.jpeg', alt: 'SB Boat Charters' },
];

const INSTAGRAM_GRID = [
  { src: '/images/instagram/SBCharters-IG-1.jpg', alt: 'Channel Islands Charter' },
  { src: '/images/instagram/SBCharters-IG-2.jpeg', alt: 'SB Boat Charter Adventure' },
  { src: '/images/instagram/SBCharters-IG-3.jpeg', alt: 'Santa Barbara Waters' },
  { src: '/images/instagram/SBCharters-IG-4.jpeg', alt: 'Ocean Exploration' },
];

export default function HomePage() {
  return (
    <>
      {/* ===== HERO WITH VIDEO BACKGROUND ===== */}
      <section className={styles.hero}>
        <div className={styles.heroVideoWrap}>
          <video
            className={styles.heroVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/images/hero-channel-islands.jpg"
          >
            <source src="/videos/sbboat-highlight-whales.mp4" type="video/mp4" />
          </video>
        </div>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroWaves}></div>
        <div className={`container ${styles.heroContent}`}>
          <span className={styles.heroLabel}>Private Boat Charters · Santa Barbara, CA</span>
          <h1 className={styles.heroTitle}>
            Discover the Language<br />of the Ocean
          </h1>
          <p className={styles.heroSubtitle}>
            Private 6-passenger charters through the Santa Barbara Channel and
            Channel Islands. Over 20 years of coastal expertise at your service.
          </p>
          <div className={styles.heroActions}>
            <Link href="/book/" className="btn btn--primary btn--large">
              Book Your Adventure
            </Link>
            <Link href="/channel-islands-tour" className="btn btn--secondary btn--large">
              Explore Charters
            </Link>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>20+</span>
              <span className={styles.statLabel}>Years on the Water</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>8</span>
              <span className={styles.statLabel}>Channel Islands Explored</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>6</span>
              <span className={styles.statLabel}>Passengers Max</span>
            </div>
          </div>
        </div>
        <div className={styles.scrollIndicator}>
          <span>Scroll to Explore</span>
          <div className={styles.scrollLine}></div>
        </div>
      </section>

      {/* ===== PHOTO STRIP ===== */}
      <section className={styles.photoStrip}>
        <div className={styles.photoStripTrack}>
          {GALLERY_STRIP.map((img, i) => (
            <div key={i} className={styles.photoStripItem}>
              <img src={img.src} alt={img.alt} />
            </div>
          ))}
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section className={`section ${styles.services}`} id="charters">
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="section-label">Our Charters</span>
            <h2 className="section-title">Unforgettable Experiences on the Water</h2>
            <p className="section-subtitle">
              From dawn excursions to the Channel Islands to golden-hour sunset cruises along the
              American Riviera, every charter is a personally curated adventure.
            </p>
          </div>
          <div className={styles.servicesGrid}>
            {SERVICES.map((service, i) => (
              <Link href={service.href} key={service.title} className={styles.serviceCard} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.serviceImageWrap}>
                  <img src={service.image} alt={service.title} className={styles.serviceImage} />
                  <div className={styles.serviceImageOverlay}></div>
                </div>
                <div className={styles.serviceTag}>{service.tag}</div>
                <div className={styles.serviceBody}>
                  <h3 className={styles.serviceTitle}>{service.title}</h3>
                  <p className={styles.serviceDesc}>{service.description}</p>
                  <span className={styles.serviceLink}>
                    Learn More
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FULL-WIDTH IMAGE BREAK ===== */}
      <section className={styles.imageBreak}>
        <img src="/images/jonathan-hsu-unsplash.jpg" alt="Humpback whale breaching near the Channel Islands" />
        <div className={styles.imageBreakOverlay}>
          <span className={styles.imageBreakText}>Witness Magnificent Marine Wildlife Up Close</span>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className={`section ${styles.features}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="section-label">Why Choose Us</span>
            <h2 className="section-title">Not Your Average Boat Tour</h2>
            <p className="section-subtitle">
              A private vessel with an expert captain who has spent two decades
              mastering the waters of the Santa Barbara Channel.
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {FEATURES.map((feature) => (
              <div key={feature.title} className={styles.featureCard}>
                <span className={styles.featureIcon}>{FEATURE_ICONS[feature.iconKey]}</span>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT TEASER ===== */}
      <section className={`section ${styles.aboutTeaser}`}>
        <div className={`container ${styles.aboutGrid}`}>
          <div className={styles.aboutImageWrap}>
            <div className={styles.aboutImage}>
              <img
                src="/images/captain-garrick/captain-garrick.webp"
                alt="Captain Garrick — your expert guide on the Santa Barbara waters"
                className={styles.aboutPhoto}
              />
            </div>
            <div className={styles.aboutBadge}>
              <span className={styles.badgeNumber}>20+</span>
              <span className={styles.badgeLabel}>Years<br/>Experience</span>
            </div>
          </div>
          <div className={styles.aboutContent}>
            <span className="section-label">Meet Your Captain</span>
            <h2 className="section-title">Your Guide to the Ocean&apos;s Best Kept Secrets</h2>
            <div className={styles.aboutDivider}></div>
            <p className={styles.aboutText}>
              My niche is showing people the language of the ocean: to give you a lens of ocean
              exploration I have curated from decades of personal adventures in and on the water.
            </p>
            <p className={styles.aboutText}>
              Having dove and explored all 8 Channel Islands, I've compiled quite a few gems off our
              coast to share with my clients. From the massive sea caves of Santa Cruz Island to the
              remote shores of San Miguel, every trip is an opportunity to see something extraordinary.
            </p>
            <div className={styles.aboutActions}>
              <Link href="/about" className="btn btn--outline-dark">
                Read My Story
              </Link>
              <Link href="/the-belafonte" className="btn btn--teal">
                Explore the Belafonte
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INSTAGRAM GRID ===== */}
      <section className={styles.wildlifeStrip}>
        <div className={styles.wildlifeGrid}>
          {INSTAGRAM_GRID.map((img, i) => (
            <div key={i} className={styles.wildlifeItem}>
              <img src={img.src} alt={img.alt} />
              <a
                href="https://www.instagram.com/sbboatcharters/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.igOverlay}
                aria-label="View on Instagram"
              >
                <svg className={styles.igIcon} viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                <span className={styles.igLabel}>View on Instagram</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className={`section ${styles.testimonials}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="section-label section-label--light">Guest Experiences</span>
            <h2 className="section-title section-title--light">What Our Guests Say</h2>
          </div>
          <div className={styles.testimonialGrid}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={styles.testimonialCard}>
                <div className={styles.testimonialStars}>★★★★★</div>
                <blockquote className={styles.testimonialText}>
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.authorAvatar}>{t.author[0]}</div>
                  <div>
                    <span className={styles.authorName}>{t.author}</span>
                    <span className={styles.authorService}>{t.service}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BELAFONTE TEASER ===== */}
      <section className={`section ${styles.vessel}`}>
        <div className={`container ${styles.vesselGrid}`}>
          <div className={styles.vesselContent}>
            <span className="section-label">Our Vessel</span>
            <h2 className="section-title">The Belafonte</h2>
            <p className={styles.vesselSubtitle}>
              Stabicraft 2500 Ultracab XL · Twin Yamaha 200hp
            </p>
            <p className={styles.vesselText}>
              Built on the South Island of New Zealand and designed for some of the roughest seas
              on earth. 100% aluminum construction with 9,000 lbs of positive buoyancy — she'll get you
              across the Santa Barbara Channel in under an hour.
            </p>
            <div className={styles.vesselSpecs}>
              <div className={styles.spec}>
                <span className={styles.specValue}>400</span>
                <span className={styles.specLabel}>Horsepower</span>
              </div>
              <div className={styles.spec}>
                <span className={styles.specValue}>25'</span>
                <span className={styles.specLabel}>Length</span>
              </div>
              <div className={styles.spec}>
                <span className={styles.specValue}>6</span>
                <span className={styles.specLabel}>Passengers</span>
              </div>
            </div>
            <Link href="/the-belafonte" className="btn btn--outline-dark">
              Learn About the Belafonte
            </Link>
          </div>
          <div className={styles.vesselImageWrap}>
            <div className={styles.vesselImage}>
              <img
                src="/images/belafonte/belafonte.webp"
                alt="The Belafonte — Stabicraft 2500 Ultracab XL"
                className={styles.vesselPhoto}
              />
            </div>
            <div className={styles.vesselImageSecondary}>
              <img
                src="/images/belafonte/boating-in-santa-barbara.webp"
                alt="Boating in Santa Barbara"
                className={styles.vesselPhoto}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ PREVIEW ===== */}
      <section className={`section ${styles.faqPreview}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="section-label">Common Questions</span>
            <h2 className="section-title">Everything You Need to Know</h2>
          </div>
          <div className={styles.faqGrid}>
            {[
              { q: 'How many passengers can go on a charter?', a: 'SB Boat Charters is limited to six passengers per trip, ensuring an intimate and personalized experience on every outing.' },
              { q: 'Where do we meet?', a: 'We meet at Santa Barbara Harbor, Marina 3 gate (in the pay parking lot). Parking is $2.50/hour in the adjacent harbor lot.' },
              { q: 'How long does it take to get to Santa Cruz Island?', a: 'In calm conditions, the Belafonte makes the crossing in approximately one hour thanks to her twin 200hp Yamaha outboards.' },
              { q: 'What happens if bad weather is forecasted?', a: 'Safety is our priority. In the event of extreme wind or dangerous conditions, we can reschedule or refund your original deposit.' },
            ].map((faq, i) => (
              <div key={i} className={styles.faqCard}>
                <h3 className={styles.faqQuestion}>{faq.q}</h3>
                <p className={styles.faqAnswer}>{faq.a}</p>
              </div>
            ))}
          </div>
          <div className={styles.faqCTA}>
            <Link href="/faq" className="btn btn--outline-dark">
              View All FAQs
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA WITH IMAGE BACKGROUND ===== */}
      <section className={styles.finalCTA}>
        <img
          src="/images/sunset-cruise.webp"
          alt="Sunset over Santa Barbara Channel"
          className={styles.ctaBackgroundImage}
        />
        <div className={styles.ctaOverlay}></div>
        <div className={`container ${styles.ctaContent}`}>
          <span className="section-label section-label--light">Ready for an Adventure?</span>
          <h2 className={styles.ctaTitle}>Your Next Great Story Starts Here</h2>
          <p className={styles.ctaText}>
            Whether it's exploring sea caves, chasing a sunset along the coast, or landing the
            catch of a lifetime — let's make it happen.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/book/" className="btn btn--primary btn--large">
              Book Your Adventure
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
