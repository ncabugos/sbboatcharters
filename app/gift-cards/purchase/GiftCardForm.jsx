'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import styles from '../../book/[tour]/bookingFlow.module.css';

const PRESETS = [10000, 25000, 50000, 100000];

function formatUsd(cents) {
  return `$${(cents / 100).toLocaleString('en-US')}`;
}

// All-in charge (value + 6% fee, rounded up to whole dollars) — mirrors lib/pricing.js.
function chargeFor(valueCents) {
  return Math.ceil((valueCents * 106) / 100 / 100) * 100;
}

let stripePromise = null;
function getStripePromise() {
  if (!stripePromise && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, {
      stripeAccount: process.env.NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT_ID || undefined,
    });
  }
  return stripePromise;
}

const APPEARANCE = {
  variables: {
    colorPrimary: '#E8481E',
    colorText: '#141618',
    borderRadius: '0px',
    fontFamily: 'Montserrat, Helvetica, Arial, sans-serif',
  },
};

export default function GiftCardForm({ stripeReady }) {
  const searchParams = useSearchParams();
  const complete = searchParams.get('redirect_status') === 'succeeded';

  const [amount, setAmount] = useState(25000);
  const [custom, setCustom] = useState('');
  const [form, setForm] = useState({
    purchaserName: '', purchaserEmail: '', recipientName: '', recipientEmail: '', message: '',
  });
  const [checkout, setCheckout] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const valueCents = custom ? Math.round(Number(custom) || 0) * 100 : amount;
  const validAmount = valueCents >= 5000 && valueCents <= 200000;
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.purchaserEmail.trim());

  if (complete) {
    return (
      <div className={styles.panel} style={{ textAlign: 'center' }}>
        <div>
          <h2 style={{ fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Gift card on its way! 🎉
          </h2>
          <p style={{ color: '#6b7686' }}>
            The gift card email will arrive within a couple of minutes, along with your receipt.
          </p>
        </div>
      </div>
    );
  }

  async function startPurchase() {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/gift-cards/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: valueCents, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start purchase');
      setCheckout(data);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.panel}>
      <section>
        <h2 className={styles.stepTitle}><span className={styles.stepNumber}>1</span> Amount</h2>
        <div className={styles.chipRow}>
          {PRESETS.map((cents) => (
            <button
              key={cents}
              type="button"
              className={`${styles.chip} ${!custom && amount === cents ? styles.chipSelected : ''}`}
              onClick={() => { setAmount(cents); setCustom(''); setCheckout(null); }}
            >
              {formatUsd(cents)}
            </button>
          ))}
          <input
            className={`${styles.input} ${styles.amountInput}`}
            type="number" min="50" max="2000" step="1"
            placeholder="Custom ($50–2,000)"
            value={custom}
            onChange={(e) => { setCustom(e.target.value); setCheckout(null); }}
          />
        </div>
        {validAmount && (
          <p style={{ fontSize: '0.85rem', color: '#6b7686', marginTop: '0.75rem' }}>
            {formatUsd(valueCents)} gift card — you pay {formatUsd(chargeFor(valueCents))} (includes booking fee).
          </p>
        )}
      </section>

      <section>
        <h2 className={styles.stepTitle}><span className={styles.stepNumber}>2</span> Delivery</h2>
        <div className={styles.fieldGrid}>
          <input className={styles.input} placeholder="Your name *" autoComplete="name"
            value={form.purchaserName} onChange={(e) => { setForm({ ...form, purchaserName: e.target.value }); setCheckout(null); }} />
          <input className={styles.input} type="email" placeholder="Your email *" autoComplete="email"
            value={form.purchaserEmail} onChange={(e) => { setForm({ ...form, purchaserEmail: e.target.value }); setCheckout(null); }} />
          <input className={styles.input} placeholder="Recipient name (optional)"
            value={form.recipientName} onChange={(e) => { setForm({ ...form, recipientName: e.target.value }); setCheckout(null); }} />
          <input className={styles.input} type="email" placeholder="Recipient email (optional)"
            value={form.recipientEmail} onChange={(e) => { setForm({ ...form, recipientEmail: e.target.value }); setCheckout(null); }} />
          <textarea className={`${styles.input} ${styles.full}`} rows={2} placeholder="Gift message (optional)"
            value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        <p className={styles.fieldHint}>
          Leave the recipient fields blank and we&apos;ll email the gift card to you.
        </p>
      </section>

      <section>
        <h2 className={styles.stepTitle}><span className={styles.stepNumber}>3</span> Payment</h2>
        {error && <div className={styles.error} style={{ marginBottom: '1rem' }}>{error}</div>}
        {!stripeReady ? (
          <div className={styles.callToBook}>
            Online payment is being set up. Call <a href="tel:+18057222282">(805) 722-2282</a> to order a gift card.
          </div>
        ) : !checkout ? (
          <button
            type="button"
            className="btn btn--primary btn--large"
            style={{ width: '100%' }}
            disabled={!validAmount || !validEmail || submitting}
            onClick={startPurchase}
          >
            {submitting ? 'One moment…' : validAmount ? `Continue — ${formatUsd(chargeFor(valueCents))}` : 'Enter an amount ($50–$2,000)'}
          </button>
        ) : (
          <Elements stripe={getStripePromise()} options={{ clientSecret: checkout.clientSecret, appearance: APPEARANCE }}>
            <GiftPaymentStep chargeCents={checkout.chargeCents} onError={setError} />
          </Elements>
        )}
      </section>
    </div>
  );
}

function GiftPaymentStep({ chargeCents, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const returnUrl = useMemo(() => `${window.location.origin}/gift-cards/purchase`, []);

  async function confirm() {
    if (!stripe || !elements) return;
    setPaying(true);
    onError('');
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });
    if (error) onError(error.message || 'Payment failed. Please try another card.');
    setPaying(false);
  }

  return (
    <div className={styles.payBox}>
      <PaymentElement options={{ layout: 'tabs' }} />
      <button type="button" className="btn btn--primary btn--large" style={{ width: '100%' }} onClick={confirm} disabled={!stripe || paying}>
        {paying ? 'Processing…' : `Pay ${formatUsd(chargeCents)}`}
      </button>
    </div>
  );
}
