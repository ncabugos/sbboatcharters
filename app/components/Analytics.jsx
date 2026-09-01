'use client';

import Script from 'next/script';
import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { GA_MEASUREMENT_ID, gaEvent, gaPageView } from '@/lib/analytics';

// gtag.js only auto-sends a page_view on hard page loads. The App Router navigates
// client-side, so the automatic one is switched off in lib/analytics.js and every
// page_view — including the first — is sent from here instead.
function PageViews() {
  const pathname = usePathname();
  // The string, not the object: useSearchParams returns a fresh instance on every
  // render, which as a dependency would report the same page view repeatedly.
  const qs = useSearchParams().toString();

  useEffect(() => {
    const url = qs ? `${pathname}?${qs}` : pathname;

    // On dynamic routes (every /book/* page) Next streams the <title> in after the
    // page component has already committed — measured at ~300ms, during which
    // document.title is an empty string. Reporting then would file every booking
    // page under a blank title in GA. Send as soon as the title lands instead, and
    // give up after a second so a genuinely untitled page still gets counted.
    if (document.title) {
      gaPageView(url);
      return;
    }

    let sent = false;
    const send = () => {
      if (sent) return;
      sent = true;
      stop();
      gaPageView(url);
    };
    const observer = new MutationObserver(() => { if (document.title) send(); });
    const timer = setTimeout(send, 1000);
    function stop() {
      observer.disconnect();
      clearTimeout(timer);
    }

    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return stop;
  }, [pathname, qs]);

  return null;
}

// A charter this size takes plenty of bookings by phone. Those calls are invisible
// to GA unless the tap is recorded, and there are 24 tel: links across the site —
// so listen once at the document level instead of wiring up each link.
function OutboundContactClicks() {
  useEffect(() => {
    function onClick(e) {
      const link = e.target.closest?.('a[href^="tel:"], a[href^="mailto:"]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      gaEvent(href.startsWith('tel:') ? 'phone_click' : 'email_click', {
        link_url: href,
        page_path: window.location.pathname,
      });
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}

export default function Analytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      {/* useSearchParams needs a Suspense boundary or it opts every page out of
          static rendering. */}
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
      <OutboundContactClicks />
    </>
  );
}
