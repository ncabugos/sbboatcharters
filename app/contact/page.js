'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './contact.module.css';
import { gaEvent } from '@/lib/analytics';

// Set in Vercel env to turn Turnstile on. Until then, the widget is hidden and
// the server-side Tier-1 checks (honeypot, time-trap, validation) carry the load.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function Contact() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', charter: '', message: '' });
  const [company, setCompany] = useState(''); // honeypot — real users never see/fill this
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const startedAt = useRef(Date.now()); // time-trap: how long the form took to fill
  const turnstileRef = useRef(null);
  const turnstileId = useRef(null);
  const [token, setToken] = useState('');

  // Render the Cloudflare Turnstile widget once its script loads (only if a site key is configured).
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    const renderWidget = () => {
      if (!window.turnstile || !turnstileRef.current || turnstileId.current !== null) return;
      turnstileId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: setToken,
        'expired-callback': () => setToken(''),
        'error-callback': () => setToken(''),
      });
    };
    if (window.turnstile) {
      renderWidget();
    } else {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true;
      s.defer = true;
      s.onload = renderWidget;
      document.head.appendChild(s);
    }
    return () => {
      if (turnstileId.current !== null && window.turnstile) {
        window.turnstile.remove(turnstileId.current);
        turnstileId.current = null;
      }
    };
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (TURNSTILE_SITE_KEY && !token) {
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/contact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          company,
          elapsedMs: Date.now() - startedAt.current,
          turnstileToken: token,
        }),
      });
      setStatus(res.ok ? 'success' : 'error');
      if (res.ok) {
        // The site's other conversion: an enquiry that never touches the booking
        // engine. `charter` tells us which trip the enquiry was about.
        gaEvent('generate_lead', { form_name: 'contact', charter: form.charter || 'unspecified' });
      }
      if (!res.ok && window.turnstile && turnstileId.current !== null) {
        window.turnstile.reset(turnstileId.current);
        setToken('');
      }
    } catch {
      setStatus('error');
    }
  };
  return (
    <>
      <section className={styles.hero}>
        <img src="/images/belafonte/belafonte.webp" alt="The Belafonte at Santa Barbara Harbor" className={styles.heroBgImage} loading="eager" fetchPriority="high" />
        <div className={styles.heroOverlay} style={{ background: 'rgba(10,15,22,0.70)' }} />
        <div className={`container ${styles.heroContent}`}>
          <span className={styles.heroLabel}>Get In Touch</span>
          <h1 className={styles.heroTitle}>Contact Us</h1>
          <p className={styles.heroSubtitle}>
            Ready to plan your adventure? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className={`section ${styles.contactSection}`}>
        <div className={`container ${styles.contactGrid}`}>
          <div className={styles.contactInfo}>
            <h2 className="section-title">Let's Plan Your Charter</h2>
            <p className={styles.contactText}>
              Whether you have a specific adventure in mind or want help choosing the perfect
              experience, don't hesitate to reach out. We're happy to customize any charter
              to fit your group's needs.
            </p>
            <div className={styles.infoCards}>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.89 9.5a19.79 19.79 0 01-3.07-8.67A2 2 0 012.81 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L7.09 9.91a16 16 0 006 6l.97-.97a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                </span>
                <h3 className={styles.infoTitle}>Call Us</h3>
                <a href="tel:+18057222282" className={styles.infoValue}>(805) 722-2282</a>
                <p className={styles.infoNote}>Best for same-day inquiries</p>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <h3 className={styles.infoTitle}>Email</h3>
                <a href="mailto:garrick.gch@gmail.com" className={styles.infoValue} style={{ textDecoration: 'none', color: 'inherit' }}>info@sbboatcharters.com</a>
                <p className={styles.infoNote}>We respond within 24 hours</p>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </span>
                <h3 className={styles.infoTitle}>Location</h3>
                <span className={styles.infoValue}>Santa Barbara Harbor, Marina 3</span>
                <p className={styles.infoNote}>Parking: $2.50/hr in the harbor lot</p>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </span>
                <h3 className={styles.infoTitle}>Hours</h3>
                <span className={styles.infoValue}>7 Days a Week</span>
                <p className={styles.infoNote}>6:00 AM – 8:00 PM (weather permitting)</p>
              </div>
            </div>
          </div>
          <div className={styles.formCard}>
            <h3 className={styles.formTitle}>Send Us a Message</h3>
            <p className={styles.formSubtitle}>Tell us about the adventure you imagine</p>
            {status === 'success' ? (
              <div className={styles.successMsg}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-ocean-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <h3>Message Sent!</h3>
                <p>Thanks, {form.firstName}. We'll get back to you within 24 hours.</p>
              </div>
            ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>First Name</label>
                  <input type="text" name="firstName" value={form.firstName} onChange={handleChange} className={styles.formInput} placeholder="Your first name" required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Last Name</label>
                  <input type="text" name="lastName" value={form.lastName} onChange={handleChange} className={styles.formInput} placeholder="Your last name" />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className={styles.formInput} placeholder="your@email.com" required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={styles.formInput} placeholder="(555) 555-5555" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Charter Interest</label>
                <select name="charter" value={form.charter} onChange={handleChange} className={styles.formInput}>
                  <option value="">Select a charter type...</option>
                  <option>Channel Islands Tour</option>
                  <option>Coastal / Sunset Cruise</option>
                  <option>Spearfishing</option>
                  <option>Lobster Diving</option>
                  <option>Sport Fishing</option>
                  <option>Foiling</option>
                  <option>Custom Experience</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Message</label>
                <textarea name="message" value={form.message} onChange={handleChange} className={styles.formTextarea} rows="4" placeholder="Tell us about the adventure you're imagining..." required></textarea>
              </div>
              {/* Honeypot — visually hidden, off-screen, and skipped by tab/autofill. Bots fill it; humans don't. */}
              <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>
                <label>Company<input type="text" name="company" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} /></label>
              </div>
              {TURNSTILE_SITE_KEY && (
                <div ref={turnstileRef} className={styles.turnstile} style={{ marginBottom: '1rem' }} />
              )}
              {status === 'error' && (
                <p className={styles.errorMsg}>Something went wrong. Please try again or call us directly.</p>
              )}
              <button type="submit" className="btn btn--primary btn--large" style={{ width: '100%' }} disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
