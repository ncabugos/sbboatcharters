'use client';

import { useState } from 'react';
import styles from '../admin.module.css';

export default function ManualBookingForm({ tours }) {
  const [form, setForm] = useState({
    tourId: tours[0]?.id || '', pricingOptionId: tours[0]?.options?.[0]?.id || '',
    date: '', time: '', partySize: 2, name: '', email: '', phone: '', notes: '',
    sendEmails: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const tour = tours.find((t) => t.id === Number(form.tourId)) || tours[0];

  function set(patch) {
    setForm((f) => ({ ...f, ...patch }));
    setSuccess('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create booking');
      setSuccess('Booking created — the slot is now blocked on the calendar.');
      setForm((f) => ({ ...f, date: '', time: '', name: '', email: '', phone: '', notes: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.formCard} onSubmit={submit} style={{ maxWidth: '40rem' }}>
      <p style={{ fontSize: '0.85rem', color: '#6b7686', margin: 0 }}>
        For bookings taken over the phone. Payment is handled outside the website
        (cash, invoice, or a manual charge in your Stripe dashboard) — this just
        blocks the time slot and records the customer.
      </p>
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label className={styles.label}>Trip</label>
          <select className={styles.input} value={form.tourId}
            onChange={(e) => {
              const t = tours.find((x) => x.id === Number(e.target.value));
              set({ tourId: e.target.value, pricingOptionId: t?.options?.[0]?.id || '' });
            }}>
            {tours.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className={styles.label}>Charter length</label>
          <select className={styles.input} value={form.pricingOptionId}
            onChange={(e) => set({ pricingOptionId: e.target.value })}>
            {(tour?.options || []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={styles.label}>Date</label>
          <input className={styles.input} type="date" required value={form.date}
            onChange={(e) => set({ date: e.target.value })} />
        </div>
        <div>
          <label className={styles.label}>Start time (Pacific)</label>
          <input className={styles.input} type="time" required value={form.time}
            onChange={(e) => set({ time: e.target.value })} />
        </div>
        <div>
          <label className={styles.label}>Guests</label>
          <input className={styles.input} type="number" min="1" max={tour?.max_party || 6}
            value={form.partySize} onChange={(e) => set({ partySize: Number(e.target.value) })} />
        </div>
        <div>
          <label className={styles.label}>Customer name</label>
          <input className={styles.input} value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div>
          <label className={styles.label}>Email (for confirmation)</label>
          <input className={styles.input} type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
        </div>
        <div>
          <label className={styles.label}>Phone</label>
          <input className={styles.input} type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
        </div>
      </div>
      <div>
        <label className={styles.label}>Notes</label>
        <input className={styles.input} placeholder="Paid cash / invoice sent / special requests…"
          value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
      </div>
      <label style={{ fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input type="checkbox" checked={form.sendEmails}
          onChange={(e) => set({ sendEmails: e.target.checked })} />
        Send confirmation emails
      </label>
      <button type="submit" className="btn btn--primary" disabled={busy || !form.date || !form.time}>
        {busy ? 'Saving…' : 'Create booking'}
      </button>
    </form>
  );
}
