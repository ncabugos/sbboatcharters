'use client';

import { useEffect } from 'react';
import { gaEventOnce, usd } from '@/lib/analytics';

/**
 * Reports the completed booking to GA4 as a `purchase`.
 *
 * The confirmation page is reachable more than once for the same booking — Stripe
 * redirects here, PendingRefresher reloads it while the webhook lands, and the URL
 * is a stable link the customer can revisit. `gaEventOnce` keys on the booking id
 * so revenue is counted a single time per tab.
 *
 * Per tab is not enough on its own: the "View your booking" link in the
 * confirmation email opens a fresh tab (often on another device), and GA4 was
 * counting those visits as new purchases. So the event fires only when the URL
 * carries `from=checkout`, which BookingFlow adds to both ways out of checkout
 * (Stripe's return_url and the fully gift-carded redirect). The email link never
 * has it.
 */
export default function PurchaseTracker({ bookingId, tourSlug, tourName, optionLabel, partySize, chargedCents, giftCardCents }) {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('from') !== 'checkout') return;
    gaEventOnce(`purchase:${bookingId}`, 'purchase', {
      transaction_id: String(bookingId),
      currency: 'USD',
      value: usd(chargedCents),
      coupon: giftCardCents > 0 ? 'gift_card' : undefined,
      items: [{
        item_id: tourSlug,
        item_name: tourName,
        item_category: 'charter',
        item_variant: optionLabel,
        price: usd(chargedCents),
        quantity: partySize,
      }],
    });
  }, [bookingId, tourSlug, tourName, optionLabel, partySize, chargedCents, giftCardCents]);

  return null;
}
