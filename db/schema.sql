-- SB Boat Charters custom booking system schema
-- Apply once: psql "$DATABASE_URL" -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Catalog ────────────────────────────────────────────────

CREATE TABLE tours (
  id               serial PRIMARY KEY,
  slug             text UNIQUE NOT NULL,
  name             text NOT NULL,
  tagline          text,
  description      text,
  meeting_point    text NOT NULL DEFAULT '302 W. Cabrillo Blvd. Santa Barbara, CA 93109 - Marina 3 Gate',
  max_party        int  NOT NULL DEFAULT 6,
  min_notice_hours int  NOT NULL DEFAULT 24,
  call_to_book_phone text NOT NULL DEFAULT '(805) 722-2282',
  policy_text      text,
  image_url        text,
  active           boolean NOT NULL DEFAULT true,
  sort_order       int NOT NULL DEFAULT 0
);

-- Duration/price variants ("Two Hour Private Charter $530", ...)
CREATE TABLE pricing_options (
  id            serial PRIMARY KEY,
  tour_id       int NOT NULL REFERENCES tours(id),
  label         text NOT NULL,
  duration_min  int  NOT NULL,
  base_cents    int  NOT NULL,  -- operator's price
  display_cents int  NOT NULL,  -- all-in advertised price (CA SB 478); fee = display - base
  active        boolean NOT NULL DEFAULT true,
  sort_order    int NOT NULL DEFAULT 0
);

-- When the boat can run. tour_id NULL = default rule for all tours;
-- a tour with its own rule rows uses only those.
CREATE TABLE schedule_rules (
  id            serial PRIMARY KEY,
  tour_id       int REFERENCES tours(id),
  days_of_week  int[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',  -- 0=Sunday
  window_start  time NOT NULL DEFAULT '08:00',              -- earliest departure
  window_end    time NOT NULL DEFAULT '20:00',              -- latest return
  start_times   time[],                                     -- if set, only these departures
  slot_step_min int NOT NULL DEFAULT 60,
  active        boolean NOT NULL DEFAULT true
);

CREATE TABLE blackout_dates (
  id         serial PRIMARY KEY,
  starts_at  timestamptz NOT NULL,
  ends_at    timestamptz NOT NULL,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

-- ── Bookings ───────────────────────────────────────────────

CREATE TABLE customers (
  id         serial PRIMARY KEY,
  email      text NOT NULL,
  name       text NOT NULL,
  phone      text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX customers_email_idx ON customers (lower(email));

CREATE TABLE bookings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id            int NOT NULL REFERENCES tours(id),
  pricing_option_id  int NOT NULL REFERENCES pricing_options(id),
  customer_id        int REFERENCES customers(id),
  party_size         int NOT NULL CHECK (party_size >= 1),
  trip_start         timestamptz NOT NULL,
  trip_end           timestamptz NOT NULL,
  -- includes 30-min turnaround buffer after the trip
  block_range        tstzrange   NOT NULL,
  status             text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','cancelled','expired')),
  expires_at         timestamptz,  -- pending holds only
  base_cents         int NOT NULL,
  fee_cents          int NOT NULL,
  gift_card_cents    int NOT NULL DEFAULT 0,
  charged_cents      int NOT NULL,
  stripe_payment_intent_id text,
  confirmation_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16),'hex'),
  source             text NOT NULL DEFAULT 'web' CHECK (source IN ('web','admin')),
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  -- One boat: no two live bookings may overlap. This is the system's core guarantee.
  CONSTRAINT no_overlap EXCLUDE USING gist (block_range WITH &&)
    WHERE (status IN ('pending','confirmed'))
);
CREATE INDEX bookings_start_idx ON bookings (trip_start);
CREATE INDEX bookings_pi_idx ON bookings (stripe_payment_intent_id);

-- ── Gift cards ─────────────────────────────────────────────

CREATE TABLE gift_cards (
  id              serial PRIMARY KEY,
  code            text UNIQUE NOT NULL,
  initial_cents   int NOT NULL,
  balance_cents   int NOT NULL CHECK (balance_cents >= 0),
  purchaser_name  text,
  purchaser_email text NOT NULL,
  recipient_email text,
  recipient_name  text,
  message         text,
  status          text NOT NULL DEFAULT 'pending_payment'
                  CHECK (status IN ('pending_payment','active','depleted','disabled')),
  stripe_payment_intent_id text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gift_cards_pi_idx ON gift_cards (stripe_payment_intent_id);

CREATE TABLE gift_card_redemptions (
  id           serial PRIMARY KEY,
  gift_card_id int  NOT NULL REFERENCES gift_cards(id),
  booking_id   uuid NOT NULL REFERENCES bookings(id),
  amount_cents int  NOT NULL CHECK (amount_cents > 0),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Stripe retries webhooks; this gates double-processing.
CREATE TABLE webhook_events (
  stripe_event_id text PRIMARY KEY,
  type            text NOT NULL,
  processed_at    timestamptz NOT NULL DEFAULT now()
);
