// Fee model — mirrors FareHarbor's checkout exactly:
//   advertised price = base + 6% booking fee ("Prices include fees", CA SB 478)
//   + sales tax (7.75% of the BASE, not the fee) added at checkout.
// Example (coastal 2-hr): $500 base → $530 advertised → + $38.75 tax → $568.75.
// The 6% fee is the platform's; tax is collected with the charge and lands in
// the operator's account (they remit it).
export const FEE_NUM = 6;
export const FEE_DEN = 106;
export const TAX_RATE = 0.0775; // Santa Barbara sales tax, matches FareHarbor config

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
