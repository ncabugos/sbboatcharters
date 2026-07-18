'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './admin.module.css';

const PT = { timeZone: 'America/Los_Angeles' };

function fmt(dateIso) {
  return new Date(dateIso).toLocaleString('en-US', {
    ...PT, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function usd(cents) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0 })}`;
}

export default function BookingsTable() {
  const [bookings, setBookings] = useState(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/bookings');
    if (res.ok) {
      const data = await res.json();
      setBookings(data.bookings);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function cancel(id) {
    if (!window.confirm('Cancel this booking and free the time slot? Refunds are issued separately in Stripe.')) return;
    const res = await fetch('/api/admin/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: id, action: 'cancel' }),
    });
    const data = await res.json();
    setNote(res.ok ? data.note : data.error || 'Cancel failed');
    load();
  }

  if (bookings === null) return <p className={styles.empty}>Loading…</p>;
  if (bookings.length === 0) return <p className={styles.empty}>No upcoming bookings yet.</p>;

  const badge = {
    confirmed: styles.badgeConfirmed,
    pending: styles.badgePending,
    cancelled: styles.badgeCancelled,
  };

  return (
    <>
      {note && <p className={styles.success} style={{ marginBottom: '1rem' }}>{note}</p>}
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Departure</th><th>Trip</th><th>Guests</th><th>Customer</th>
              <th>Paid</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} style={b.status === 'cancelled' ? { opacity: 0.5 } : undefined}>
                <td style={{ whiteSpace: 'nowrap' }}>{fmt(b.trip_start)}</td>
                <td>
                  {b.tour_name}
                  <div style={{ color: '#6b7686', fontSize: '0.78rem' }}>{b.option_label}</div>
                  {b.notes && <div style={{ color: '#b96a2c', fontSize: '0.78rem' }}>{b.notes}</div>}
                </td>
                <td>{b.party_size}</td>
                <td>
                  {b.customer_name || '—'}
                  <div style={{ color: '#6b7686', fontSize: '0.78rem' }}>
                    {b.customer_phone || ''}{b.customer_phone && b.customer_email ? ' · ' : ''}{b.customer_email || ''}
                  </div>
                </td>
                <td>
                  {usd(b.charged_cents)}
                  {b.gift_card_cents > 0 && (
                    <div style={{ color: '#6b7686', fontSize: '0.78rem' }}>+{usd(b.gift_card_cents)} gift card</div>
                  )}
                </td>
                <td>
                  <span className={`${styles.badge} ${badge[b.status] || ''}`}>{b.status}</span>
                  {b.source === 'admin' && <span className={`${styles.badge} ${styles.badgeAdmin}`} style={{ marginLeft: 4 }}>manual</span>}
                </td>
                <td>
                  {['pending', 'confirmed'].includes(b.status) && (
                    <button type="button" className={styles.smallBtn} onClick={() => cancel(b.id)}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
