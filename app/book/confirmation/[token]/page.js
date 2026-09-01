import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadBookingByToken } from '@/lib/bookings';
import { formatUsd } from '@/lib/pricing';
import { formatPt } from '@/lib/availability';
import PendingRefresher from './PendingRefresher';
import PurchaseTracker from './PurchaseTracker';
import styles from '../../book.module.css';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Booking Confirmation', robots: { index: false } };

export default async function ConfirmationPage({ params }) {
  const { token } = await params;
  const booking = await loadBookingByToken(token);
  if (!booking) notFound();

  const when = formatPt(new Date(booking.trip_start), {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

  const isConfirmed = booking.status === 'confirmed';
  const isPending = booking.status === 'pending';

  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          {isConfirmed ? (
            <>
              <span className="section-label" style={{ color: '#4caf7d' }}>Confirmed</span>
              <h1 className={styles.heroTitle}>You&apos;re on the water!</h1>
              <p className={styles.heroSubtitle}>
                A confirmation email is on its way to {booking.customer_email}.
              </p>
              <PurchaseTracker
                bookingId={booking.id}
                tourSlug={booking.tour_slug}
                tourName={booking.tour_name}
                optionLabel={booking.option_label}
                partySize={booking.party_size}
                chargedCents={booking.charged_cents}
                giftCardCents={booking.gift_card_cents || 0}
              />
            </>
          ) : isPending ? (
            <>
              <span className="section-label" style={{ color: 'var(--color-accent)' }}>Processing</span>
              <h1 className={styles.heroTitle}>Finalizing your booking…</h1>
              <p className={styles.heroSubtitle}>
                Your payment is being processed. This page will update automatically.
              </p>
              <PendingRefresher />
            </>
          ) : (
            <>
              <span className="section-label" style={{ color: 'var(--color-silver)' }}>
                {booking.status === 'cancelled' ? 'Cancelled' : 'Expired'}
              </span>
              <h1 className={styles.heroTitle}>This booking is no longer active</h1>
              <p className={styles.heroSubtitle}>
                If you believe this is a mistake, call {booking.call_to_book_phone}. Any completed
                payment for a cancelled booking is refunded.
              </p>
            </>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container container--narrow">
          <div className={styles.card} style={{ padding: '2rem' }}>
            <h2 className={styles.cardTitle} style={{ marginBottom: '1rem' }}>Trip details</h2>
            <table style={{ width: '100%', fontSize: '0.95rem', borderCollapse: 'collapse' }}>
              <tbody>
                <Row label="Trip" value={`${booking.tour_name} — ${booking.option_label}`} />
                <Row label="Departure" value={`${when} (Pacific)`} />
                <Row label="Guests" value={booking.party_size} />
                <Row label="Meeting point" value={booking.meeting_point} />
                {booking.tax_cents > 0 && <Row label="Taxes" value={formatUsd(booking.tax_cents)} />}
                {booking.gift_card_cents > 0 && <Row label="Gift card applied" value={`−${formatUsd(booking.gift_card_cents)}`} />}
                <Row label={isConfirmed ? 'Paid' : 'Total'} value={formatUsd(booking.charged_cents)} bold />
              </tbody>
            </table>
            <p style={{ fontSize: '0.85rem', color: '#6b7686', marginTop: '1.25rem' }}>
              Meet Captain Garrick at Marina 3 Gate 15 minutes before departure.{' '}
              {booking.policy_text}
            </p>
            <p style={{ marginTop: '1.5rem' }}>
              <Link href="/book" className="btn btn--outline-dark">Book another adventure</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function Row({ label, value, bold }) {
  return (
    <tr style={{ borderBottom: '1px solid #eee' }}>
      <td style={{ padding: '0.6rem 0', color: '#6b7686' }}>{label}</td>
      <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: bold ? 600 : 400 }}>{value}</td>
    </tr>
  );
}
