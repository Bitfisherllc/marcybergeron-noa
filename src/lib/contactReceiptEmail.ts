import { CONTACT, LIVE_SITE_URL, SITE_NAME } from "@/lib/site";

export type ContactReceiptPayload = {
  name: string;
  email: string;
  message: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMessageHtml(message: string): string {
  return escapeHtml(message).replace(/\r\n|\r|\n/g, "<br>");
}

function buttonHtml(href: string, label: string, filled = false): string {
  const background = filled ? "#1f1f1f" : "#faf8f5";
  const color = filled ? "#faf8f5" : "#1f1f1f";
  return `
    <a href="${href}" target="_blank" style="display:inline-block;margin:0 8px 8px 0;padding:12px 18px;border:1px solid #1f1f1f;background:${background};color:${color};font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.16em;text-decoration:none;text-transform:uppercase;">
      ${label}
    </a>`;
}

export function contactReceiptSubject(): string {
  return `Thank you for writing to ${SITE_NAME}`;
}

export function contactReceiptText(payload: ContactReceiptPayload): string {
  return [
    `Thank you, ${payload.name}.`,
    "",
    "Your note is on its way to the studio. Marcy will read it and reply as soon as she can—usually by email, to the address you shared.",
    "",
    "Your message",
    payload.message,
    "",
    "Studio",
    `Email: ${CONTACT.email}`,
    `Phone: ${CONTACT.phone}`,
    ...CONTACT.studioLines,
    "",
    `Website: ${LIVE_SITE_URL}`,
    `Portfolio: ${LIVE_SITE_URL}/medium`,
    `Contact: ${LIVE_SITE_URL}/contact`,
  ].join("\n");
}

export function contactReceiptHtml(payload: ContactReceiptPayload): string {
  const firstName = payload.name.split(/\s+/)[0] || payload.name;
  const messageHtml = formatMessageHtml(payload.message);
  const home = LIVE_SITE_URL;
  const phoneHref = `tel:${CONTACT.phone.replace(/\s/g, "")}`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Thank you</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f0ea;color:#1f1f1f;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f0ea;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#faf8f5;border:1px solid rgba(31,31,31,0.12);">
            <tr>
              <td style="padding:36px 40px 24px;border-bottom:1px solid rgba(31,31,31,0.12);">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#6b6b6b;">Message received</p>
                <h1 style="margin:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:normal;letter-spacing:-0.02em;line-height:1.15;color:#1f1f1f;">Thank you</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px 8px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.55;color:#1f1f1f;">
                Dear ${escapeHtml(firstName)},
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#6b6b6b;">
                Your note is on its way to the studio. Marcy will read it and reply as soon as she can—usually by email, to
                <a href="mailto:${escapeHtml(payload.email)}" style="color:#1f1f1f;text-decoration:underline;">${escapeHtml(payload.email)}</a>.
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 32px;">
                <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b6b6b;">Your message</p>
                <div style="padding:18px 20px;border:1px solid rgba(31,31,31,0.12);background:#fff;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#1f1f1f;">
                  ${messageHtml}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 12px;">
                <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b6b6b;">Studio</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1f1f1f;">
                      <span style="display:block;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#6b6b6b;">Email</span>
                      <a href="mailto:${CONTACT.email}" style="color:#1f1f1f;text-decoration:none;">${CONTACT.email}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1f1f1f;">
                      <span style="display:block;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#6b6b6b;">Phone</span>
                      <a href="${phoneHref}" style="color:#1f1f1f;text-decoration:none;">${CONTACT.phone}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1f1f1f;">
                      <span style="display:block;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#6b6b6b;">Studio</span>
                      ${CONTACT.studioLines.map((line) => escapeHtml(line)).join("<br>")}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px 36px;">
                ${buttonHtml(home, "Visit the website", true)}
                ${buttonHtml(`${home}/medium`, "Portfolio")}
                ${buttonHtml(`${home}/contact`, "Contact")}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 40px 28px;border-top:1px solid rgba(31,31,31,0.12);font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6b6b6b;">
                ${SITE_NAME}<br>
                Abstract paintings and series-based work. Studio at Porter Mill, Beverly, Massachusetts.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
