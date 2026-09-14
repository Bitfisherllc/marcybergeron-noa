import nodemailer from "nodemailer";
import { CONTACT, LIVE_SITE_URL, SITE_NAME } from "@/lib/site";
import {
  contactReceiptHtml,
  contactReceiptSubject,
  contactReceiptText,
} from "@/lib/contactReceiptEmail";

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
};

export type MailingListSignupPayload = {
  name: string;
  email: string;
};

function envFlag(value: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function isGmailValue(value: string): boolean {
  return /gmail\.com/i.test(value);
}

function studioInboxEmail(): string {
  return CONTACT.email;
}

/** Microsoft 365 mailbox that sends and receives studio form mail. */
function smtpUser(): string {
  const user = process.env.SMTP_USER?.trim();
  if (user && !isGmailValue(user)) return user;
  return studioInboxEmail();
}

function smtpHost(): string {
  const host = process.env.SMTP_HOST?.trim();
  if (host && !isGmailValue(host)) return host;
  return "smtp.office365.com";
}

function smtpPass(): string {
  const pass = process.env.SMTP_PASS?.trim() ?? "";
  if (!pass) return "";
  const lower = pass.toLowerCase();
  if (lower.includes("gmail") || lower === "your_gmail_app_password" || lower === "change-me") return "";
  return pass;
}

function contactTestEmail(): string {
  return process.env.CONTACT_TEST_EMAIL?.trim() || "";
}

/** Recipients: studio Microsoft 365 inbox. Optional extra copy must not be Gmail. */
export function contactRecipients(): string[] {
  const owner = studioInboxEmail();
  const recipients = [owner];

  if (envFlag(process.env.CONTACT_TEST_EMAIL_ENABLED)) {
    const test = contactTestEmail();
    if (test && test.toLowerCase() !== owner.toLowerCase() && !isGmailValue(test)) {
      recipients.push(test);
    }
  }

  return recipients;
}

function contactFromAddress(): string {
  const from = process.env.CONTACT_FROM_EMAIL?.trim();
  if (from && !isGmailValue(from)) return from;
  return `${SITE_NAME} <${smtpUser()}>`;
}

export function isContactEmailConfigured(): boolean {
  return Boolean(smtpPass());
}

function createTransport() {
  const user = smtpUser();
  const pass = smtpPass();
  if (!pass) return null;

  const host = smtpHost();
  const port = Number(process.env.SMTP_PORT?.trim() || "587");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
  });
}

async function sendStudioMail(opts: { subject: string; text: string; replyTo?: string }): Promise<void> {
  const transport = createTransport();
  if (!transport) return;

  await transport.sendMail({
    from: contactFromAddress(),
    to: contactRecipients(),
    replyTo: opts.replyTo,
    subject: opts.subject,
    text: opts.text,
  });
}

export async function sendContactEmail(payload: ContactPayload): Promise<void> {
  const transport = createTransport();
  if (!transport) return;

  const from = contactFromAddress();
  await transport.sendMail({
    from,
    to: contactRecipients(),
    replyTo: payload.email,
    subject: `[${SITE_NAME}] Message from ${payload.name}`,
    text: [
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      "",
      payload.message,
      "",
      `View in admin: ${LIVE_SITE_URL}/admin/contact`,
    ].join("\n"),
  });

  await transport.sendMail({
    from,
    to: payload.email,
    replyTo: CONTACT.email,
    subject: contactReceiptSubject(),
    text: contactReceiptText(payload),
    html: contactReceiptHtml(payload),
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
