import { Resend } from 'resend';
import { formatUsd } from './pricing';
import { formatPt } from './availability';
import { abandonedCheckoutCopy } from './abandonedCheckoutCopy';

const FROM = 'SB Boat Charters <info@sbboatcharters.com>';
// Who gets the "new booking" alert. BOOKING_NOTIFY_EMAIL (comma-separated)
// replaces the whole list, so dev/preview environments don't email the real
// captain — it must stay unset in production.
const NOTIFY_EMAILS = (process.env.BOOKING_NOTIFY_EMAIL || 'garrick.gch@gmail.com,cabugosb3@gmail.com')
  .split(',')
  .map((addr) => addr.trim())
  .filter(Boolean);

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

// Email failures must never fail a webhook/booking — log and continue.
// Returns whether Resend accepted it, for callers (crons) that release a claim on failure.
async function safeSend(payload) {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set; skipped:', payload.subject);
    return false;
  }
  try {
    const { error } = await resend.emails.send(payload);
    if (error) {
      console.error('[email] send failed:', payload.subject, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] send threw:', payload.subject, err);
    return false;
  }
}

const wrap = (inner) => `
  <div style="font-family:Montserrat,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#141618;">
    <div style="background:#141618;padding:24px;text-align:center;">
      <span style="color:#E8ECF0;font-size:18px;letter-spacing:0.12em;text-transform:uppercase;font-weight:300;">SB Boat Charters</span>
    </div>
    <div style="padding:24px;border:1px solid #e5e5e5;border-top:none;">${inner}</div>
    <p style="color:#9BA5B4;font-size:12px;text-align:center;padding:16px;">
      SB Boat Charters &middot; 302 W. Cabrillo Blvd, Santa Barbara, CA 93109 &middot; (805) 722-2282
    </p>
  </div>`;

function tripDetailsHtml(b) {
  const when = formatPt(new Date(b.trip_start), {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
  return `
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#9BA5B4;">Trip</td><td style="text-align:right;">${escapeHtml(b.tour_name)} — ${escapeHtml(b.option_label)}</td></tr>
      <tr><td style="padding:6px 0;color:#9BA5B4;">Departure</td><td style="text-align:right;">${when} (Pacific)</td></tr>
      <tr><td style="padding:6px 0;color:#9BA5B4;">Guests</td><td style="text-align:right;">${b.party_size}</td></tr>
      <tr><td style="padding:6px 0;color:#9BA5B4;">Meeting point</td><td style="text-align:right;">${escapeHtml(b.meeting_point)}</td></tr>
      ${b.tax_cents > 0 ? `<tr><td style="padding:6px 0;color:#9BA5B4;">Taxes</td><td style="text-align:right;">${formatUsd(b.tax_cents)}</td></tr>` : ''}
      ${b.gift_card_cents > 0 ? `<tr><td style="padding:6px 0;color:#9BA5B4;">Gift card applied</td><td style="text-align:right;">−${formatUsd(b.gift_card_cents)}</td></tr>` : ''}
      <tr><td style="padding:6px 0;color:#9BA5B4;">Paid</td><td style="text-align:right;font-weight:600;">${formatUsd(b.charged_cents)}</td></tr>
    </table>`;
}

export async function sendBookingConfirmation(b) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/book/confirmation/${b.confirmation_token}`;
  await safeSend({
    from: FROM,
    to: b.customer_email,
    subject: `Booking confirmed — ${b.tour_name}`,
    html: wrap(`
      <h2 style="font-weight:300;text-transform:uppercase;letter-spacing:0.08em;">You're booked, ${escapeHtml(b.customer_name.split(' ')[0])}!</h2>
      ${tripDetailsHtml(b)}
      <p style="font-size:14px;">Meet Captain Garrick at <strong>Marina 3 Gate</strong> 15 minutes before departure.</p>
      <p style="font-size:13px;color:#9BA5B4;">${escapeHtml(b.policy_text || '')}</p>
      <p><a href="${url}" style="display:inline-block;background:#E8481E;color:#fff;padding:12px 24px;text-decoration:none;text-transform:uppercase;letter-spacing:0.08em;font-size:13px;">View your booking</a></p>
      <p style="font-size:13px;">Questions? Call (805) 722-2282 or reply to this email.</p>
    `),
  });
}

export async function sendCaptainNotification(b) {
  await safeSend({
    from: FROM,
    to: NOTIFY_EMAILS,
    replyTo: b.customer_email,
    subject: `New booking: ${b.tour_name} — ${formatPt(new Date(b.trip_start), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`,
    html: wrap(`
      <h2 style="font-weight:300;">New booking${b.source === 'admin' ? ' (manual)' : ''}</h2>
      ${tripDetailsHtml(b)}
      <table style="width:100%;font-size:14px;border-collapse:collapse;margin-top:12px;">
        <tr><td style="padding:6px 0;color:#9BA5B4;">Customer</td><td style="text-align:right;">${escapeHtml(b.customer_name)}</td></tr>
        <tr><td style="padding:6px 0;color:#9BA5B4;">Email</td><td style="text-align:right;">${escapeHtml(b.customer_email)}</td></tr>
        <tr><td style="padding:6px 0;color:#9BA5B4;">Phone</td><td style="text-align:right;">${escapeHtml(b.customer_phone || '—')}</td></tr>
        ${b.notes ? `<tr><td style="padding:6px 0;color:#9BA5B4;">Notes</td><td style="text-align:right;">${escapeHtml(b.notes)}</td></tr>` : ''}
      </table>
    `),
  });
}

// Sent the morning after a trip by the daily cron. One ask, one link — adding a
// rebook or gift-card pitch alongside it measurably splits the click.
export async function sendReviewRequest(b) {
  const reviewUrl = process.env.GOOGLE_REVIEW_URL;
  if (!reviewUrl) {
    console.warn('[email] GOOGLE_REVIEW_URL not set; skipped review request for', b.id);
    return false;
  }
  const first = escapeHtml((b.customer_name || '').split(' ')[0] || 'there');
  return safeSend({
    from: FROM,
    to: b.customer_email,
    replyTo: 'garrick.gch@gmail.com',
    subject: `Thank you for coming out, ${first}!`,
    html: wrap(`
      <h2 style="font-weight:300;text-transform:uppercase;letter-spacing:0.08em;">Thank you, ${first}</h2>
      <p style="font-size:14px;">It was a pleasure having you aboard The Belafonte for the
        ${escapeHtml(b.tour_name)}. I hope the channel treated you well and that you went home
        with a few good stories.</p>
      <p style="font-size:14px;">If you enjoyed the trip, would you mind leaving a quick review on
        Google? Word of mouth is how most people find us, and it genuinely makes a difference for
        a small local operation like ours. It only takes a minute.</p>
      <p><a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background:#E8481E;color:#fff;padding:12px 24px;text-decoration:none;text-transform:uppercase;letter-spacing:0.08em;font-size:13px;">Leave a review</a></p>
      <p style="font-size:14px;">And if anything fell short, please just reply to this email and
        tell me directly — I would rather hear it from you and make it right.</p>
      <p style="font-size:14px;">Hope to see you on the water again.</p>
      <p style="font-size:14px;">— Captain Garrick</p>
    `),
  });
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sbboatcharters.com';

// Sent about an hour after a guest started checkout and left without paying.
// Subject, headline and pitch are tailored per experience in lib/abandonedCheckoutCopy.js.
// Commercial email under CAN-SPAM: needs the postal address (in `wrap`) and a
// working unsubscribe, which is keyed on the booking's own random token so no
// new secret is involved. The link reopens the booking page with the trip,
// length and party size already chosen; name and email stay out of the URL.
export async function sendAbandonedCheckout(b) {
  const first = escapeHtml((b.customer_name || '').split(' ')[0] || 'there');
  const tripDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(b.trip_start));
  const when = formatPt(new Date(b.trip_start), {
    weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  const resume = new URL(`/book/${b.tour_slug}/`, SITE_URL);
  resume.search = new URLSearchParams({
    date: tripDate,
    option: String(b.pricing_option_id),
    party: String(b.party_size),
    utm_source: 'email',
    utm_medium: 'email',
    utm_campaign: 'abandoned_checkout',
  }).toString();
  const unsubscribePage = `${SITE_URL}/unsubscribe/?t=${b.confirmation_token}`;
  const oneClick = `${SITE_URL}/api/unsubscribe/?t=${b.confirmation_token}`;
  const row = (label, value) =>
    `<tr><td style="padding:6px 0;color:#9BA5B4;">${label}</td><td style="text-align:right;">${value}</td></tr>`;

  const copy = abandonedCheckoutCopy(b);
  const image = b.tour_image_url
    ? `<img src="${escapeHtml(new URL(b.tour_image_url, SITE_URL).toString())}" alt="${escapeHtml(b.tour_name)}" width="512" style="display:block;width:100%;height:auto;margin:0 0 16px;">`
    : '';

  return safeSend({
    from: FROM,
    to: b.customer_email,
    replyTo: 'garrick.gch@gmail.com',
    subject: copy.subject,
    headers: {
      'List-Unsubscribe': `<${oneClick}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    html: wrap(`
      ${image}
      <h2 style="font-weight:300;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(copy.headline)}, ${first}</h2>
      <p style="font-size:14px;">${escapeHtml(copy.pitch)}</p>
      <p style="font-size:14px;">You started booking this trip but didn't get to the end. Here is what you picked:</p>
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        ${row('Trip', `${escapeHtml(b.tour_name)}, ${escapeHtml(b.option_label)}`)}
        ${row('Departure', `${when} (Pacific)`)}
        ${row('Guests', b.party_size)}
        ${row('Total', formatUsd(b.charged_cents + b.gift_card_cents))}
      </table>
      <p style="font-size:14px;">The hold on that time has been released, so another group can book it.
        If it's still open, you can pick up where you left off.</p>
      <p><a href="${escapeHtml(resume.toString())}" style="display:inline-block;background:#E8481E;color:#fff;padding:12px 24px;text-decoration:none;text-transform:uppercase;letter-spacing:0.08em;font-size:13px;">Finish booking</a></p>
      <p style="font-size:14px;">Questions about the trip, the weather or what to bring? Reply to this
        email or call me at (805) 722-2282.</p>
      <p style="font-size:14px;">Captain Garrick</p>
      <p style="font-size:12px;color:#9BA5B4;">You're getting this because you entered your email while
        booking. <a href="${unsubscribePage}" style="color:#9BA5B4;">Unsubscribe</a></p>
    `),
  });
}

export async function sendBookingApology(b) {
  await safeSend({
    from: FROM,
    to: b.customer_email,
    subject: 'About your SB Boat Charters booking',
    html: wrap(`
      <h2 style="font-weight:300;">We're sorry — we could not confirm that time</h2>
      <p style="font-size:14px;">Your payment completed after the hold on your time slot had ended, so that trip is no longer reserved for you. <strong>Your payment has been fully refunded</strong> — you'll see it back on your card within a few business days.</p>
      <p style="font-size:14px;">We'd love to get you on the water: call Captain Garrick at (805) 722-2282 and we'll find you a time, or book again online.</p>
    `),
  });
}

export async function sendGiftCardDelivery(card) {
  const to = card.recipient_email || card.purchaser_email;
  const name = card.recipient_name || card.purchaser_name || 'there';
  await safeSend({
    from: FROM,
    to,
    subject: 'You\'ve received an SB Boat Charters gift card!',
    html: wrap(`
      <h2 style="font-weight:300;text-transform:uppercase;letter-spacing:0.08em;">A day on the water awaits, ${escapeHtml(name)}</h2>
      ${card.message ? `<p style="font-size:14px;font-style:italic;">&ldquo;${escapeHtml(card.message)}&rdquo;</p>` : ''}
      <div style="background:#141618;color:#E8ECF0;padding:32px;text-align:center;margin:16px 0;">
        <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#9BA5B4;">Gift card value</div>
        <div style="font-size:36px;font-weight:300;margin:8px 0;">${formatUsd(card.initial_cents)}</div>
        <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#9BA5B4;">Code</div>
        <div style="font-size:22px;letter-spacing:0.15em;color:#E8481E;font-weight:600;">${escapeHtml(card.code)}</div>
      </div>
      <p style="font-size:14px;">Redeem it on any charter at <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://sbboatcharters.com'}/book" style="color:#E8481E;">sbboatcharters.com/book</a> — enter the code at checkout. Never expires.</p>
    `),
  });
}

export async function sendGiftCardSaleNotification(card) {
  const sentTo = card.recipient_email || card.purchaser_email;
  const recipient = card.recipient_name || card.recipient_email;
  const row = (label, value) => `
    <tr><td style="padding:6px 0;color:#9BA5B4;">${label}</td><td style="text-align:right;">${value}</td></tr>`;
  await safeSend({
    from: FROM,
    to: NOTIFY_EMAILS,
    replyTo: card.purchaser_email,
    subject: `Gift card sold — ${formatUsd(card.initial_cents)}`,
    html: wrap(`
      <h2 style="font-weight:300;">Gift card sold</h2>
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        ${row('Value', `<strong>${formatUsd(card.initial_cents)}</strong>`)}
        ${row('Code', `<span style="letter-spacing:0.1em;">${escapeHtml(card.code)}</span>`)}
        ${row('Purchaser', escapeHtml(card.purchaser_name || '—'))}
        ${row('Purchaser email', escapeHtml(card.purchaser_email))}
        ${recipient ? row('Recipient', escapeHtml(recipient)) : ''}
        ${row('Card emailed to', escapeHtml(sentTo))}
        ${Number.isFinite(card.charged_cents) ? row('Charged', formatUsd(card.charged_cents)) : ''}
      </table>
      <p style="font-size:13px;color:#9BA5B4;">
        ${formatUsd(card.initial_cents)} of charter credit is now outstanding. It never expires and can be
        applied at checkout, so expect it back as a discount on a future booking rather than as new revenue.
      </p>
    `),
  });
}

export async function sendGiftCardReceipt(card) {
  await safeSend({
    from: FROM,
    to: card.purchaser_email,
    subject: `Gift card receipt — ${formatUsd(card.initial_cents)}`,
    html: wrap(`
      <h2 style="font-weight:300;">Thanks for your purchase!</h2>
      <p style="font-size:14px;">Your ${formatUsd(card.initial_cents)} gift card${card.recipient_email ? ` was sent to ${escapeHtml(card.recipient_email)}` : ` code is <strong style="letter-spacing:0.1em;">${escapeHtml(card.code)}</strong>`}.</p>
      <p style="font-size:14px;">Amount charged: <strong>${formatUsd(card.charged_cents)}</strong> (includes booking fee).</p>
    `),
  });
}
