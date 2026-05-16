import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { firstName, lastName, email, phone, charter, message } = await request.json();

    if (!firstName || !email || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await resend.emails.send({
      from: 'SB Boat Charters <info@sbboatcharters.com>',
      to: 'garrick.gch@gmail.com',
      replyTo: email,
      subject: `New Charter Inquiry — ${charter || 'General'} from ${firstName} ${lastName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || '—'}</p>
        <p><strong>Charter Interest:</strong> ${charter || '—'}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br />')}</p>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return Response.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
