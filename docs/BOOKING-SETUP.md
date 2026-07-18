# Booking System — Go-Live Setup

The custom booking system (replacing FareHarbor) is fully built and verified locally.
This checklist covers everything needed to take it live. Until Stripe keys are set,
booking pages show "Online payment is being set up — call to book" instead of a
payment form, so it is safe to deploy at any time.

## Revenue model (mirrors FareHarbor's checkout exactly)

- **6% customer-facing booking fee** — same as FareHarbor charges today.
- Advertised prices are **all-in** (base × 1.06, rounded up to a whole dollar),
  shown with "Prices include all fees" — required by California SB 478.
  Example: $500 base → $530 advertised.
- **Sales tax (7.75% of the BASE) is added at checkout**, exactly like
  FareHarbor: $530 subtotal + $38.75 tax = $568.75 total. The tax is part of
  the charge and lands in the operator's account — the operator remits it; the
  platform fee never takes a cut of tax. Rate lives in `lib/pricing.js`
  (`TAX_RATE`) — update there if the district rate changes.
- The fee is collected automatically on every payment via Stripe Connect
  `application_fee_amount` into YOUR platform Stripe account. The client (operator)
  is merchant-of-record: payments land in their Stripe account, they issue refunds
  from their own dashboard.
- Gift cards: fee charged once at purchase ($100 card sells for $106); no fee
  again at redemption. No tax at purchase — tax is charged on the booking the
  card pays for.
- Catalog prices confirmed against the operator's live FareHarbor listings
  (July 2026): all tours use the $530/$795/$1,060/$1,325/$1,590 ladder except
  Island Cruise (6h $1,590 / 8h $2,120) and Spear Fishing (8h $2,120).
  Create Your Own Adventure mirrors FareHarbor's "Call to book!" (set its
  `min_notice_hours` from 8760 back to 48 to enable instant online booking).

## 1. Database — Neon via Vercel Marketplace

1. Vercel dashboard → Storage → Create Database → **Neon Postgres** → link to the
   sb-boat-charters project. This sets `DATABASE_URL` automatically.
2. Apply schema + seed (from your machine, with the Neon URL):
   ```sh
   psql "$NEON_DATABASE_URL" -f db/schema.sql
   psql "$NEON_DATABASE_URL" -f db/seed.sql
   ```
3. **Before cutover:** confirm real prices/durations with the client and update the
   rows marked `TODO confirm` in `db/seed.sql` (island cruise 8-hr, whale watching
   3/4-hr, sport fishing, foiling, create-your-own).

Local dev database (already running):
`docker start sbbc-postgres` → `postgresql://postgres:sbbc_dev@localhost:54329/sbbc`

## 2. Stripe Connect (your platform + client's account)

1. Create/use YOUR Stripe account as the **platform**: Dashboard → Connect →
   Get started → choose **Standard** accounts (platform profile setup).
2. Connect → Accounts → Create → send the onboarding link to the client
   (Garrick). He completes KYC + bank details on Stripe's hosted flow.
3. Record his account id (`acct_...`) → `NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT_ID`.
4. Webhook: Dashboard → Developers → Webhooks → Add endpoint
   `https://www.sbboatcharters.com/api/webhooks/stripe/`
   - ⚠️ **Include the TRAILING SLASH.** The site uses `trailingSlash: true`, so
     `/api/webhooks/stripe` (no slash) returns a 308 redirect that Stripe does
     NOT follow — webhooks silently fail and bookings never confirm. Always use
     the slash, both locally and in production.
   - **Check "Listen to events on Connected accounts"** (required — direct charges)
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the signing secret → `STRIPE_WEBHOOK_SECRET`
5. Test mode first! Create a test connected account, use test keys, book with
   card `4242 4242 4242 4242`, and verify the 6% application fee shows in your
   platform test dashboard under Collected fees.
   Local webhook forwarding (note the trailing slash):
   ```sh
   stripe listen --api-key sk_test_... \
     --forward-connect-to "localhost:3000/api/webhooks/stripe/" \
     --events payment_intent.succeeded,payment_intent.payment_failed,payment_intent.canceled
   ```
   Test-account onboarding tip: to pass identity verification instantly with no
   document upload, use DOB **01/01/1901** + SSN **000000000** (other DOBs trigger
   a document requirement). Phone: "Use test phone number" → code `000000`.

## 3. Environment variables (Vercel → Settings → Environment Variables)

| Var | Value |
|---|---|
| `DATABASE_URL` | set by Neon integration |
| `STRIPE_SECRET_KEY` | platform secret key (`sk_live_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | platform publishable key |
| `NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT_ID` | client's `acct_...` |
| `STRIPE_WEBHOOK_SECRET` | from webhook endpoint |
| `ADMIN_PASSWORD` | captain's login for /admin |
| `ADMIN_SESSION_SECRET` | 32+ random chars (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_SITE_URL` | `https://www.sbboatcharters.com` |
| `RESEND_API_KEY` | already configured |
| `BOOKING_NOTIFY_EMAIL` | omit in production (defaults to garrick.gch@gmail.com); set in dev to avoid emailing the captain |

## 4. Cutover (last step, one commit)

Swap the ~13 FareHarbor links after client sign-off and a successful live test
booking (book the cheapest option, then refund from the client's Stripe dashboard):

- Header/Footer/homepage/the-belafonte "Book Now" → `/book`
- channel-islands-tour → `/book/full-day-island-cruise`
- coastal-sunset-cruises → `/book/coastal-sunset-cruise`
- spearfishing + sport-fishing → `/book/sport-fishing`
- foiling → `/book/foiling`
- gift-cards "Purchase Gift Card" → `/gift-cards/purchase`

Keep the FareHarbor account open ~30 days as fallback. Monitor Stripe webhook
delivery dashboard + Vercel logs the first week.

## Day-to-day operation (captain)

- **/admin** — upcoming bookings, cancel (frees slot; refund via Stripe dashboard)
- **/admin/manual** — enter phone bookings (blocks the calendar)
- **/admin/blackouts** — block days off
- **/admin/gift-cards** — balances, disable lost codes

## Architecture notes

- One boat = one availability pool. Double-booking is impossible at the database
  level (Postgres exclusion constraint on the booking time range + 30-min
  turnaround buffer, covering pending + confirmed bookings).
- Checkout creates a 30-minute pending hold; stale holds are swept lazily.
  If a payment lands after the hold expired *and* the slot was retaken, the
  webhook auto-refunds and emails an apology (the only automated refund).
- Availability is computed on the fly from `schedule_rules` − blackouts −
  bookings − minimum-notice hours (48h notice shows "Call to book", matching
  FareHarbor). All times Pacific.
- Emails via Resend: customer confirmation, captain notification, gift card
  delivery + receipt.
