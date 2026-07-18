import { Resend } from 'resend';
import { formatUsd } from './pricing';
import { formatPt } from './availability';

const FROM = 'SB Boat Charters <info@sbboatcharters.com>';
// Overridable so dev/preview environments don't email the real captain.
const CAPTAIN_EMAIL = process.env.BOOKING_NOTIFY_EMAIL || 'garrick.gch@gmail.com';

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
async function safeSend(payload) {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set; skipped:', payload.subject);
    return;
  }
  try {
    const { error } = await resend.emails.send(payload);
    if (error) console.error('[email] send failed:', payload.subject, error);
  } catch (err) {
    console.error('[email] send threw:', payload.subject, err);
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
    to: CAPTAIN_EMAIL,
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

export async function sendBookingApology(b) {
  await safeSend({
    from: FROM,
    to: b.customer_email,
    subject: 'About your SB Boat Charters booking',
    html: wrap(`
      <h2 style="font-weight:300;">We're sorry — that time was just taken</h2>
      <p style="font-size:14px;">Your payment session outlasted our booking hold and another guest confirmed the same time slot moments before your payment completed. <strong>Your payment has been fully refunded</strong> — you'll see it back on your card within a few business days.</p>
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
