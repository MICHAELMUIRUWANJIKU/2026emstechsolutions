const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

function generateReference() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `EMS-${year}-${rand}`;
}

function escape(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function validatePayload(body) {
  const errors = [];
  if (!body.name || body.name.trim().length < 2) errors.push('Name is required');
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(body.email)) errors.push('Valid email is required');
  if (!body.phone || body.phone.trim().length < 7) errors.push('Phone is required');
  if (!body.details || body.details.trim().length < 5) errors.push('Project details are required');
  if (!Array.isArray(body.services) || body.services.length === 0) errors.push('At least one service is required');
  return errors;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const errors = validatePayload(body);
    if (errors.length) return res.status(400).json({ error: errors.join(', ') });

    const reference = generateReference();
    const submittedVia = (body.submitted_via || 'unknown').toLowerCase();

    const { data, error: dbError } = await supabase
      .from('bookings')
      .insert({
        reference,
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim(),
        business: (body.business || '').trim() || null,
        services: body.services,
        budget: body.budget || null,
        timeline: body.timeline || null,
        existing_site: body.existing_site || null,
        reference_sites: body.reference_sites || null,
        details: body.details.trim(),
        contact_pref: body.contact_pref || 'WhatsApp',
        submitted_via: submittedVia,
        status: 'new'
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
      return res.status(500).json({ error: 'Could not save your enquiry. Please try WhatsApp directly.' });
    }

    const servicesList = (body.services || []).join(', ');
    const clientFirstName = body.name.split(/\s+/)[0];

    const adminHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;">
        <div style="background:linear-gradient(135deg,#1e40af,#0ea5e9);color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:18px;">New Booking Enquiry</h1>
          <p style="margin:6px 0 0;opacity:.9;font-size:13px;">Ref: <strong>${escape(reference)}</strong></p>
        </div>
        <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#6b7280;width:140px;">Name</td><td style="padding:8px 0;color:#111827;font-weight:600;">${escape(body.name)}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;">Phone</td><td style="padding:8px 0;color:#111827;font-weight:600;">${escape(body.phone)}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;color:#111827;font-weight:600;">${escape(body.email)}</td></tr>
            ${body.business ? `<tr><td style="padding:8px 0;color:#6b7280;">Business</td><td style="padding:8px 0;color:#111827;">${escape(body.business)}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#6b7280;">Services</td><td style="padding:8px 0;color:#111827;font-weight:600;">${escape(servicesList)}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;">Budget</td><td style="padding:8px 0;color:#111827;">${escape(body.budget || 'Not specified')}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;">Timeline</td><td style="padding:8px 0;color:#111827;">${escape(body.timeline || 'Not specified')}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;">Contact pref</td><td style="padding:8px 0;color:#111827;">${escape(body.contact_pref || 'WhatsApp')}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;">Submitted via</td><td style="padding:8px 0;color:#111827;">${escape(submittedVia)}</td></tr>
          </table>
          <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;">
            <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Project details</p>
            <p style="margin:0;color:#111827;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escape(body.details)}</p>
          </div>
          <div style="margin-top:24px;">
            <a href="https://wa.me/254${body.phone.replace(/\D/g,'').replace(/^0/,'')}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Reply on WhatsApp</a>
            <a href="mailto:${escape(body.email)}" style="display:inline-block;background:#1e40af;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-left:8px;">Reply by Email</a>
          </div>
        </div>
        <p style="text-align:center;color:#9ca3af;font-size:11px;margin:16px 0 0;">Received ${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })} EAT</p>
      </div>
    `;

    const clientHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;">
        <div style="background:linear-gradient(135deg,#1e40af,#0ea5e9);color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="margin:0;font-size:20px;">Thank you, ${escape(clientFirstName)}!</h1>
          <p style="margin:8px 0 0;opacity:.9;font-size:14px;">We've received your enquiry</p>
        </div>
        <div style="background:#fff;padding:28px 24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">Thank you for reaching out to <strong>EM'S Tech Solutions Kenya</strong>. We've got your enquiry and one of our team members will get back to you shortly — usually within a few hours during working hours (Mon–Sat, 8am–8pm).</p>

          <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0 0 12px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Your reference number</p>
            <p style="margin:0;color:#1e40af;font-size:18px;font-weight:700;font-family:'Courier New',monospace;">${escape(reference)}</p>
            <p style="margin:8px 0 0;color:#6b7280;font-size:12px;">Keep this handy if you need to follow up.</p>
          </div>

          <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;">
            <p style="margin:0 0 12px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">A summary of what you told us</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:6px 0;color:#6b7280;width:120px;">Services</td><td style="padding:6px 0;color:#111827;">${escape(servicesList)}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Budget</td><td style="padding:6px 0;color:#111827;">${escape(body.budget || 'Not specified')}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Timeline</td><td style="padding:6px 0;color:#111827;">${escape(body.timeline || 'Not specified')}</td></tr>
            </table>
          </div>

          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;">
            <p style="margin:0 0 12px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">Need to reach us sooner?</p>
            <a href="https://wa.me/254795716730" style="display:inline-block;background:#25D366;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">WhatsApp us</a>
            <a href="tel:+254795716730" style="display:inline-block;background:#1e40af;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-left:8px;">Call 0795 716 730</a>
          </div>

          <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">Warm regards,<br><strong style="color:#111827;">EM'S Tech Solutions Kenya</strong><br>Kimbo, Ruiru · Kenya<br><a href="mailto:michaelkey394@gmail.com" style="color:#1e40af;">michaelkey394@gmail.com</a></p>
        </div>
        <p style="text-align:center;color:#9ca3af;font-size:11px;margin:16px 0 0;">This is an automated confirmation. You can reply directly to this email.</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"EM'S Tech Website" <${process.env.GMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        replyTo: body.email,
        subject: `New Booking — ${servicesList.slice(0, 50)}${servicesList.length > 50 ? '…' : ''} — ${body.name}`,
        html: adminHtml
      });
    } catch (mailErr) {
      console.error('Admin email error:', mailErr);
    }

    try {
      await transporter.sendMail({
        from: `"EM'S Tech Solutions Kenya" <${process.env.GMAIL_USER}>`,
        to: body.email,
        replyTo: process.env.GMAIL_USER,
        subject: `Thank you ${clientFirstName} — we've received your enquiry (${reference})`,
        html: clientHtml
      });
    } catch (mailErr) {
      console.error('Client email error:', mailErr);
    }

    return res.status(200).json({ success: true, reference, message: 'Enquiry received' });

  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try WhatsApp directly.' });
  }
};