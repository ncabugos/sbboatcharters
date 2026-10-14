import styles from './about.module.css';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  path: '/about/',
  title: 'About Captain Garrick',
  description:
    'Meet Captain Garrick, a USCG licensed captain with over 20 years diving and exploring the California coast and the Channel Islands from Santa Barbara.',
  image: '/images/captain-garrick/garrick-lobster.webp',
  imageAlt: 'Captain Garrick',
});

export default function About() {
  return (
    <>
      <section className={styles.hero}>
        <img
          src="/images/belafonte/channel-island-charters.webp"
          alt="Captain Garrick on a Channel Islands charter"
          className={styles.heroBgImage}
          loading="eager"
          fetchPriority="high"
        />
        <div className={styles.heroOverlay}></div>
        <div className={`container ${styles.heroContent}`}>
          <span className={styles.heroLabel}>Your Captain</span>
          <h1 className={styles.heroTitle}>The Man Behind the Helm</h1>
          <p className={styles.heroSubtitle}>
            Over 20 years of exploring every mile of the California coast. This isn't a job — it's a lifelong passion.
          </p>
        </div>
      </section>

      <section className={`section ${styles.story}`}>
        <div className={`container ${styles.storyGrid}`}>
          <div className={styles.storyImageWrap}>
            <div className={styles.storyImage}>
              <img
                src="/images/captain-garrick/garrick-lobster.webp"
                alt="Captain Garrick with the catch"
                className={styles.storyPhoto}
              />
            </div>
          </div>
          <div className={styles.storyContent}>
            <span className="section-label">My Story</span>
            <h2 className="section-title">Showing People the Language of the Ocean</h2>
            <div className={styles.divider}></div>
            <p className={styles.text}>
              My passion is showing people the language of the ocean: to give you a lens of ocean
              exploration I have curated from decades of personal adventures in and on the water.
              To engage people with a hand of knowledge and expertise to help people find a
              higher level comfort and understanding in the water.
            </p>
            <p className={styles.text}>
              Santa Barbara Boat Charters is an immersive experience for those seeking a hand-tailored
              outdoor adventure. These tours are the culmination of over 20 years of diving and
              exploring the California coast.
            </p>
            <p className={styles.text}>
              This is your one-stop shop for personalized Channel Islands experiences. Having dove
              and explored all the Channel Islands, I have compiled quite a few gems off our coast
              to share with my clients. From the massive sea caves of Santa Cruz to the remote
              shores of San Miguel — I know these waters like the back of my hand.
            </p>
            <p className={styles.text}>
              All I ask is that you maintain a curious eye and pay these magic lands the
              respect they deserve. Come find your new love of the ocean.
            </p>
          </div>
        </div>
      </section>

      {/* ===== FULL-WIDTH IMAGE BREAK ===== */}
      <section className={styles.imageBreak}>
        <img src="/images/stephen-wiggins-unsplash.jpg" alt="Santa Barbara coastal scenery" />
        <div className={styles.imageBreakOverlay}></div>
      </section>

      <section className={`section ${styles.values}`}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="section-label">Our Philosophy</span>
            <h2 className="section-title">What Sets Us Apart</h2>
          </div>
          <div className={styles.valuesGrid}>
            {[
              {
                // Compass
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
                title: 'Personalized', desc: 'Every charter is tailored to your interests. No cookie-cutter tours. Tell us your dream adventure.',
              },
              {
                // Life ring
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>,
                title: 'Safety First', desc: 'USCG licensed and examined annually. 9,000 lbs of built-in buoyancy. Your safety is non-negotiable.',
              },
              {
                // Folded chart
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg>,
                title: 'Deep Knowledge', desc: '20+ years of diving every reef, cave, and cove in the Santa Barbara Channel. We know where to go.',
              },
              {
                // Small group
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                title: 'Intimate Experience', desc: 'Max 6 passengers. No crowds. Just you, the ocean, and a captain who genuinely cares about your experience.',
              },
            ].map((v) => (
              <div key={v.title} className={styles.valueCard}>
                <span className="icon-badge">{v.icon}</span>
                <h3 className={styles.valueTitle}>{v.title}</h3>
                <p className={styles.valueDesc}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
