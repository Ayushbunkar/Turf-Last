import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text, html, attachments }) => {
  // normalize `to` so callers can pass user objects, arrays or plain emails
  const resolveRecipient = (r) => {
    if (!r) return null;
    if (Array.isArray(r)) return r.join(',');
    if (typeof r === 'string') return r;
    // assume it's a user-like object
    if (typeof r === 'object') return r.email || r.to || null;
    return null;
  };

  const recipient = resolveRecipient(to);
  if (!recipient) {
    console.warn('sendEmail: no recipient provided, skipping send. payload:', { subject, text });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Turf Marketplace" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject,
      text,
      html,
    };
    if (attachments) mailOptions.attachments = attachments;
    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully to", recipient);
  } catch (error) {
    console.error("Email failed:", error);
  }
};
