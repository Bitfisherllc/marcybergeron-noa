import nodemailer from "nodemailer";
import { CONTACT, LIVE_SITE_URL, SITE_NAME } from "@/lib/site";

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
};

export type MailingListSignupPayload = {
  name: string;
  email: string;
};

const DEFAULT_TEST_EMAIL = "bitfisherllc@gmail.com";

function envFlag(value: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function studioInboxEmail(): string {
  return CONTACT.email;
}

function contactTestEmail(): string {
  return process.env.CONTACT_TEST_EMAIL?.trim() || DEFAULT_TEST_EMAIL;
}

/** Recipients for public form notifications (studio inbox always; test copy optional). */
export function contactRecipients(): string[] {
  const owner = studioInboxEmail();
  const recipients = [owner];

  if (envFlag(process.env.CONTACT_TEST_EMAIL_ENABLED)) {
    const test = contactTestEmail();
    if (test && test.toLowerCase() !== owner.toLowerCase()) {
      recipients.push(test);
    }
  }

  return recipients;
}

function contactFromAddress(): string {
  const from = process.env.CONTACT_FROM_EMAIL?.trim();
  if (from) return from;
  const user = process.env.SMTP_USER?.trim();
  if (user) return `${SITE_NAME} <${user}>`;
  return SITE_NAME;
}

export function isContactEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

async function sendStudioMail(opts: { subject: string; text: string; replyTo?: string }): Promise<void> {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) return;

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT?.trim() || "587");

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transport.sendMail({
    from: contactFromAddress(),
    to: contactRecipients(),
    replyTo: opts.replyTo,
    subject: opts.subject,
    text: opts.text,
  });
}

export async function sendContactEmail(payload: ContactPayload): Promise<void> {
  await sendStudioMail({
    subject: `[${SITE_NAME}] Message from ${payload.name}`,
    replyTo: payload.email,
    text: [
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      "",
      payload.message,
      "",
      `View in admin: ${LIVE_SITE_URL}/admin/contact`,
    ].join("\n"),
  });
}

export async function sendMailingListSignupEmail(payload: MailingListSignupPayload): Promise<void> {
  await sendStudioMail({
    subject: `[${SITE_NAME}] Mailing list signup`,
    replyTo: payload.email,
    text: [
      `${payload.name || "Someone"} joined the mailing list.`,
      "",
      `Name: ${payload.name || "—"}`,
      `Email: ${payload.email}`,
      "",
      `View in admin: ${LIVE_SITE_URL}/admin/mailing-list`,
    ].join("\n"),
  });
}
