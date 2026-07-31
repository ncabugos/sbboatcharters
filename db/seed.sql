-- Seed catalog — prices transcribed from the operator's live FareHarbor
-- listings (July 2026 screenshots). Prices are ALL-IN ("Prices include fees"):
-- advertised = base + 6% booking fee, and that is the full amount charged.
--   $530 advertised = $500 base + $30 fee;  total $530.
-- Sales tax was removed 2026-07-30 (TAX_RATE = 0 in lib/pricing.js).

BEGIN;

INSERT INTO tours (slug, name, tagline, description, max_party, min_notice_hours, image_url, sort_order, policy_text) VALUES
('coastal-sunset-cruise', 'Coastal Cruise & Sunset Tour',
 '2 and 3 Hour Tours - The Best View of the American Riviera',
 'Our private coastal and sunset cruises offer gorgeous panoramic views of the American Riviera, from Carpinteria to Hollister Ranch. Bring up to six guests aboard The Belafonte for an unforgettable evening on the water.',
 6, 24, '/images/sunset-cruise.webp', 1,
 'Full refund for cancellations made two weeks or more before departure. Weather cancellations by the captain are fully refundable or reschedulable.'),
('full-day-island-cruise', 'Full Day Island Cruise',
 '6 or 8 Hour Tours - Private Island Cruise Tailored Just for YOU!',
 'A private full-day excursion to Santa Cruz Island and the Channel Islands: sea caves, snorkeling, wildlife, and secluded anchorages — tailored just for you and up to five guests.',
 6, 48, '/images/santa-cruz-island.webp', 2,
 'Full refund for cancellations made two weeks or more before departure. Weather cancellations by the captain are fully refundable or reschedulable.'),
('whale-watching', 'Whale Watching',
 '2 to 4 Hour Tours - Private Whale Watching Cruise',
 'A private whale watching cruise in the Santa Barbara Channel — humpbacks, grays, dolphins, and if we''re lucky, blue whales. Just your group and the captain.',
 6, 24, '/images/marine-wildlife.jpeg', 3,
 'Full refund for cancellations made two weeks or more before departure. Weather cancellations by the captain are fully refundable or reschedulable.'),
('sport-fishing', 'Sport Fishing',
 '2 to 8 Hour Tours - Tailored Fishing Experience',
 'Guided sport fishing charters in the Santa Barbara Channel with premium tackle and electronics. Sea bass, yellowtail, tuna and more.',
 6, 48, '/images/sportfishing-sbboatcharters.jpg', 4,
 'Full refund for cancellations made two weeks or more before departure. Weather cancellations by the captain are fully refundable or reschedulable.'),
('spearfishing', 'Spear Fishing',
 '8 Hours - Enjoy a Day of Adventure',
 'A full-day guided spearfishing expedition with 16+ years of island diving experience. Sea bass, yellowtail, tuna — gear guidance and expert local knowledge included.',
 6, 48, '/images/spearfishing-gallery-1.jpeg', 5,
 'Full refund for cancellations made two weeks or more before departure. Weather cancellations by the captain are fully refundable or reschedulable.'),
('foiling', 'Foiling',
 '2 to 4 Hour Tours - All Skill Levels',
 'Tow-in hydrofoil sessions along the Santa Barbara coastline. All skill levels welcome — gear and coaching included.',
 6, 48, '/images/foiling-santa-barbara.webp', 6,
 'Full refund for cancellations made two weeks or more before departure. Weather cancellations by the captain are fully refundable or reschedulable.'),
-- Mirrors FareHarbor: "Call to book!" — min_notice 8760h keeps every date in
-- the call-to-book state. Set back to 48 to enable instant online booking.
('create-your-own-adventure', 'Create Your Own Adventure',
 '2 to 8 Hour Tours - Let''s Create Your Adventure Together!',
 'Mix and match: coastline cruising, island time, swimming, snorkeling, fishing, BBQ on board — tell us what your perfect day looks like and we''ll build it together. Call to plan your trip!',
 6, 8760, '/images/experiences-custom-routes.jpeg', 7,
 'Full refund for cancellations made two weeks or more before departure. Weather cancellations by the captain are fully refundable or reschedulable.');

-- Pricing. display = ceil(base * 1.06) to whole dollars: 500→530, 600→636,
-- 750→795, 900→954, 1000→1060, 1250→1325, 1500→1590, 2000→2120.
-- Base rate is $250/hr across the catalog, except Coastal & Sunset at $300/hr
-- (raised 2026-07-30). Sport Fishing and Create Your Own Adventure keep their
-- volume discount on 6h/8h ($208/hr and $187.50/hr).
INSERT INTO pricing_options (tour_id, label, duration_min, base_cents, display_cents, sort_order)
SELECT t.id, v.label, v.duration_min, v.base_cents, (ceil(v.base_cents * 1.06 / 100.0) * 100)::int, v.sort_order
FROM tours t
JOIN (VALUES
  -- Coastal & Sunset moved to $300/hr on 2026-07-30; every other tour stays $250/hr.
  ('coastal-sunset-cruise',     'Two Hour Private Charter',   120,  60000, 1),
  ('coastal-sunset-cruise',     'Three Hour Private Charter', 180,  90000, 2),
  ('full-day-island-cruise',    'Six Hour Private Charter',   360, 150000, 1),
  ('full-day-island-cruise',    'Eight Hour Private Charter', 480, 200000, 2),
  ('whale-watching',            'Two Hour Private Charter',   120,  50000, 1),
  ('whale-watching',            'Three Hour Private Charter', 180,  75000, 2),
  ('whale-watching',            'Four Hour Private Charter',  240, 100000, 3),
  ('sport-fishing',             'Two Hour Private Charter',   120,  50000, 1),
  ('sport-fishing',             'Three Hour Private Charter', 180,  75000, 2),
  ('sport-fishing',             'Four Hour Private Charter',  240, 100000, 3),
  ('sport-fishing',             'Six Hour Private Charter',   360, 125000, 4),
  ('sport-fishing',             'Eight Hour Private Charter', 480, 150000, 5),
  ('spearfishing',              'Eight Hour Private Charter', 480, 200000, 1),
  ('foiling',                   'Two Hour Private Charter',   120,  50000, 1),
  ('foiling',                   'Three Hour Private Charter', 180,  75000, 2),
  ('foiling',                   'Four Hour Private Charter',  240, 100000, 3),
  ('create-your-own-adventure', 'Two Hour Private Charter',   120,  50000, 1),
  ('create-your-own-adventure', 'Three Hour Private Charter', 180,  75000, 2),
  ('create-your-own-adventure', 'Four Hour Private Charter',  240, 100000, 3),
  ('create-your-own-adventure', 'Six Hour Private Charter',   360, 125000, 4),
  ('create-your-own-adventure', 'Eight Hour Private Charter', 480, 150000, 5)
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
