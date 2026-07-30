// Fee model:
//   advertised price = base + 6% booking fee ("Prices include fees", CA SB 478)
// Example (coastal 2-hr): $500 base → $530 advertised → $530 charged.
// The 6% fee is the platform's, collected as Stripe application_fee_amount.
//
// SALES TAX IS DISABLED (2026-07-30, at the operator's direction). The
// advertised price is now the full amount due — nothing is added at checkout.
// The plumbing is deliberately left intact: set TAX_RATE back to 0.0775 and the
// tax line reappears everywhere, since the summary, confirmation page and
// emails all render it only when tax is non-zero. Bookings taken while tax was
// being charged keep their recorded tax_cents, so historical totals still add up.
export const FEE_NUM = 6;
export const FEE_DEN = 106;
export const TAX_RATE = 0;

export function displayFromBase(baseCents) {
  // Round up to a whole dollar so advertised prices stay clean.
  return Math.ceil((baseCents * (100 + FEE_NUM)) / 100 / 100) * 100;
}

export function taxFromBase(baseCents) {
  return Math.round(baseCents * TAX_RATE);
}

// Platform fee portion of an amount actually charged through Stripe.
export function feePortion(chargedCents) {
  return Math.round((chargedCents * FEE_NUM) / FEE_DEN);
}

export function formatUsd(cents) {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toLocaleString('en-US')}`
    : `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
