import axios from "axios";
import { env } from "../../config/env";
import { AppError } from "../../cores/errors/AppError";

export async function sendOtpWhatsapp(toPhoneE164: string, otp: string): Promise<void> {
  const phone = toPhoneE164.replace("+", "");
  const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: env.WHATSAPP_OTP_TEMPLATE_NAME,
      language: { code: env.WHATSAPP_OTP_TEMPLATE_LANG },
      components: [{ type: "body", parameters: [{ type: "text", text: otp }] }],
    },
  };

  try {
    await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
  } catch (err: any) {
    console.error("[whatsapp] send failed:", err.response?.data?.error || err.message);
    throw new AppError("Failed to send WhatsApp OTP. Please try again shortly.", 502);
  }
}