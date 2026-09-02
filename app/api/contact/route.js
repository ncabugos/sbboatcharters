import { after } from 'next/server';
import { Resend } from 'resend';
import { syncContact, SOURCES } from '@/lib/hubspot.mjs';

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Escape user input before embedding it in the email HTML.
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Collapse newlines for use in the subject header (prevents header injection).
function oneLine(str = '') {
  return String(str).replace(/[\r\n]+/g, ' ').trim();
}

function countLinks(str = '') {
  return (String(str).match(/https?:\/\/|www\.|<a\s|\[url/gi) || []).length;
}

// Verify the Cloudflare Turnstile token. Returns true (skips) until the secret
// is configured in env, so Tier-1 protections work before keys are added.
async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(request) {
  try {
    const { firstName, lastName, email, phone, charter, message, company, elapsedMs, turnstileToken } =
      await request.json();

    // 1. Honeypot — bots fill the hidden "company" field. Silently accept and drop.
    if (company) {
      return Response.json({ success: true });
    }

    // 2. Time-trap — forms completed implausibly fast are bots. Silently drop.
    if (typeof elapsedMs === 'number' && elapsedMs < 2000) {
      return Response.json({ success: true });
    }

    // 3. Required fields.
    if (!firstName || !email || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 4. Format + length validation.
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }
    if (
      String(firstName).length > 100 ||
      String(lastName || '').length > 100 ||
      String(phone || '').length > 40 ||
      String(message).length > 5000
    ) {
      return Response.json({ error: 'Input too long' }, { status: 400 });
    }

    // 5. Link flood — genuine charter inquiries don't carry a pile of URLs. Silently drop.
    if (countLinks(message) > 4) {
      return Response.json({ success: true });
    }

    // 6. Turnstile (enforced only once TURNSTILE_SECRET_KEY is set in env).
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (!(await verifyTurnstile(turnstileToken, ip))) {
      return Response.json({ error: 'Verification failed. Please try again.' }, { status: 400 });
    }

    await resend.emails.send({
      from: 'SB Boat Charters <info@sbboatcharters.com>',
      to: 'garrick.gch@gmail.com',
      replyTo: email,
      subject: `New Charter Inquiry — ${oneLine(charter || 'General')} from ${oneLine(firstName)} ${oneLine(lastName || '')}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName || '')}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || '—')}</p>
        <p><strong>Charter Interest:</strong> ${escapeHtml(charter || '—')}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
      `,
    });

    // CRM sync runs after the response is sent; it never throws.
    after(() => syncContact({
      email, firstName, lastName, phone, tour: charter, source: SOURCES.CONTACT_FORM,
    }));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return Response.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
