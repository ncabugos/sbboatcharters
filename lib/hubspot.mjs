/**
 * HubSpot contact sync.
 *
 * Everyone who reaches us through the site (contact form, paid booking, gift
 * card) is upserted as a HubSpot contact keyed on email and stamped with a
 * "Business" property, so a single active list in HubSpot ("Business is SB
 * Boat Charters") is the segment for this business even if the account is
 * shared with others.
 *
 * Best-effort by design: callers run this AFTER the real work (email sent,
 * booking confirmed) via syncContact(), which never throws, so a HubSpot
 * outage can never break a booking or a contact form.
 *
 * This file is .mjs (not .js) so the one-off scripts in scripts/ can import
 * it directly under plain Node, which treats .js in this package as CommonJS.
 */

const API_BASE = process.env.HUBSPOT_API_BASE || 'https://api.hubapi.com';
const TIMEOUT_MS = 8000;

export const BUSINESS = { value: 'sb_boat_charters', label: 'SB Boat Charters' };

export const SOURCES = {
  CONTACT_FORM: { value: 'contact_form', label: 'Contact form' },
  BOOKING: { value: 'booking', label: 'Booking' },
  GIFT_CARD: { value: 'gift_card', label: 'Gift card purchase' },
  GIFT_RECIPIENT: { value: 'gift_card_recipient', label: 'Gift card recipient' },
};

// Custom contact properties. scripts/hubspot-setup.mjs creates them; the sync
// writes them. Internal names are prefixed so they cannot collide with another
// business sharing the account; "business" itself is deliberately shared.
export const PROPERTIES = [
  {
    name: 'business',
    label: 'Business',
    description: 'Which business this contact came through. Segment on this.',
    groupName: 'contactinformation',
    type: 'enumeration',
    fieldType: 'select',
    options: [BUSINESS],
  },
  {
    name: 'sbbc_source',
    label: 'SBBC source',
    description: 'How this contact most recently reached SB Boat Charters.',
    groupName: 'contactinformation',
    type: 'enumeration',
    fieldType: 'select',
    options: Object.values(SOURCES),
  },
  {
    name: 'sbbc_last_tour',
    label: 'SBBC last tour',
    description: 'Most recent tour booked, or the charter asked about on the contact form.',
    groupName: 'contactinformation',
    type: 'string',
    fieldType: 'text',
  },
  {
    name: 'sbbc_last_trip_date',
    label: 'SBBC last trip date',
    description: 'Date of the most recent confirmed booking.',
    groupName: 'contactinformation',
    type: 'date',
    fieldType: 'date',
  },
];

export const LIST_NAME = 'SB Boat Charters';

export function hubspotConfigured() {
  return Boolean(process.env.HUBSPOT_ACCESS_TOKEN);
}

export async function hubspotApi(method, path, body) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error('HUBSPOT_ACCESS_TOKEN is not set');
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`HubSpot ${method} ${path} -> ${res.status}: ${json?.message || text.slice(0, 300)}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function splitName(full) {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstname: parts[0] };
  return { firstname: parts[0], lastname: parts.slice(1).join(' ') };
}

// HubSpot date properties take a calendar date. Trips are in Pacific time, so
// format there rather than in the server's zone.
export function toHubspotDate(value) {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d); // en-CA gives YYYY-MM-DD
}

/**
 * Build the property payload for one contact. Returns null when there is no
 * usable email. Exported so the backfill can batch many at once.
 */
export function contactProperties({ email, name, firstName, lastName, phone, source, tour, tripDate, customer }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(cleanEmail)) return null;
  const names = firstName || lastName
    ? { firstname: firstName || undefined, lastname: lastName || undefined }
    : splitName(name);
  const props = {
    email: cleanEmail,
    business: BUSINESS.value,
    sbbc_source: source?.value,
    ...names,
  };
  if (phone) props.phone = String(phone).trim();
  if (tour) props.sbbc_last_tour = String(tour).trim().slice(0, 200);
  const date = toHubspotDate(tripDate);
  if (date) props.sbbc_last_trip_date = date;
  // Only ever move people forward to customer; never downgrade a customer who
  // later uses the contact form (HubSpot would happily write "lead" back).
  if (customer) props.lifecyclestage = 'customer';
  for (const k of Object.keys(props)) if (props[k] === undefined) delete props[k];
  return props;
}

// Create-or-update up to 100 contacts in one call, keyed on email.
export async function upsertContacts(propertyList) {
  const inputs = propertyList.filter(Boolean).map((properties) => ({
    idProperty: 'email', id: properties.email, properties,
  }));
  if (inputs.length === 0) return { results: [] };
  if (inputs.length > 100) throw new Error('upsertContacts: max 100 per call');
  return hubspotApi('POST', '/crm/v3/objects/contacts/batch/upsert', { inputs });
}

export async function upsertContact(input) {
  const props = contactProperties(input);
  if (!props) return null;
  const out = await upsertContacts([props]);
  return out.results?.[0] ?? null;
}

/**
 * Request-handler entry point. Never throws and is a no-op without a token,
 * so it is safe to call from any route. Callers should await it (or hand it
 * to next/server's after()) — a dangling promise can be killed when a
 * serverless function returns.
 */
export async function syncContact(input) {
  if (!hubspotConfigured()) return null;
  try {
    return await upsertContact(input);
  } catch (err) {
    console.error('[hubspot] contact sync failed for', input?.email, '-', err.message);
    return null;
  }
}

// Shape a row from loadBookingDetails() (or the backfill query) into sync input.
export function bookingContact(b) {
  return {
    email: b.customer_email,
    name: b.customer_name,
    phone: b.customer_phone,
    source: SOURCES.BOOKING,
    tour: b.tour_name,
    tripDate: b.trip_start,
    customer: true,
  };
}

// A paid gift card yields up to two contacts: the buyer, and the recipient if
// the buyer gave us their email.
export function giftCardContacts(card) {
  const list = [{
    email: card.purchaser_email,
    name: card.purchaser_name,
    source: SOURCES.GIFT_CARD,
    customer: true,
  }];
  if (card.recipient_email) {
    list.push({ email: card.recipient_email, name: card.recipient_name, source: SOURCES.GIFT_RECIPIENT });
  }
  return list;
}
