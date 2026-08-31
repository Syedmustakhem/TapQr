import axios from "axios";

import { env } from "../../config/env";
import { AppError } from "../../cores/errors/AppError";

export async function sendOtpWhatsapp(
  toPhoneE164: string,
  otp: string
): Promise<void> {
  /*
   * Validate configuration
   */
  if (!env.WHATSAPP_ACCESS_TOKEN?.trim()) {
    console.error(
      "[WHATSAPP] WHATSAPP_ACCESS_TOKEN is missing"
    );

    throw new AppError(
      "WhatsApp authentication is not configured.",
      500,
      "WHATSAPP_NOT_CONFIGURED"
    );
  }

  if (!env.WHATSAPP_PHONE_NUMBER_ID?.trim()) {
    console.error(
      "[WHATSAPP] WHATSAPP_PHONE_NUMBER_ID is missing"
    );

    throw new AppError(
      "WhatsApp phone number is not configured.",
      500,
      "WHATSAPP_PHONE_NUMBER_NOT_CONFIGURED"
    );
  }

  if (!env.WHATSAPP_OTP_TEMPLATE_NAME?.trim()) {
    console.error(
      "[WHATSAPP] WHATSAPP_OTP_TEMPLATE_NAME is missing"
    );

    throw new AppError(
      "WhatsApp OTP template is not configured.",
      500,
      "WHATSAPP_TEMPLATE_NOT_CONFIGURED"
    );
  }

  /*
   * E.164 -> digits only
   *
   * +919121657235
   * becomes
   * 919121657235
   *
   * This works internationally.
   */
  const phone = toPhoneE164.replace(/\D/g, "");

  if (!phone) {
    throw new AppError(
      "Invalid WhatsApp phone number.",
      400,
      "INVALID_WHATSAPP_PHONE"
    );
  }

  /*
   * Meta Graph API
   */
  const url =
    `https://graph.facebook.com/` +
    `${env.WHATSAPP_API_VERSION}/` +
    `${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  /*
   * Authentication template
   *
   * Your current template:
   * freshlaa_otp_verification
   *
   * Language:
   * en
   */
  const payload = {
    messaging_product: "whatsapp",

    recipient_type: "individual",

    to: phone,

    type: "template",

    template: {
      name:
        env.WHATSAPP_OTP_TEMPLATE_NAME,

      language: {
        code:
          env.WHATSAPP_OTP_TEMPLATE_LANG,
      },

      components: [
        {
          type: "body",

          parameters: [
            {
              type: "text",

              text: otp,
            },
          ],
        },
      ],
    },
  };

  try {
    const response =
      await axios.post(
        url,
        payload,
        {
          timeout: 15000,

          headers: {
            Authorization:
              `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,

            "Content-Type":
              "application/json",
          },
        }
      );

    console.log(
      "[WHATSAPP] OTP sent successfully",
      {
        phone:
          `${phone.slice(0, 3)}******${phone.slice(-2)}`,

        messageId:
          response.data?.messages?.[0]?.id,

        status:
          response.status,
      }
    );
  } catch (error: any) {
    const metaError =
      error?.response?.data?.error;

    console.error(
      "[WHATSAPP] Meta API error",
      {
        status:
          error?.response?.status,

        type:
          metaError?.type,

        code:
          metaError?.code,

        subcode:
          metaError?.error_subcode,

        message:
          metaError?.message,

        details:
          metaError?.error_data,

        phone:
          `${phone.slice(0, 3)}******${phone.slice(-2)}`,
      }
    );

    throw new AppError(
      "Failed to send WhatsApp OTP. Please try again shortly.",
      502,
      "WHATSAPP_SEND_FAILED"
    );
  }
}