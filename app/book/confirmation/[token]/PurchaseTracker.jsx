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
 */
export default function PurchaseTracker({ bookingId, tourSlug, tourName, optionLabel, partySize, chargedCents, giftCardCents }) {
  useEffect(() => {
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
