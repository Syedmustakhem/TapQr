import axios from "axios";
import { env } from "../../config/env";

export async function sendOtpEmail(toEmail: string, otp: string): Promise<void> {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Your TapQR verification code</h2>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
      <p>This code expires in 5 minutes. If you didn't request this, ignore this email.</p>
    </div>
  `;

  await axios.post(
    "https://api.resend.com/emails",
    {
      from: env.EMAIL_FROM,
      to: toEmail,
      subject: `${otp} is your TapQR verification code`,
      html,
    },
    {
      headers: {
        Authorization: `Bearer ${env.EMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
}