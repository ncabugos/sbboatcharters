'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';

const NAV_LINKS = [
  {
    label: 'Charters',
    submenu: [
      { label: 'Channel Islands Tour', href: '/channel-islands-tour' },
      { label: 'Coastal & Sunset Cruises', href: '/coastal-sunset-cruises' },
      { label: 'Spearfishing', href: '/spearfishing' },
      { label: 'Lobster Diving', href: '/lobster-diving' },
      { label: 'Sport Fishing', href: '/sport-fishing' },
      { label: 'Foiling', href: '/foiling' },
    ],
  },
  { label: 'The Belafonte', href: '/the-belafonte' },
  { label: 'About', href: '/about' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  // Auto-close mobile menu when viewport grows past breakpoint
  useEffect(() => {
    if (typeof window === 'undefined' || !mobileOpen) return;
    const mq = window.matchMedia('(min-width: 1025px)');
    const handleChange = (e) => { if (e.matches) setMobileOpen(false); };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [mobileOpen]);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo} onClick={() => setMobileOpen(false)}>
          <img src="/images/logo/logo-white.svg" alt="Santa Barbara Boat Charters" className={styles.logoImg} />
          <div className={styles.logoText}>
            <span className={styles.logoName}>Santa Barbara</span>
            <span className={styles.logoSub}>Boat Charters</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.desktopNav}>
          {NAV_LINKS.map((item) =>
            item.submenu ? (
              <div
                key={item.label}
                className={styles.dropdown}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button className={styles.navLink}>
                  {item.label}
                  <svg className={styles.chevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className={`${styles.dropdownMenu} ${dropdownOpen ? styles.dropdownOpen : ''}`}>
                  {item.submenu.map((sub) => (
                    <Link key={sub.href} href={sub.href} className={styles.dropdownItem}>
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link key={item.href} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* CTA + Phone */}
        <div className={styles.headerActions}>
          <a href="tel:+18057222282" className={styles.phone}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14.667 11.28v1.887a1.258 1.258 0 01-1.372 1.258 12.45 12.45 0 01-5.428-1.93 12.267 12.267 0 01-3.773-3.774 12.45 12.45 0 01-1.93-5.453A1.258 1.258 0 013.42 1.9h1.887A1.258 1.258 0 016.565 2.98a8.08 8.08 0 00.44 1.77 1.258 1.258 0 01-.283 1.327l-.799.799a10.067 10.067 0 003.774 3.774l.799-.8a1.258 1.258 0 011.327-.282 8.08 8.08 0 001.77.44 1.258 1.258 0 011.074 1.27z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className={styles.phoneText}>(805) 722-2282</span>
          </a>
          <Link
            href="/book/"
            className={`btn btn--primary ${styles.bookBtn}`}
          >
            Book Now
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className={`${styles.mobileToggle} ${mobileOpen ? styles.mobileToggleActive : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileMenuOpen : ''}`}>
        <nav className={styles.mobileNav}>
          <p className={styles.mobileLabel}>Charters</p>
          {NAV_LINKS[0].submenu.map((sub) => (
            <Link key={sub.href} href={sub.href} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
              {sub.label}
            </Link>
          ))}
          <div className={styles.mobileDivider}></div>
          {NAV_LINKS.slice(1).map((item) => (
            <Link key={item.href} href={item.href} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
              {item.label}
            </Link>
          ))}
          <div className={styles.mobileDivider}></div>
          <a href="tel:+18057222282" className={styles.mobilePhone}>
            📞 (805) 722-2282
          </a>
          <Link
            href="/book/"
            className={`btn btn--primary btn--large ${styles.mobileCTA}`}
            onClick={() => setMobileOpen(false)}
          >
            Book Your Adventure
          </Link>
        </nav>
      </div>
    </header>
  );
}
