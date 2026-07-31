import Link from 'next/link';
import styles from './Footer.module.css';

const CHARTER_LINKS = [
  { label: 'Channel Islands Tour', href: '/channel-islands-tour' },
  { label: 'Coastal & Sunset Cruises', href: '/coastal-sunset-cruises' },
  { label: 'Spearfishing', href: '/spearfishing' },
  { label: 'Sport Fishing', href: '/sport-fishing' },
  { label: 'Foiling', href: '/foiling' },
  { label: 'Gift Cards', href: '/gift-cards' },
];

const INFO_LINKS = [
  { label: 'About Captain Garrick', href: '/about' },
  { label: 'The Belafonte', href: '/the-belafonte' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={`container ${styles.footerGrid}`}>
          {/* Brand Column */}
          <div className={styles.brandCol}>
            <Link href="/" className={styles.footerLogo}>
              <img src="/images/logo/logo-white.png" alt="Santa Barbara Boat Charters" style={{ height: '32px', width: 'auto' }} />
            </Link>
            <p className={styles.brandDesc}>
              Private 6-passenger boat charters in the Santa Barbara Channel.
              Over 20 years of experience exploring the California coast and Channel Islands.
            </p>
            <div className={styles.social}>
              <a href="https://www.instagram.com/sbboatcharters/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={styles.socialLink}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="20" height="20" rx="5"/>
                  <circle cx="12" cy="12" r="5"/>
                  <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              <a href="https://www.youtube.com/@sbboatcharters" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className={styles.socialLink}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.35z"/>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Charters Column */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>Charters</h4>
            <ul className={styles.linkList}>
              {CHARTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.footerLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Column */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>Information</h4>
            <ul className={styles.linkList}>
              {INFO_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.footerLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>Get In Touch</h4>
            <div className={styles.contactInfo}>
              <a href="tel:+18057222282" className={styles.contactItem}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M14.667 11.28v1.887a1.258 1.258 0 01-1.372 1.258 12.45 12.45 0 01-5.428-1.93 12.267 12.267 0 01-3.773-3.774 12.45 12.45 0 01-1.93-5.453A1.258 1.258 0 013.42 1.9h1.887A1.258 1.258 0 016.565 2.98a8.08 8.08 0 00.44 1.77 1.258 1.258 0 01-.283 1.327l-.799.799a10.067 10.067 0 003.774 3.774l.799-.8a1.258 1.258 0 011.327-.282 8.08 8.08 0 001.77.44 1.258 1.258 0 011.074 1.27z"/>
                </svg>
                (805) 722-2282
              </a>
              <div className={styles.contactItem}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M14 3H2l6 5 6-5zM2 3v10h12V3"/>
                </svg>
                <a href="mailto:garrick.gch@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>info@sbboatcharters.com</a>
              </div>
              <div className={styles.contactItem}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M8 1C5.2 1 3 3.2 3 6c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z"/>
                  <circle cx="8" cy="6" r="2"/>
                </svg>
                Santa Barbara Harbor, Marina 3
              </div>
            </div>
            <Link
              href="/book/"
              className={`btn btn--primary ${styles.footerCTA}`}
            >
              Book Your Adventure
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.footerBottom}>
        <div className={`container ${styles.bottomInner}`}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Santa Barbara Boat Charters. All rights reserved.
            <span className={styles.credit}>
              {' · '}Site design by{' '}
              <a
                href="https://nickcabugos.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.creditLink}
              >
                nickcabugos.com
              </a>
            </span>
          </p>
          <p className={styles.uscg}>
            USCG Examined OUPV · Six-Passenger Vessel
          </p>
        </div>
      </div>

      {/* LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Santa Barbara Boat Charters',
            description: 'Private 6-passenger boat charters in Santa Barbara. Channel Islands tours, coastal cruises, sunset cruises, spearfishing, sport fishing, and foiling adventures with over 20 years of experience.',
            url: 'https://www.sbboatcharters.com',
            telephone: '+18057222282',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Santa Barbara Harbor, Marina 3',
              addressLocality: 'Santa Barbara',
              addressRegion: 'CA',
              postalCode: '93109',
              addressCountry: 'US',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 34.4048,
              longitude: -119.6932,
            },
            openingHours: 'Mo-Su 06:00-20:00',
            priceRange: '$$',
            image: 'https://www.sbboatcharters.com/og-image.jpg',
            sameAs: [
              'https://www.instagram.com/sbboatcharters/',
              'https://www.facebook.com/boatcharterssb',
              'https://www.youtube.com/@sbboatcharters',
            ],
          }),
        }}
      />
    </footer>
  );
}
