import axios from "axios";
import { env } from "../../config/env";

const OTP_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TapQR Email Verification</title>
  </head>

  <body
    style="
  margin:0;
  padding:0;
  background-color:#f4f6f8;
  font-family:Arial, Helvetica, sans-serif;
  color:#111827;
"
  >
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f8; padding:40px 15px;">
      <tr>
        <td align="center">
          <!-- Main Card -->
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="
            max-width:560px;
            background:#ffffff;
            border-radius:16px;
            border:1px solid #e5e7eb;
            overflow:hidden;
          "
          >
            <!-- Logo -->
            <tr>
              <td align="center" style="padding:35px 30px 25px;">
                <div
                  style="
                font-size:30px;
                font-weight:800;
                letter-spacing:-1px;
                color:#111827;
              "
                >
                  Tap<span style="color:#2563eb;">QR</span>
                </div>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:0 35px;">
                <div
                  style="
                height:1px;
                background:#e5e7eb;
              "
                ></div>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td align="center" style="padding:40px 35px 35px;">
                <!-- Icon -->
                <div
                  style="
                width:60px;
                height:60px;
                line-height:60px;
                margin:0 auto 22px;
                background:#eff6ff;
                border-radius:50%;
                font-size:28px;
                color:#2563eb;
              "
                >
                  ✉
                </div>

                <!-- Heading -->
                <h1
                  style="
                margin:0 0 15px;
                font-size:27px;
                line-height:36px;
                color:#111827;
              "
                >
                  Verify your email
                </h1>

                <!-- Greeting -->
                <p
                  style="
                margin:0 0 12px;
                font-size:16px;
                line-height:25px;
                color:#374151;
              "
                >
                  Hi <strong>{{{USER_NAME}}}</strong>,
                </p>

                <!-- Description -->
                <p
                  style="
                max-width:440px;
                margin:0 auto 28px;
                font-size:15px;
                line-height:25px;
                color:#6b7280;
              "
                >
                  Use the verification code below to verify your email address and continue setting up your TapQR
                  account.
                </p>

                <!-- OTP Box -->
                <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 25px;">
                  <tr>
                    <td
                      align="center"
                      style="
                      background:#f3f4f6;
                      border:1px solid #e5e7eb;
                      border-radius:12px;
                      padding:18px 30px;
                    "
                    >
                      <span
                        style="
                      font-size:36px;
                      line-height:42px;
                      font-weight:700;
                      letter-spacing:10px;
                      color:#111827;
                    "
                      >
                        {{{OTP}}}
                      </span>
                    </td>
                  </tr>
                </table>

                <!-- Expiry -->
                <p
                  style="
                margin:0 0 25px;
                font-size:13px;
                line-height:21px;
                color:#9ca3af;
              "
                >
                  This code will expire in
                  <strong style="color:#6b7280;"> {{{EXPIRY_MINUTES}}} minutes </strong>.
                </p>

                <!-- Security Notice -->
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="
                  background:#f9fafb;
                  border-radius:10px;
                "
                >
                  <tr>
                    <td
                      style="
                      padding:16px 18px;
                      text-align:left;
                      font-size:13px;
                      line-height:21px;
                      color:#6b7280;
                    "
                    >
                      <strong style="color:#374151;"> Security notice </strong>
                      <br />
                      Never share this verification code with anyone. TapQR will never ask you for your OTP.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer Divider -->
            <tr>
              <td style="padding:0 35px;">
                <div
                  style="
                height:1px;
                background:#e5e7eb;
              "
                ></div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding:25px 30px 30px;">
                <p
                  style="
                margin:0 0 7px;
                font-size:13px;
                color:#9ca3af;
              "
                >
                  © 2026 TapQR. All rights reserved.
                </p>

                <p
                  style="
                margin:0;
                font-size:12px;
                line-height:20px;
                color:#9ca3af;
              "
                >
                  This is an automated email from TapQR. Please do not reply to this email.
                </p>
              </td>
            </tr>
          </table>

          <!-- Bottom Text -->
          <p
            style="
          margin:18px 0 0;
          font-size:12px;
          color:#9ca3af;
        "
          >
            TapQR — Simple. Fast. Connected.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

function renderOtpEmailHtml(otp: string, userName: string, expiryMinutes = 5): string {
  return OTP_EMAIL_TEMPLATE
    .replace(/{{{OTP}}}/g, otp)
    .replace(/{{{USER_NAME}}}/g, userName)
    .replace(/{{{EXPIRY_MINUTES}}}/g, String(expiryMinutes));
}

function buildOtpEmailText(otp: string, userName: string): string {
  return `Hi ${userName},\n\nYour TapQR verification code is ${otp}\n\nIt expires in 5 minutes. If you didn't request this, you can ignore this email.`;
}

export async function sendOtpEmail(
  toEmail: string,
  otp: string,
  userName: string = "there"
): Promise<void> {
  await axios.post(
    "https://api.resend.com/emails",
    {
      from: env.EMAIL_FROM,
      to: toEmail,
      subject: `${otp} is your TapQR verification code`,
      html: renderOtpEmailHtml(otp, userName),
      text: buildOtpEmailText(otp, userName),
    },
    {
      headers: {
        Authorization: `Bearer ${env.EMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
}