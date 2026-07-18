'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from '../admin.module.css';

function fmt(dateIso) {
  return new Date(dateIso).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function BlackoutsManager() {
  const [blackouts, setBlackouts] = useState(null);
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/blackouts');
    if (res.ok) setBlackouts((await res.json()).blackouts);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function add(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/admin/blackouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: form.startDate,
          endDate: form.endDate || form.startDate,
          reason: form.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add');
      setForm({ startDate: '', endDate: '', reason: '' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    await fetch(`/api/admin/blackouts?id=${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
      <form className={styles.formCard} onSubmit={add}>
        <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Block days off
        </strong>
        {error && <div className={styles.error}>{error}</div>}
        <div>
          <label className={styles.label} htmlFor="bo-start">First day blocked</label>
          <input id="bo-start" className={styles.input} type="date" required
            value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div>
          <label className={styles.label} htmlFor="bo-end">Last day blocked (optional)</label>
          <input id="bo-end" className={styles.input} type="date"
            value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
        <div>
          <label className={styles.label} htmlFor="bo-reason">Reason (only you see this)</label>
          <input id="bo-reason" className={styles.input} placeholder="Maintenance, vacation, weather…"
            value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </div>
        <button type="submit" className="btn btn--primary" disabled={busy || !form.startDate}>
          {busy ? 'Adding…' : 'Block dates'}
        </button>
      </form>

      <div>
        {blackouts === null ? (
          <p className={styles.empty}>Loading…</p>
        ) : blackouts.length === 0 ? (
          <p className={styles.empty}>No upcoming blackout dates. The whole calendar is open.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr><th>From</th><th>Until</th><th>Reason</th><th></th></tr>
            </thead>
            <tbody>
              {blackouts.map((b) => (
                <tr key={b.id}>
                  <td>{fmt(b.starts_at)}</td>
                  <td>{fmt(b.ends_at)}</td>
                  <td>{b.reason || '—'}</td>
                  <td><button type="button" className={styles.smallBtn} onClick={() => remove(b.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
