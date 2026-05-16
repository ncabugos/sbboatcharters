'use client';

import { useState } from 'react';
import styles from './faq.module.css';

const FAQS = [
  { q: 'How many passengers can go on a charter?', a: 'SB Boat Charters is limited to six passengers per charter. This ensures an intimate, personalized experience on every outing. For spearfishing trips, the limit is 4 passengers.' },
  { q: 'Where do we meet?', a: 'We meet at the Santa Barbara Harbor, at the Marina 3 gate (in the pay parking lot). We recommend arriving 10-15 minutes early so you can get settled and we can depart on time.' },
  { q: 'Is there parking?', a: 'Yes! Marina 3 is adjacent to the paid harbor lot. Parking is $2.50 per hour. There is typically plenty of parking available.' },
  { q: 'Do you provide food and drinks?', a: 'Food and drinks can be provided by special request. Please let us know in advance if this is an option you\'d like to add. Many guests choose to bring their own cooler with beverages and snacks.' },
  { q: 'Is there a restroom aboard?', a: 'Yes, there is a portable toilet on the deck for your convenience during longer charters.' },
  { q: 'How long does it take to get to Santa Cruz Island?', a: 'In calm conditions, the Belafonte makes the crossing in approximately one hour thanks to her twin Yamaha 200hp outboards. Conditions permitting, we maintain a comfortable cruising speed throughout.' },
  { q: 'What should I bring?', a: 'We recommend bringing sunscreen (reef-safe preferred), a hat, sunglasses, layers for wind, a swimsuit and towel, a camera or waterproof phone case, and any snacks or drinks you\'d like. Motion sickness medication is recommended if you\'re prone to seasickness.' },
  { q: 'How much should I tip?', a: 'While not obligatory, tips are greatly appreciated. 10-20% of the charter cost is standard and a wonderful way to show appreciation for a great experience.' },
  { q: 'What happens if bad weather is forecasted?', a: 'Safety is our top priority. In the event of extreme wind or dangerous conditions, we will work with you to reschedule your charter. If rescheduling isn\'t possible, we\'ll refund your original deposit.' },
  { q: 'What is the cancellation policy?', a: 'Deposits are refundable with a minimum of two weeks notice or due to inclement weather. We understand plans change and will always work with you to find a solution.' },
  { q: 'Is the captain licensed?', a: 'Yes! Captain Garrick holds a USCG (United States Coast Guard) license. The Belafonte also undergoes yearly Coast Guard examinations to ensure compliance with the latest safety regulations.' },
  { q: 'Can I customize my charter?', a: 'Absolutely! Every charter is tailored to your desires. Whether you want to focus on fishing, sightseeing, diving, or a mix of activities, just let us know your preferences and we\'ll craft the perfect experience.' },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className={styles.hero}>
        <img src="/images/belafonte/channel-island-charters.webp" alt="Channel Islands" className={styles.heroBgImage} loading="eager" fetchPriority="high" />
        <div className={styles.heroOverlay} style={{ background: 'rgba(10,15,22,0.72)' }} />
        <div className={`container ${styles.heroContent}`}>
          <span className={styles.heroLabel}>Help Center</span>
          <h1 className={styles.heroTitle}>Frequently Asked Questions</h1>
          <p className={styles.heroSubtitle}>
            Everything you need to know before your Santa Barbara boat charter adventure.
          </p>
        </div>
      </section>

      <section className={`section ${styles.faqSection}`}>
        <div className="container container--narrow">
          <div className={styles.faqList}>
            {FAQS.map((faq, i) => (
              <div key={i} className={`${styles.faqItem} ${openIndex === i ? styles.faqItemOpen : ''}`}>
                <button className={styles.faqButton} onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                  <h2 className={styles.faqQuestion}>{faq.q}</h2>
                  <span className={styles.faqToggle}>{openIndex === i ? '−' : '+'}</span>
                </button>
                <div className={styles.faqAnswer}>
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.ctaBox}>
            <h3 className={styles.ctaTitle}>Still Have Questions?</h3>
            <p className={styles.ctaText}>Don't hesitate to reach out — we're happy to help plan your perfect charter.</p>
            <div className={styles.ctaActions}>
              <a href="tel:+18057222282" className="btn btn--primary">Call (805) 722-2282</a>
              <a href="/contact" className="btn btn--outline-dark">Contact Us</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
