# Booking System — Live Reference

**Status: LIVE in production since 2026-07-31.** FareHarbor links were swapped on
2026-07-30 (commit `78e1915`) and the first real customer booking confirmed
end-to-end on 2026-07-31 — live card charge → webhook → booking confirmed →
confirmation + captain emails delivered → 6% application fee collected.

Keep the FareHarbor account open as fallback until **~2026-08-29**.

---

## The one thing that catches everyone

**Prices, cancellation policy, tour names, and availability rules live in the
Neon database — not in the code.** Editing `db/seed.sql` only affects a fresh
install. To change production you run SQL against Neon.

Vercel → Storage → your Neon database → **Query** (SSO, no separate login).

⚠️ **Neon's Query editor runs ONE statement per execution.** Pasting several at
once fails with `cannot insert multiple commands into a prepared statement`.
Run them one at a time, in order.

```sql
-- Change the cancellation policy on every tour
UPDATE tours SET policy_text = 'Full refund for cancellations made two weeks or more before departure. Weather cancellations by the captain are fully refundable or reschedulable.';

-- Reprice one tour (display_cents is derived, never hand-typed)
UPDATE pricing_options o
SET base_cents = 60000, display_cents = (ceil(60000 * 1.06 / 100.0) * 100)::int
FROM tours t
WHERE t.id = o.tour_id AND t.slug = 'coastal-sunset-cruise' AND o.duration_min = 120;
```

Write repricing SQL as **explicit target values**, never `base_cents * 1.2` — a
multiplier compounds silently if the statement is ever run twice.

Always update `db/seed.sql` to match, so a fresh install matches production.

**The one exception:** `app/foiling/page.js` hardcodes its prices in the details
card. Every other page reads the catalog. Grep for `$` amounts in `app/` after
any repricing.

---

## Revenue model

- **6% customer-facing booking fee**, matching what FareHarbor charged.
- Advertised prices are **all-in**: `base × 1.06`, rounded up to a whole dollar.
  $600 base → $636 advertised, and $636 is the full amount charged.
  Required by **California SB 478** — mandatory fees must be *inside* the
  advertised price, not disclosed beside it. Never advertise the ex-fee hourly
  rate (that mistake was corrected in `fafd9e8`); quote package prices.
- The checkout summary **itemizes** that all-in price (`Three Hour Private
  Charter $900` / `Booking fee $54` / `Total $954`). This is disclosure, not
  drip pricing: every number the customer sees before checkout is still the
  all-in one, and the total never changes between the tour page and checkout.
  Do not "simplify" this by moving the fee out of the advertised price — that
  is the SB 478 violation. Considered and rejected 2026-08-03.
- **No sales tax.** Removed 2026-07-30. `TAX_RATE = 0` in `lib/pricing.js`; the
  plumbing is intact, so setting it back to `0.0775` re-enables the tax line in
  the summary, confirmation page and emails, all of which render it only when
  non-zero. Bookings taken while tax was charged keep their `tax_cents`.
- The fee is collected as Stripe Connect `application_fee_amount` into YOUR
  platform account. The operator is **merchant of record** — payments land in
  their account and they issue refunds from their own dashboard.
- **The fee yields to tax if tax is ever re-enabled.** In `app/api/checkout`:
  `applicationFee = max(0, min(display − base, chargeCents − taxCents))`.
  Without the `− taxCents`, a gift card covering most of a booking hands the
  platform the entire remainder and leaves the operator owing tax out of pocket
  (fixed in `e301064`).
- **Stripe processing (~2.9% + 30¢) is paid by the operator**, not the platform
  (`controller.fees.payer: account`, fixed at account creation). On a $530
  booking: $15.67 to Stripe, $30 to the platform, $484.33 net to the operator.
  The Express Dashboard labels the combined $45.67 as "Processing fees", which
  looks alarming until expanded — expect the operator to ask about this.
- Gift cards: fee charged once at purchase ($100 card sells for $106), none
  again at redemption. Amounts $50–$2,000, whole dollars.

### Current catalog — $300/hr base (raised from $250 on 2026-07-30, +20%)

| Tour | 2h | 3h | 4h | 6h | 8h |
|---|---|---|---|---|---|
| Coastal & Sunset | $636 | $954 | — | — | — |
| Whale Watching | $636 | $954 | $1,272 | — | — |
| Foiling | $636 | $954 | $1,272 | — | — |
| Sport Fishing | $636 | $954 | $1,272 | $1,590 | $1,908 |
| Create Your Own | $636 | $954 | $1,272 | $1,590 | $1,908 |
| Island Cruise | — | — | — | $1,908 | $2,544 |
| Spearfishing | — | — | — | — | $2,544 |
| Lobster Diving | — | — | — | — | $2,544 (Day or Night) |

Sport Fishing and Create Your Own keep a volume discount on long trips: 6h works
out to $250/hr and 8h to $225/hr. Every other row is a flat $300/hr.

Create Your Own Adventure is **call-to-book only** via `min_notice_hours = 8760`.
Set it to 48 to enable instant online booking.

**Lobster Diving is seasonal** (`tours.season_start` / `season_end`, currently
2026-10-02 → 2027-03-17): the availability API returns no slots outside those
dates and the calendar opens on the season's first month. Update the two dates
each year — nothing else needs to change. Its two options, Day and Night, each
have their own `schedule_rules` row pinned via `pricing_option_id`; the Night
window is `16:00`–`02:00`, and a `window_end` at or before `window_start` means
"the next day". Added by `scripts/apply-lobster-diving.js`.

---

## Live accounts and IDs

| | |
|---|---|
| Platform Stripe account | `acct_1THSG56lYeMpqwzv` (b3creative) |
| Operator connected account | `acct_1TwRmg7KkijAT9TT` — **Express**, charges + payouts enabled |
| Live webhook endpoint | `we_1Tz1Yr6lYeMpqwzvyBKnKOYT` |
| Database | Neon `neon-alizarin-car`, via Vercel Storage |
| Vercel project | `prj_diGDj1gI1sSItFVNsreQAXFNpE7e` |

The connected account is **Express**, not Standard. That means the operator uses
the **Express Dashboard** — browser only, no Stripe mobile app, and no password:
he signs in at <https://connect.stripe.com/express_login> with an emailed or
texted one-time code. Google login and the Dashboard mobile app do not apply to
him. He can see his payments, balance, payouts and issue refunds there. Platform
branding shown in his dashboard is set at
Stripe → Settings → Connect → Express Dashboard → Branding (platform-wide, not
per account).

---

## Webhook

Endpoint URL — **the trailing slash is mandatory**:

```
https://www.sbboatcharters.com/api/webhooks/stripe/
```

`trailingSlash: true` means the slashless URL returns a 308, and **Stripe does
not follow redirects on webhook delivery**. It fails silently: customer charged,
booking stuck `pending`, no confirmation email.

- **"Listen to events on Connected accounts" must be checked** — we use direct
  charges, so events originate on the operator's account, not the platform's.
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- Signing secret → `STRIPE_WEBHOOK_SECRET`. It starts with `whsec_`.
  **`we_...` is the endpoint ID, not the signing secret** — pasting the endpoint
  ID into Vercel is a real mistake that happened here and breaks every delivery.

### Verify it without moving money

```sh
STRIPE_WEBHOOK_SECRET=whsec_... node scripts/verify-live-webhook.js
```

Sends a properly-signed synthetic event with empty metadata, so the handler
no-ops. Maps each status to its cause: **200** pass · **400** wrong signing
secret · **503** missing Vercel key · **308** lost trailing slash. Run it after
any webhook or secret change.

Local forwarding during development (note the slash):

```sh
stripe listen --api-key sk_test_... \
  --forward-connect-to "localhost:3000/api/webhooks/stripe/" \
  --events payment_intent.succeeded,payment_intent.payment_failed,payment_intent.canceled
```

Test-account onboarding tip: DOB **01/01/1901** + SSN **000000000** passes
identity verification instantly with no document upload. Phone: "Use test phone
number" → code `000000`.

---

## Environment variables (Vercel → Settings → Environment Variables)

| Var | Value |
|---|---|
| `DATABASE_URL` | set by the Neon integration |
| `STRIPE_SECRET_KEY` | platform secret key (`sk_live_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | platform publishable key (`pk_live_...`) |
| `NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT_ID` | `acct_1TwRmg7KkijAT9TT` |
| `STRIPE_WEBHOOK_SECRET` | signing secret (`whsec_...`) |
| `ADMIN_PASSWORD` | captain's login for /admin |
| `ADMIN_SESSION_SECRET` | 32+ random chars (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_SITE_URL` | `https://www.sbboatcharters.com` |
| `RESEND_API_KEY` | already configured |
| `CRON_SECRET` | 16+ random chars. Vercel sends it as `Authorization: Bearer …` on cron invocations; the route 401s without it. |
| `GOOGLE_REVIEW_URL` | Google review link. **Until this is set the review-request cron no-ops** — that is the feature's off switch. |
| `BOOKING_NOTIFY_EMAIL` | **must be absent in production** — it replaces the entire booking-alert list (captain + Nick), so alerts would go only to whatever you set. Set it in dev (comma-separated for several addresses). |

`NEXT_PUBLIC_*` vars are inlined **at build time** — changing one requires a
redeploy, not just a save. Server-side vars also need a redeploy to take effect.

To confirm a deploy actually picked them up, fetch a booking page and grep the
JS chunks for `pk_live` and the `acct_` id.

---

## Post-trip review request (daily cron)

The morning after a charter, the guest gets a thank-you from Captain Garrick
asking for a Google review. Configured in `vercel.json`:

```json
{ "path": "/api/cron/review-requests/", "schedule": "0 17 * * *" }
```

- ⚠️ **The path needs the TRAILING SLASH.** `trailingSlash: true` means the
  slashless path 308s, and **Vercel cron does not follow redirects** — the job
  would complete without ever running. Identical trap to the Stripe webhook.
- **Schedules are always UTC.** `0 17 * * *` is 10am PDT / 9am PST.
- Eligibility: `status = 'confirmed'`, trip ended **12 h – 7 days** ago, and
  `review_email_sent_at IS NULL`. The 7-day ceiling means a missed run still
  catches up, and stops a first deploy from mailing the entire back catalogue.
- Rows are **claimed before sending** (`UPDATE … RETURNING`, `SKIP LOCKED`).
  Vercel documents that cron can fire the same run twice, and a duplicate
  "thanks for coming out" is worse than a missed one. A send failure releases
  the row so the next day retries it.
- Bookings with no email (phone bookings via `/admin/manual`) are released,
  never marked sent.

To switch it on, in this order:

1. `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_email_sent_at timestamptz;`
   plus the backfill guard, so past trips aren't emailed retroactively.
2. Set `CRON_SECRET` and `GOOGLE_REVIEW_URL` in Vercel.
3. Redeploy.

Doing 2 before 1 makes the first run 500 on a missing column.

Get the review link from Google Business Profile → **Ask for reviews**, which
gives a `g.page/r/…` short link. The long form also works:
`https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID`.

Note the email deliberately makes **one** ask with **one** link, and invites
unhappy guests to reply privately rather than routing everyone to Google.

---

## Local development

```sh
docker start sbbc-postgres   # postgresql://postgres:sbbc_dev@localhost:54329/sbbc
npm run dev
```

`psql` lives at `/opt/homebrew/opt/libpq/bin/psql`. Keep **test** keys in
`.env.local` (`sk_test_`/`pk_test_`) — if `STRIPE_SECRET_KEY` is unset, booking
pages fall back to "call to book", which is the safe state. Never put a live
secret key in `STRIPE_SECRET_KEY` locally; the dev server would transact against
live Stripe. `.env*` is gitignored.

`trailingSlash: true` means curl needs `-L` against these routes.

---

## Cutover — completed 2026-07-30 (`78e1915`)

All 19 FareHarbor links replaced with `next/link` internal routes:

| Page | Destination |
|---|---|
| Header ×2, Footer, home ×2, the-belafonte ×2 | `/book/` |
| channel-islands-tour ×2 | `/book/full-day-island-cruise/` |
| coastal-sunset-cruises ×3 | `/book/coastal-sunset-cruise/` |
| spearfishing ×2 | `/book/spearfishing/` |
| sport-fishing ×2 | `/book/sport-fishing/` |
| foiling ×2 | `/book/foiling/` |
| gift-cards | `/gift-cards/purchase/` |

Spearfishing has its **own** tour and price ladder — it is not part of Sport
Fishing. An earlier version of this doc mapped it wrongly.

---

## Day-to-day operation (captain)

- **/admin** — upcoming bookings, cancel (frees the slot; refund separately in Stripe)
- **/admin/manual** — enter phone bookings so they block the calendar
- **/admin/blackouts** — block days off
- **/admin/gift-cards** — balances, disable lost codes
- **Express Dashboard** — money: payments, payouts, refunds

Rule of thumb: **/admin is for bookings, Stripe is for money.**

---

## Architecture notes

- One boat = one availability pool. Double-booking is impossible at the database
  level — a Postgres exclusion constraint on the booking time range plus a 30-min
  turnaround buffer, covering `pending` and `confirmed`. Never bypass it; catch
  SQLSTATE `23P01` and return 409. Verified: overlaps are rejected *across
  different tours*, not just within one.
- Checkout creates a 30-minute pending hold; stale holds are swept lazily at the
  top of `/api/checkout` (no cron). If a payment lands after the hold expired
  *and* the slot was retaken, the webhook auto-refunds and emails an apology —
  the only automated refund in the system.
- Availability is computed on the fly from `schedule_rules` − blackouts −
  bookings − minimum notice (24h or 48h depending on tour; inside that window the
  day shows "Call to book"). All times Pacific. Foiling runs on fixed start times.
- Gift card balances are only decremented on payment confirmation, never on a
  pending hold, so an abandoned checkout can't burn a card.
- Emails via Resend: customer confirmation, captain notification, gift card
  delivery + receipt.
- **Never verified in live mode:** the gift-card purchase flow. It has its own
  webhook branch separate from bookings. Test it before promoting gift cards.
