// Google Analytics 4 helpers.
//
// The measurement ID is hardcoded on purpose. It is not a secret (it ships in the
// page source of every GA-tagged site on the web), and `.env*` is gitignored — so an
// env-only ID would mean analytics silently switching off in production the moment
// someone forgot to add the variable in Vercel. The env var still wins if set, which
// is what a staging property would use.
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-Q68PTNYTVX';

// gtag.js is really just a queue: commands are pushed onto window.dataLayer, and
// the remote script replays everything already queued when it finishes loading.
// So what matters is the order *inside* the queue, not whether the script has
// arrived yet.
//
// This is why the `js`/`config` bootstrap lives here at module scope rather than in
// the <Script> tag. React runs a page's effects before an `afterInteractive` script
// executes, so an event fired on mount — the `purchase` on the confirmation page,
// most importantly — would find no gtag and be thrown away. Every module that
// reports an event imports this one, so importing it is enough to guarantee that
// `js` and `config` are already sitting in front of that event in the queue.
function push(args) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

function gtag() {
  push(arguments);
}

let bootstrapped = false;
function bootstrap() {
  if (bootstrapped || typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;
  bootstrapped = true;
  window.gtag = window.gtag || gtag;
  gtag('js', new Date());
  // Page views are sent by hand from app/components/Analytics.jsx — the automatic
  // one only fires on hard loads and would miss every client-side route change.
  gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
}

bootstrap();

export function gaPageView(url) {
  gtag('event', 'page_view', {
    page_path: url,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    page_title: typeof document !== 'undefined' ? document.title : undefined,
  });
}

export function gaEvent(name, params = {}) {
  gtag('event', name, params);
}

// Money in GA4 is dollars, not cents.
export function usd(cents) {
  return Math.round(cents) / 100;
}

// Redirect-based payment returns (Stripe) and the auto-refreshing confirmation page
// both re-render the success state, which would double-count revenue. Key each
// conversion by its transaction id and let it through exactly once per browser tab.
export function gaEventOnce(key, name, params = {}) {
  if (typeof window === 'undefined') return;
  const storageKey = `ga:sent:${key}`;
  try {
    if (window.sessionStorage.getItem(storageKey)) return;
  } catch {
    // Private mode / storage disabled: send it. A rare duplicate beats losing the
    // conversion entirely.
  }
  gaEvent(name, params);
  // Marked only after the push, so a throw above can't burn the one chance to
  // report a booking.
  try {
    window.sessionStorage.setItem(storageKey, '1');
  } catch { /* nothing to do */ }
}
