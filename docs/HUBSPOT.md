# HubSpot contact sync

Every person who reaches us through the site becomes a HubSpot contact,
created or updated by email:

| Entry point | Where it runs | Source value |
|---|---|---|
| Contact form | `app/api/contact/route.js` | Contact form |
| Paid booking | `app/api/webhooks/stripe/route.js` | Booking |
| Booking fully covered by a gift card | `app/api/checkout/route.js` | Booking |
| Gift card purchase (buyer, and recipient if an email was given) | `app/api/webhooks/stripe/route.js` | Gift card purchase / Gift card recipient |

The sync lives in `lib/hubspot.mjs`. It runs after the real work (email sent,
booking confirmed) through `next/server`'s `after()`, and it never throws, so
HubSpot being down cannot break a booking. Without `HUBSPOT_ACCESS_TOKEN` it is
a no-op.

## Segmentation

Every contact gets `Business = SB Boat Charters`. The active list
"SB Boat Charters" filters on that property, so the account can be shared with
other businesses and this list stays clean. Also written: `SBBC source`,
`SBBC last tour`, `SBBC last trip date`, and lifecycle stage `customer` for
anyone who has paid (never downgraded).

## Credential

A HubSpot Service Key (Development > Keys > Service Keys), scopes
`crm.objects.contacts.read`, `crm.objects.contacts.write`,
`crm.schemas.contacts.write`, and optionally `crm.lists.write`. Stored as
`HUBSPOT_ACCESS_TOKEN` in Vercel and, for the scripts below, in `.env.local`.

## One-time setup

```
npm run hubspot:setup                  # creates the properties and the list
npm run hubspot:backfill -- --dry-run  # lists past customers it would send
npm run hubspot:backfill               # sends them
```

Both scripts read the token from `.env.local` and print where it came from.
The backfill prints the database host before connecting; `NEON_DATABASE_URL`
in `.env.local` means production.
