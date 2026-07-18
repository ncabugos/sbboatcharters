'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from '../admin.module.css';

function usd(cents) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0 })}`;
}

export default function GiftCardsTable() {
  const [cards, setCards] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/gift-cards');
    if (res.ok) setCards((await res.json()).giftCards);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(card) {
    const action = card.status === 'disabled' ? 'enable' : 'disable';
    await fetch('/api/admin/gift-cards', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: card.id, action }),
    });
    load();
  }

  if (cards === null) return <p className={styles.empty}>Loading…</p>;
  if (cards.length === 0) return <p className={styles.empty}>No gift cards sold yet.</p>;

  const badge = {
    active: styles.badgeConfirmed,
    depleted: styles.badgeCancelled,
    disabled: styles.badgeCancelled,
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Code</th><th>Value</th><th>Balance</th><th>Purchaser</th>
            <th>Recipient</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {cards.map((c) => (
            <tr key={c.id}>
              <td style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{c.code}</td>
              <td>{usd(c.initial_cents)}</td>
              <td>{usd(c.balance_cents)}</td>
              <td>{c.purchaser_email}</td>
              <td>{c.recipient_email || '—'}</td>
              <td><span className={`${styles.badge} ${badge[c.status] || ''}`}>{c.status}</span></td>
              <td>
                {['active', 'disabled'].includes(c.status) && (
                  <button type="button" className={styles.smallBtn} onClick={() => toggle(c)}>
                    {c.status === 'disabled' ? 'Enable' : 'Disable'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
