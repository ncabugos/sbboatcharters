import { sql } from './db';

// Full booking row joined with tour/option/customer — used for emails and pages.
export async function loadBookingDetails(bookingId) {
  const rows = await sql`
    SELECT b.*, t.name AS tour_name, t.meeting_point, t.policy_text,
           p.label AS option_label, p.duration_min,
           c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone
    FROM bookings b
    JOIN tours t ON t.id = b.tour_id
    JOIN pricing_options p ON p.id = b.pricing_option_id
    LEFT JOIN customers c ON c.id = b.customer_id
    WHERE b.id = ${bookingId}`;
  return rows[0];
}

export async function loadBookingByToken(token) {
  const rows = await sql`
    SELECT b.*, t.name AS tour_name, t.meeting_point, t.policy_text, t.call_to_book_phone,
           p.label AS option_label, p.duration_min,
           c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone
    FROM bookings b
    JOIN tours t ON t.id = b.tour_id
    JOIN pricing_options p ON p.id = b.pricing_option_id
    LEFT JOIN customers c ON c.id = b.customer_id
    WHERE b.confirmation_token = ${token}`;
  return rows[0];
}
