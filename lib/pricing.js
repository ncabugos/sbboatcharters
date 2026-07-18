// Fee model: 6% customer-facing booking fee, advertised prices are all-in
// (CA SB 478 — "Prices include all fees"). fee = display - base for a full
// booking; when a gift card covers part of the total, the platform fee on the
// Stripe charge is proportional: round(charged * FEE_NUM / FEE_DEN).
export const FEE_NUM = 6;
export const FEE_DEN = 106;

export function displayFromBase(baseCents) {
  // Round up to a whole dollar so advertised prices stay clean.
  return Math.ceil((baseCents * (100 + FEE_NUM)) / 100 / 100) * 100;
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
