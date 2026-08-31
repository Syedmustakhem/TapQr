import axios, { AxiosError } from "axios";

import { env } from "../../config/env";
import { AppError } from "../../cores/errors/AppError";

export async function sendOtpWhatsapp(
  toPhoneE164: string,
  otp: string
): Promise<void> {
  /*
   * -------------------------------------------------------
   * Validate configuration
   * -------------------------------------------------------
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
   * -------------------------------------------------------
   * Validate phone number
   *
   * Input must already be E.164:
   *
   * +919121657235
   * +14155552671
   * +447911123456
   *
   * Meta API receives digits only.
   * -------------------------------------------------------
   */

  const normalizedPhone =
    toPhoneE164
      .trim()
      .replace(/[\s().-]/g, "");

  if (
    !/^\+[1-9]\d{6,14}$/.test(
      normalizedPhone
    )
  ) {
    console.error(
      "[WHATSAPP] Invalid E.164 phone number",
      {
        phone:
          normalizedPhone
            ? `${normalizedPhone.slice(0, 4)}******${normalizedPhone.slice(-2)}`
            : "empty",
      }
    );

    throw new AppError(
      "Invalid WhatsApp phone number.",
      400,
      "INVALID_WHATSAPP_PHONE"
    );
  }

  /*
   * Meta expects the number without "+"
   *
   * +919121657235
   * ->
   * 919121657235
   */

  const phone =
    normalizedPhone.slice(1);

  /*
   * -------------------------------------------------------
   * Meta Graph API
   * -------------------------------------------------------
   */

  const apiVersion =
    env.WHATSAPP_API_VERSION?.trim() ||
    "v19.0";

  const url =
    `https://graph.facebook.com/` +
    `${apiVersion}/` +
    `${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  /*
   * -------------------------------------------------------
   * WhatsApp Authentication Template
   *
   * Template:
   * freshlaa_otp_verification
   *
   * Language:
   * en
   *
   * OTP is supplied as body parameter #1.
   * -------------------------------------------------------
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
          env.WHATSAPP_OTP_TEMPLATE_LANG ||
          "en",
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

            Accept:
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

        template:
          env.WHATSAPP_OTP_TEMPLATE_NAME,

        apiVersion,
      }
    );
  } catch (error) {
    const axiosError =
      error as AxiosError<{
        error?: {
          type?: string;
          message?: string;
          code?: number;
          error_subcode?: number;
          error_data?: unknown;
        };
      }>;

    const metaError =
      axiosError.response?.data?.error;

    console.error(
      "[WHATSAPP] Meta API error",
      {
        status:
          axiosError.response?.status,

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

        template:
          env.WHATSAPP_OTP_TEMPLATE_NAME,

        apiVersion,
      }
    );

    throw new AppError(
      "Failed to send WhatsApp OTP. Please try again shortly.",
      502,
      "WHATSAPP_SEND_FAILED"
    );
  }
}