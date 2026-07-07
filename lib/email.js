import nodemailer from "nodemailer";
import { getDatabase } from "./mongodb";

export async function sendEmail({ to, subject, html, orderId }) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || "no-reply@fjord.com";

  let success = false;
  let errorMsg = null;

  console.log("\n=================== SENDING EMAIL ===================");
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Order ID: ${orderId || "N/A"}`);
  console.log("------------------- HTML CONTENT -------------------");
  console.log(html);
  console.log("====================================================\n");

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html,
      });

      console.log(`Email successfully sent via SMTP: ${info.messageId}`);
      success = true;
    } catch (err) {
      console.error("SMTP Email transmission failed:", err);
      errorMsg = err.message;
    }
  } else {
    console.log("SMTP not configured in env. Email simulation logged to console.");
    success = true; // Simulating successful dispatch
  }

  // Persist email logs in db
  try {
    const db = await getDatabase();
    await db.collection("sent_emails").insertOne({
      to,
      subject,
      html,
      orderId,
      sentAt: new Date(),
      success,
      error: errorMsg,
      smtpUsed: !!(smtpHost && smtpUser && smtpPass),
    });
  } catch (dbErr) {
    console.error("Failed to log sent email to database:", dbErr);
  }

  return { success, error: errorMsg };
}
