import {
  PublishNotificationInput,
} from "./notifications.types";

export function buildNotificationEmail(
  input: PublishNotificationInput
) {
  const safeTitle =
    escapeHtml(input.title);

  const safeMessage =
    escapeHtml(input.message);

  const action =
    input.actionUrl
      ? `
        <p style="margin:24px 0 0;">
          <a
            href="${escapeHtml(input.actionUrl)}"
            style="
              display:inline-block;
              padding:11px 16px;
              border-radius:9px;
              background:#0f172a;
              color:#fff;
              text-decoration:none;
              font-weight:700;
              font-size:13px;
            "
          >
            Open TapQR
          </a>
        </p>
      `
      : "";

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:600px;margin:32px auto;padding:24px;">
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:28px;">
            <div style="font-size:22px;font-weight:800;">
              Tap<span style="color:#2563eb;">QR</span>
            </div>

            <h1 style="margin:24px 0 8px;font-size:22px;">
              ${safeTitle}
            </h1>

            <p style="margin:0;color:#64748b;font-size:14px;line-height:1.7;">
              ${safeMessage}
            </p>

            ${action}

            <p style="margin:28px 0 0;color:#94a3b8;font-size:11px;">
              This notification was sent by TapQR.
            </p>
          </div>
        </div>
      </body>
    </html>
  `.trim();

  return {
    subject: input.title,
    text:
      input.actionUrl
        ? `${input.message}\n\nOpen TapQR: ${input.actionUrl}`
        : input.message,
    html,
  };
}

function escapeHtml(
  value: string
) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
