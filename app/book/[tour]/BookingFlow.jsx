'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements,
} from '@stripe/react-stripe-js';
import { taxFromBase } from '@/lib/pricing';
import { gaEvent, usd } from '@/lib/analytics';
import { seasonLabel } from '@/lib/season';
import styles from './bookingFlow.module.css';

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatUsd(cents) {
  const d = cents / 100;
  return d % 1 === 0
    ? `$${d.toLocaleString('en-US')}`
    : `$${d.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function monthLabel(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

function addMonths(monthStr, delta) {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function currentMonthPt() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit',
  }).format(new Date());
  return parts.replace('/', '-').slice(0, 7);
}

// A seasonal tour opens on its first bookable month instead of an empty one.
function initialMonth(season) {
  const current = currentMonthPt();
  const opens = season?.start?.slice(0, 7);
  return opens && opens > current ? opens : current;
}

function to12h(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

function prettyDate(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
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
    fontSizeBase: '15px',
  },
};

const FONTS = [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap' }];

export default function BookingFlow({ tour, options, stripeReady }) {
  const router = useRouter();
  const startedAt = useRef(Date.now());

  const [month, setMonth] = useState(() => initialMonth(tour.season));
  const [availability, setAvailability] = useState({}); // monthStr -> days map
  const [loadingMonth, setLoadingMonth] = useState(true);
  const [date, setDate] = useState(null);
  const [optionId, setOptionId] = useState(options[0]?.id ?? null);
  const [time, setTime] = useState(null);
  const [party, setParty] = useState(2);
  const [contact, setContact] = useState({ name: '', email: '', phone: '', notes: '' });
  const [showGift, setShowGift] = useState(false);
  const [giftInput, setGiftInput] = useState('');
  const [gift, setGift] = useState(null); // { code, balanceCents }
  const [giftError, setGiftError] = useState('');
  const [checkout, setCheckout] = useState(null); // { clientSecret, bookingId, token, amountCents }
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const days = availability[month];
  const option = options.find((o) => o.id === optionId) || options[0];

  // One shape reused by every funnel event, so GA4 can tie view_item →
  // begin_checkout → purchase back to the same tour.
  const gaItem = useMemo(() => ({
    item_id: tour.slug,
    item_name: tour.name,
    item_category: 'charter',
    item_variant: option?.label,
    price: option ? usd(option.displayCents) : undefined,
    quantity: 1,
  }), [tour.slug, tour.name, option]);

  // Fires once per tour, not once per render. `options` arrives as a fresh array on
  // each render of the client transition, so it can't be used as a dependency.
  const viewedTour = useRef(null);
  useEffect(() => {
    if (viewedTour.current === tour.slug) return;
    viewedTour.current = tour.slug;
    gaEvent('view_item', {
      currency: 'USD',
      value: usd(options[0]?.displayCents || 0),
      items: [{ item_id: tour.slug, item_name: tour.name, item_category: 'charter' }],
    });
  }, [tour.slug, tour.name, options]);

  const fetchMonth = useCallback(async (m) => {
    setLoadingMonth(true);
    try {
      const res = await fetch(`/api/availability?tour=${encodeURIComponent(tour.slug)}&month=${m}`);
      const data = await res.json();
      setAvailability((prev) => ({ ...prev, [m]: data.days || {} }));
    } catch {
      setError('Could not load availability. Please refresh.');
    } finally {
      setLoadingMonth(false);
    }
  }, [tour.slug]);

  useEffect(() => {
    if (!availability[month]) fetchMonth(month);
    else setLoadingMonth(false);
  }, [month, availability, fetchMonth]);

  // Times for the chosen day + option.
  const dayInfo = date && days ? days[date] : null;
  const times = dayInfo && option ? dayInfo.options?.[option.id] || [] : [];
  const callToBookOnly = dayInfo && dayInfo.callToBook && times.length === 0;

  // Advertised all-in price (base + 6% fee). Tax is currently disabled, so
  // taxCents is 0 and the tax/subtotal rows drop out of the summary.
  const subtotalCents = option ? option.displayCents : 0;
  const taxCents = option ? taxFromBase(option.baseCents) : 0;
  const feeCents = option ? option.displayCents - option.baseCents : 0;
  const totalCents = subtotalCents + taxCents;
  const giftApplied = gift ? Math.min(gift.balanceCents, totalCents) : 0;
  const dueCents = totalCents - giftApplied;

  const contactValid =
    contact.name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim());
  const readyForPayment = date && option && time && contactValid;

  // Invalidate any created hold when the selection changes.
  const invalidateCheckout = () => setCheckout(null);

  async function applyGiftCard() {
    setGiftError('');
    try {
      const res = await fetch('/api/gift-cards/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: giftInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Validation failed');
      if (!data.valid) {
        setGiftError('That code is invalid or has no remaining balance.');
        return;
      }
      setGift({ code: giftInput, balanceCents: data.balanceCents });
      invalidateCheckout();
    } catch (err) {
      setGiftError(err.message || 'Could not validate the code.');
    }
  }

  async function startCheckout() {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tour: tour.slug,
          pricingOptionId: option.id,
          date,
          time,
          partySize: party,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          notes: contact.notes,
          giftCardCode: gift?.code || undefined,
          replaceBookingId: checkout?.bookingId,
          elapsedMs: Date.now() - startedAt.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          // Slot got taken — refresh availability so the picker is honest.
          setTime(null);
          setAvailability((prev) => ({ ...prev, [month]: undefined }));
          fetchMonth(month);
        }
        throw new Error(data.error || 'Could not start checkout');
      }
      if (data.confirmed) {
        gaEvent('begin_checkout', {
          currency: 'USD',
          value: 0,
          coupon: 'gift_card',
          items: [{ ...gaItem, quantity: party }],
        });
        router.push(`/book/confirmation/${data.token}`);
        return;
      }
      setCheckout(data);
      gaEvent('begin_checkout', {
        currency: 'USD',
        value: usd(data.amountCents ?? dueCents),
        coupon: gift ? 'gift_card' : undefined,
        items: [{ ...gaItem, quantity: party }],
      });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.panel}>
        {/* Step 1 — date */}
        <section>
          <h2 className={styles.stepTitle}><span className={styles.stepNumber}>1</span> Choose a date</h2>
          {tour.season && (
            <p className={styles.seasonNote}>
              Season: {seasonLabel(tour.season.start, tour.season.end)}. Dates outside the season can&apos;t be booked.
            </p>
          )}
          <Calendar
            month={month}
            days={days}
            loading={loadingMonth}
            selected={date}
            optionId={option?.id}
            onMonth={(m) => setMonth(m)}
            onSelect={(d) => {
              setDate(d); setTime(null); invalidateCheckout();
              gaEvent('select_date', { item_id: tour.slug, trip_date: d });
            }}
          />
        </section>

        {/* Step 2 — duration */}
        {date && options.length > 1 && (
          <section>
            <h2 className={styles.stepTitle}><span className={styles.stepNumber}>2</span> Choose your charter</h2>
            <div className={styles.chipRow}>
              {options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`${styles.chip} ${o.id === option?.id ? styles.chipSelected : ''}`}
                  onClick={() => {
                    setOptionId(o.id); setTime(null); invalidateCheckout();
                    gaEvent('select_item', {
                      item_list_name: 'charter_length',
                      items: [{ item_id: tour.slug, item_name: tour.name, item_variant: o.label, price: usd(o.displayCents) }],
                    });
                  }}
                >
                  {o.label}
                  <span className={styles.chipPrice}>{formatUsd(o.displayCents)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step 3 — time */}
        {date && option && (
          <section>
            <h2 className={styles.stepTitle}>
              <span className={styles.stepNumber}>{options.length > 1 ? 3 : 2}</span> Choose a start time — {prettyDate(date)}
            </h2>
            {callToBookOnly || (dayInfo && times.length === 0) ? (
              <div className={styles.callToBook}>
                {dayInfo?.callToBook
                  ? tour.minNoticeHours >= 8760
                    ? <>Custom adventures are planned together — call <a href={`tel:${tour.callToBookPhone.replace(/[^0-9+]/g, '')}`}>{tour.callToBookPhone}</a> and we&apos;ll build your perfect day on the water.</>
                    : <>This date is inside our short-notice window. Call <a href={`tel:${tour.callToBookPhone.replace(/[^0-9+]/g, '')}`}>{tour.callToBookPhone}</a> to book it.</>
                  : <>No start times fit this charter length on this date — try another date or a shorter charter.</>}
              </div>
            ) : (
              <div className={styles.chipRow}>
                {times.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`${styles.chip} ${t === time ? styles.chipSelected : ''}`}
                    onClick={() => {
                      setTime(t); invalidateCheckout();
                      gaEvent('select_time', { item_id: tour.slug, trip_date: date, trip_time: t });
                    }}
                  >
                    {to12h(t)}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Step 4 — party + contact */}
        {date && option && time && (
          <section>
            <h2 className={styles.stepTitle}>
              <span className={styles.stepNumber}>{options.length > 1 ? 4 : 3}</span> Your details
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.9rem' }}>Guests (max {tour.maxParty})</span>
              <div className={styles.stepper}>
                <button type="button" onClick={() => setParty((p) => Math.max(1, p - 1))} disabled={party <= 1} aria-label="Fewer guests">−</button>
                <span>{party}</span>
                <button type="button" onClick={() => setParty((p) => Math.min(tour.maxParty, p + 1))} disabled={party >= tour.maxParty} aria-label="More guests">+</button>
              </div>
            </div>
            <div className={styles.fieldGrid}>
              {/* honeypot */}
              <input type="text" name="company" tabIndex={-1} autoComplete="off" value="" onChange={() => {}} style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true" />
              <input
                className={`${styles.input} ${styles.full}`} placeholder="Full name *" autoComplete="name"
                value={contact.name} onChange={(e) => { setContact({ ...contact, name: e.target.value }); invalidateCheckout(); }}
              />
              <input
                className={styles.input} type="email" placeholder="Email *" autoComplete="email"
                value={contact.email} onChange={(e) => { setContact({ ...contact, email: e.target.value }); invalidateCheckout(); }}
              />
              <input
                className={styles.input} type="tel" placeholder="Phone" autoComplete="tel"
                value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              />
              <textarea
                className={`${styles.input} ${styles.full}`} rows={2}
                placeholder="Anything we should know? (celebrations, mobility, fishing goals...)"
                value={contact.notes} onChange={(e) => setContact({ ...contact, notes: e.target.value })}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              {!showGift && !gift && (
                <button type="button" className={styles.giftLink} onClick={() => setShowGift(true)}>
                  Have a gift card?
                </button>
              )}
              {showGift && !gift && (
                <div>
                  <div className={styles.giftRow}>
                    <input
                      className={styles.input} placeholder="SBBC-XXXX-XXXX"
                      value={giftInput} onChange={(e) => setGiftInput(e.target.value)}
                      style={{ maxWidth: '15rem', textTransform: 'uppercase' }}
                    />
                    <button type="button" className="btn btn--outline-dark" onClick={applyGiftCard} disabled={!giftInput.trim()}>
                      Apply
                    </button>
                  </div>
                  {giftError && <p style={{ color: '#96281b', fontSize: '0.85rem', marginTop: '0.5rem' }}>{giftError}</p>}
                </div>
              )}
              {gift && (
                <div className={styles.giftApplied}>
                  <span>Gift card applied: −{formatUsd(giftApplied)}</span>
                  <button type="button" className={styles.giftLink} onClick={() => { setGift(null); setGiftInput(''); invalidateCheckout(); }}>
                    Remove
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Step 5 — payment */}
        {readyForPayment && (
          <section>
            <h2 className={styles.stepTitle}>
              <span className={styles.stepNumber}>{options.length > 1 ? 5 : 4}</span> Payment
            </h2>
            {error && <div className={styles.error} style={{ marginBottom: '1rem' }}>{error}</div>}

            {!stripeReady && dueCents > 0 ? (
              <div className={styles.callToBook}>
                Online payment is being set up. Call{' '}
                <a href={`tel:${tour.callToBookPhone.replace(/[^0-9+]/g, '')}`}>{tour.callToBookPhone}</a> to book this trip.
              </div>
            ) : !checkout ? (
              <button
                type="button"
                className="btn btn--primary btn--large"
                onClick={startCheckout}
                disabled={submitting}
                style={{ width: '100%' }}
              >
                {submitting
                  ? 'One moment…'
                  : dueCents === 0
                    ? `Confirm booking — covered by gift card`
                    : `Continue to payment — ${formatUsd(dueCents)}`}
              </button>
            ) : (
              <Elements
                stripe={getStripePromise()}
                options={{ clientSecret: checkout.clientSecret, appearance: APPEARANCE, fonts: FONTS }}
              >
                <PaymentStep checkout={checkout} onError={setError} gaItem={gaItem} party={party} />
              </Elements>
            )}
          </section>
        )}
      </div>

      {/* Summary sidebar */}
      <aside className={styles.summary}>
        {tour.imageUrl && <img src={tour.imageUrl} alt="" className={styles.summaryImage} />}
        <h3 className={styles.summaryTitle}>{tour.name}</h3>
        <div className={styles.summaryRow}><span>Date</span><strong>{date ? prettyDate(date) : '—'}</strong></div>
        <div className={styles.summaryRow}><span>Time</span><strong>{time ? to12h(time) : '—'}</strong></div>
        <div className={styles.summaryRow}><span>Guests</span><strong>{party}</strong></div>
        <div className={styles.summaryRow}><span>Meeting point</span><strong style={{ maxWidth: '14rem' }}>{tour.meetingPoint}</strong></div>
        {/* The 6% fee stays inside the advertised price (CA SB 478) — this only
            itemizes what that price is made of. Base + fee = the same total. */}
        {option && (
          <>
            <div className={styles.summaryRow}>
              <span>{option.label}</span><strong>{formatUsd(option.baseCents)}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Booking fee</span><strong>{formatUsd(feeCents)}</strong>
            </div>
          </>
        )}
        {/* Subtotal only earns its place when something is added or deducted
            below it; otherwise it just repeats the total. */}
        {option && (taxCents > 0 || gift) && (
          <div className={styles.summaryRow}><span>Subtotal</span><strong>{formatUsd(subtotalCents)}</strong></div>
        )}
        {taxCents > 0 && (
          <div className={styles.summaryRow}><span>Taxes</span><strong>{formatUsd(taxCents)}</strong></div>
        )}
        {gift && (
          <div className={styles.summaryRow}><span>Gift card</span><strong>−{formatUsd(giftApplied)}</strong></div>
        )}
        <div className={styles.summaryTotal}>
          <span>Total</span>
          <strong>{option ? formatUsd(dueCents) : '—'}</strong>
        </div>
        <div className={styles.summaryFee}>
          {option
            ? 'The total above is the full amount due — nothing further is added at checkout.'
            : 'Prices include all booking fees.'}
        </div>
        {tour.policyText && <p className={styles.policy}>{tour.policyText}</p>}
      </aside>
    </div>
  );
}

function PaymentStep({ checkout, onError, gaItem, party }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const returnUrl = useMemo(
    () => `${window.location.origin}/book/confirmation/${checkout.token}`,
    [checkout.token]
  );

  async function confirm() {
    if (!stripe || !elements) return;
    setPaying(true);
    onError('');
    gaEvent('add_payment_info', {
      currency: 'USD',
      value: usd(checkout.amountCents),
      items: gaItem ? [{ ...gaItem, quantity: party }] : undefined,
    });
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });
    // Only reached on immediate failure (declined card etc.) — success redirects.
    if (error) {
      // Worth measuring: a spike here means cards are being declined, not that
      // people changed their minds.
      gaEvent('payment_failed', { currency: 'USD', value: usd(checkout.amountCents) });
      onError(error.message || 'Payment failed. Please try another card.');
    }
    setPaying(false);
  }

  return (
    <div className={styles.payBox}>
      <ExpressCheckoutElement onConfirm={confirm} options={{ buttonHeight: 48 }} />
      {/* Bank (ACH) first: lowest fees for us and Stripe shows a cash-back
          offer on it, so it is the best-value option for the guest too. */}
      <PaymentElement options={{ layout: 'tabs', paymentMethodOrder: ['us_bank_account', 'card'] }} />
      <button
        type="button"
        className="btn btn--primary btn--large"
        onClick={confirm}
        disabled={!stripe || paying}
        style={{ width: '100%' }}
      >
        {paying ? <><span className={styles.spinner} />Processing…</> : `Pay ${formatUsd(checkout.amountCents)}`}
      </button>
      <p className={styles.holdNote}>
        Your time slot is held for {checkout.holdMinutes} minutes. Payments are processed securely by Stripe.
      </p>
    </div>
  );
}

function Calendar({ month, days, loading, selected, optionId, onMonth, onSelect }) {
  const [y, m] = month.split('-').map(Number);
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const numDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const isCurrentMonth = month === currentMonthPt();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= numDays; d++) cells.push(d);

  return (
    <div>
      <div className={styles.calHeader}>
        <button type="button" className={styles.calNav} onClick={() => onMonth(addMonths(month, -1))} disabled={isCurrentMonth} aria-label="Previous month">‹</button>
        <span className={styles.calMonth}>{monthLabel(month)}</span>
        <button type="button" className={styles.calNav} onClick={() => onMonth(addMonths(month, 1))} aria-label="Next month">›</button>
      </div>
      <div className={styles.calGrid}>
        {DOW.map((d) => <div key={d} className={styles.calDow}>{d}</div>)}
        {cells.map((d, i) => {
          if (d === null) return <div key={`x${i}`} />;
          const dateStr = `${month}-${String(d).padStart(2, '0')}`;
          const info = days?.[dateStr];
          const hasSlots = info && Object.values(info.options || {}).some((arr) => arr.length > 0);
          const callOnly = info && !hasSlots && info.callToBook;
          const cls = [
            styles.calDay,
            hasSlots ? styles.calDayAvailable : '',
            callOnly ? styles.calDayCall : '',
            dateStr === selected ? styles.calDaySelected : '',
          ].join(' ');
          return (
            <button
              key={dateStr}
              type="button"
              className={cls}
              disabled={!info}
              onClick={() => onSelect(dateStr)}
              aria-label={dateStr}
            >
              {d}
            </button>
          );
        })}
      </div>
      {loading && <p className={styles.calNote}>Checking availability…</p>}
      {!loading && days && Object.keys(days).length === 0 && (
        <p className={styles.calNote}>No dates available this month.</p>
      )}
    </div>
  );
}
