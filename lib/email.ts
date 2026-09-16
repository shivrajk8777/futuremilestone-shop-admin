import nodemailer from "nodemailer";
import { getDatabase } from "./mongodb";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  orderId?: string;
}

export interface SendEmailResult {
  success: boolean;
  error: string | null;
}

let sentEmailsIndexPromise: Promise<any> | undefined;

async function ensureSentEmailsIndex(collection: any) {
  if (!sentEmailsIndexPromise) {
    sentEmailsIndexPromise = collection
      .createIndex({ sentAt: 1 }, { expireAfterSeconds: 86400, name: "sentAt_ttl_24h" })
      .catch((err: any) => {
        console.error("Failed to ensure TTL index on sent_emails:", err);
      });
  }
  await sentEmailsIndexPromise;
}

export async function sendEmail({ to, subject, html, orderId }: SendEmailOptions): Promise<SendEmailResult> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || "no-reply@futuremilestone.com";

  let success = false;
  let errorMsg: string | null = null;

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
    } catch (err: any) {
      console.error("SMTP Email transmission failed:", err);
      errorMsg = err.message || String(err);
    }
  } else {
    console.log("SMTP not configured in env. Email simulation logged to console.");
    success = true; // Simulating successful dispatch
  }

  // Persist email logs in db (with 24h automatic TTL expiration)
  try {
    const db = await getDatabase();
    const collection = db.collection("sent_emails");
    await ensureSentEmailsIndex(collection);

    await collection.insertOne({
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
