-- Seed catalog. Base prices from FareHarbor where visible; rows marked
-- "TODO confirm" need client sign-off before cutover (Phase 5).
-- display_cents = base * 1.06 rounded UP to a whole dollar (6% booking fee, all-in per CA SB 478).

BEGIN;

INSERT INTO tours (slug, name, tagline, description, max_party, min_notice_hours, image_url, sort_order, policy_text) VALUES
('coastal-sunset-cruise', 'Coastal Cruise & Sunset Tour',
 '2 and 3 Hour Tours - The Best View of the American Riviera',
 'Our private coastal and sunset cruises offer gorgeous panoramic views of the American Riviera, from Carpinteria to Hollister Ranch. Bring up to six guests aboard The Belafonte for an unforgettable evening on the water.',
 6, 24, '/images/sunset-cruise.webp', 1,
 'Full refund for cancellations made 48 hours or more before departure. Weather cancellations by the captain are fully refundable or reschedulable.'),
('full-day-island-cruise', 'Full Day Island Cruise',
 '6 or 8 Hour Tours - Private Island Cruise Tailored Just for YOU!',
 'A private full-day excursion to Santa Cruz Island and the Channel Islands: sea caves, snorkeling, wildlife, and secluded anchorages — tailored just for you and up to five guests.',
 6, 48, '/images/santa-cruz-island.webp', 2,
 'Full refund for cancellations made 72 hours or more before departure. Weather cancellations by the captain are fully refundable or reschedulable.'),
('whale-watching', 'Whale Watching',
 '2 to 4 Hour Tours - Private Whale Watching Cruise',
 'A private whale watching cruise in the Santa Barbara Channel — humpbacks, grays, dolphins, and if we''re lucky, blue whales. Just your group and the captain.',
 6, 24, '/images/marine-wildlife.jpeg', 3,
 'Full refund for cancellations made 48 hours or more before departure. Weather cancellations by the captain are fully refundable or reschedulable.'),
('sport-fishing', 'Sport Fishing & Spearfishing',
 'Guided Trips in the Santa Barbara Channel',
 'Guided sport fishing and spearfishing charters with premium tackle and electronics. Sea bass, yellowtail, tuna and more, with 16+ years of island diving experience aboard.',
 6, 48, '/images/sportfishing-sbboatcharters.jpg', 4,
 'Full refund for cancellations made 72 hours or more before departure. Weather cancellations by the captain are fully refundable or reschedulable.'),
('foiling', 'Foiling',
 'Hydrofoil Sessions on the Santa Barbara Coast',
 'Tow-in hydrofoil sessions along the Santa Barbara coastline. All skill levels welcome — gear and coaching included.',
 6, 48, '/images/foiling-santa-barbara.webp', 5,
 'Full refund for cancellations made 48 hours or more before departure. Weather cancellations by the captain are fully refundable or reschedulable.'),
('create-your-own-adventure', 'Create Your Own Adventure',
 '2 to 8 Hour Tours - Let''s Create Your Adventure Together!',
 'Mix and match: coastline cruising, island time, swimming, snorkeling, fishing, BBQ on board — tell us what your perfect day looks like and we''ll build it together.',
 6, 48, '/images/experiences-custom-routes.jpeg', 6,
 'Full refund for cancellations made 72 hours or more before departure. Weather cancellations by the captain are fully refundable or reschedulable.');

-- Pricing options. display = ceil(base * 1.06 to whole dollar).
-- FareHarbor's advertised prices are ALL-IN ("Prices include fees"), so the
-- operator bases are derived by dividing by 1.06: $530→$500, $795→$750,
-- $1,590→$1,500. Customers pay exactly what they pay on FareHarbor today.
INSERT INTO pricing_options (tour_id, label, duration_min, base_cents, display_cents, sort_order)
SELECT t.id, v.label, v.duration_min, v.base_cents, (ceil(v.base_cents * 1.06 / 100.0) * 100)::int, v.sort_order
FROM tours t
JOIN (VALUES
  -- confirmed from FareHarbor (displays as 530 / 795 / 1590 all-in)
  ('coastal-sunset-cruise',      'Two Hour Private Charter',    120,  50000, 1),
  ('coastal-sunset-cruise',      'Three Hour Private Charter',  180,  75000, 2),
  ('full-day-island-cruise',     'Six Hour Island Cruise',      360, 150000, 1),
  ('full-day-island-cruise',     'Eight Hour Island Cruise',    480, 200000, 2),  -- TODO confirm (displays $2,120)
  ('whale-watching',             'Two Hour Cruise',             120,  50000, 1),  -- FareHarbor "from $530"
  ('whale-watching',             'Three Hour Cruise',           180,  75000, 2),  -- TODO confirm
  ('whale-watching',             'Four Hour Cruise',            240, 100000, 3),  -- TODO confirm
  ('sport-fishing',              'Half Day (4 Hours)',          240, 100000, 1),  -- TODO confirm
  ('sport-fishing',              'Three Quarter Day (6 Hours)', 360, 150000, 2),  -- TODO confirm
  ('foiling',                    'Two Hour Session',            120,  60000, 1),  -- TODO confirm (displays $636)
  ('create-your-own-adventure',  'Two Hours',                   120,  50000, 1),  -- TODO confirm
  ('create-your-own-adventure',  'Four Hours',                  240, 100000, 2),  -- TODO confirm
  ('create-your-own-adventure',  'Six Hours',                   360, 150000, 3),  -- TODO confirm
  ('create-your-own-adventure',  'Eight Hours',                 480, 200000, 4)   -- TODO confirm
) AS v(slug, label, duration_min, base_cents, sort_order) ON v.slug = t.slug;

-- Global default schedule: any day, departures on the hour, boat out 8am, back by 8pm.
INSERT INTO schedule_rules (tour_id, days_of_week, window_start, window_end, slot_step_min)
VALUES (NULL, '{0,1,2,3,4,5,6}', '08:00', '20:00', 60);

-- Foiling runs on fixed start times (matches FareHarbor).
INSERT INTO schedule_rules (tour_id, days_of_week, window_start, window_end, start_times)
SELECT id, '{0,1,2,3,4,5,6}', '08:00', '20:00',
       '{08:00,11:00,12:00,13:00,14:00,16:00,17:00}'::time[]
FROM tours WHERE slug = 'foiling';

COMMIT;
