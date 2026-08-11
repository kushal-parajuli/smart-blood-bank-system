// src/services/emailService.js
//
// Wraps Nodemailer so the rest of the app just calls sendEmail(...) without
// caring how/whether it's actually delivered.
//
// IMPORTANT for local development: real email sending requires SMTP
// credentials (e.g. a Gmail App Password, or a service like Mailtrap/SendGrid)
// in your .env — which you likely don't have set up yet. Rather than
// crashing every feature that sends an email, this service checks if
// EMAIL_HOST/EMAIL_USER/EMAIL_PASS are present in .env; if not, it just
// logs what WOULD have been sent to the console. This means you can build
// and test the appointment reminder / donor nudge features right now,
// and later — when you do add real SMTP credentials — nothing else in
// the codebase needs to change, only .env.

const nodemailer = require("nodemailer");

const isConfigured = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 */
async function sendEmail(to, subject, text) {
  if (!isConfigured) {
    console.log(
      `[emailService] SMTP not configured — email NOT actually sent. Would have sent:\n  To: ${to}\n  Subject: ${subject}\n  Body: ${text}`
    );
    return { sent: false, reason: "SMTP not configured" };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    return { sent: true };
  } catch (err) {
    // Deliberately does NOT throw — a failed email should never crash
    // the feature that triggered it (e.g. a nudge should still be
    // recorded even if the email bounces). Caller can check `sent`.
    console.error("[emailService] Failed to send email:", err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendEmail };