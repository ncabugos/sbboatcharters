'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { inSeason, todayPt, shortSeasonLabel } from '@/lib/season';
import { gaEvent } from '@/lib/analytics';
import styles from './LobsterPopup.module.css';

const PROMO_ID = 'lobster-season-2026';
// GA4 only files promotion events under Promotions when they carry items.
const PROMO = {
  promotion_id: PROMO_ID,
  promotion_name: 'Lobster season',
  items: [{ item_id: 'lobster-diving', item_name: 'Lobster Diving' }],
};
const SHOW_AFTER_MS = 6000;
const SHOW_AT_SCROLL = 0.35; // of the page, whichever comes first
const SNOOZE_DISMISS_DAYS = 7;
const SNOOZE_CLICK_DAYS = 30;
const SHOWN_KEY = 'lobster-popup:shown';
const SNOOZE_KEY = 'lobster-popup:until';

// Pages where the card would get in the way or repeat the page itself.
const HIDDEN_ON = ['/book', '/admin', '/lobster-diving', '/unsubscribe', '/gallery'];

function snoozedUntil() {
  try {
    return Number(window.localStorage.getItem(SNOOZE_KEY) || 0);
  } catch {
    return 0;
  }
}

function snooze(days) {
  try {
    window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + days * 86400000));
  } catch {
    // storage blocked: the session flag still keeps it to once per visit
  }
}

export default function LobsterPopup({ start, end, maxParty, hours, price }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hidden = HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (hidden) return undefined;
    if (!inSeason(todayPt(), start, end)) return undefined;
    if (snoozedUntil() > Date.now()) return undefined;
    try {
      // Once per visit: a card that comes back on every page is the kind people hate.
      if (window.sessionStorage.getItem(SHOWN_KEY)) return undefined;
    } catch {
      // ignore
    }

    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      try { window.sessionStorage.setItem(SHOWN_KEY, '1'); } catch { /* ignore */ }
      setOpen(true);
      gaEvent('view_promotion', PROMO);
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= SHOW_AT_SCROLL) show();
    };
    const timer = setTimeout(show, SHOW_AFTER_MS);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [hidden, start, end]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function dismiss() {
    snooze(SNOOZE_DISMISS_DAYS);
    setOpen(false);
  }

  function clicked(where) {
    snooze(SNOOZE_CLICK_DAYS);
    gaEvent('select_promotion', { ...PROMO, creative_slot: where });
    setOpen(false);
  }

  // `hidden` is checked here too: a client-side navigation into /book/ keeps
  // this component mounted, and the card must not sit over the booking flow.
  if (!open || hidden) return null;

  const dates = shortSeasonLabel(start, end);
  const trip = `Private ${hours}-hour day or night trips for up to ${maxParty} divers`;

  return (
    <aside className={styles.card} role="dialog" aria-label="Lobster season booking">
      <img src="/images/lobster-popup.jpg" alt="Diver holding a large California spiny lobster" className={styles.image} loading="lazy" width="560" height="560" />
      <button type="button" className={styles.close} onClick={dismiss} aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
      <div className={styles.body}>
        <h3 className={styles.title}>Lobster season is open</h3>
        <p className={styles.text}>
          {dates}. {trip}{price ? `, ${price}` : ''}.
        </p>
        <div className={styles.actions}>
          <Link href="/book/lobster-diving/" className={`btn btn--primary ${styles.book}`} onClick={() => clicked('book')}>
            Book now
          </Link>
          <Link href="/lobster-diving/" className={styles.more} onClick={() => clicked('details')}>
            See the trip
          </Link>
        </div>
      </div>
    </aside>
  );
}
