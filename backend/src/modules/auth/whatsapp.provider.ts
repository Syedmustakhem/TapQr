import axios from "axios";

import { env } from "../../config/env";
import { AppError } from "../../cores/errors/AppError";

/**
 * Send an OTP through WhatsApp Cloud API.
 *
 * IMPORTANT:
 *
 * The phone number must already be normalized
 * into E.164 format:
 *
 * +14155552671
 * +919985478967
 * +447911123456
 *
 * We intentionally do not hard-code any country.
 */
export async function sendOtpWhatsapp(
  toPhoneE164: string,
  otp: string
): Promise<void> {
  if (
    !env.WHATSAPP_ACCESS_TOKEN
  ) {
    throw new AppError(
      "WhatsApp authentication is not configured.",
      500,
      "WHATSAPP_ACCESS_TOKEN_MISSING"
    );
  }

  if (
    !env.WHATSAPP_PHONE_NUMBER_ID
  ) {
    throw new AppError(
      "WhatsApp phone number is not configured.",
      500,
      "WHATSAPP_PHONE_NUMBER_ID_MISSING"
    );
  }

  if (
    !env.WHATSAPP_OTP_TEMPLATE_NAME
  ) {
    throw new AppError(
      "WhatsApp OTP template is not configured.",
      500,
      "WHATSAPP_TEMPLATE_MISSING"
    );
  }

  if (
    !env.WHATSAPP_OTP_TEMPLATE_LANG
  ) {
    throw new AppError(
      "WhatsApp OTP template language is not configured.",
      500,
      "WHATSAPP_TEMPLATE_LANGUAGE_MISSING"
    );
  }

  /**
   * E.164 validation.
   *
   * This supports international numbers.
   */
  if (
    !/^\+[1-9]\d{6,14}$/.test(
      toPhoneE164
    )
  ) {
    throw new AppError(
      "Invalid international phone number.",
      400,
      "INVALID_PHONE_NUMBER"
    );
  }

  /**
   * Meta expects the phone number
   * without the "+" in the `to` field.
   */
  const recipient =
    toPhoneE164.substring(1);

  const url =
    `https://graph.facebook.com/` +
    `${env.WHATSAPP_API_VERSION}/` +
    `${env.WHATSAPP_PHONE_NUMBER_ID}` +
    `/messages`;

  const payload = {
    messaging_product:
      "whatsapp",

    recipient_type:
      "individual",

    to: recipient,

    type:
      "template",

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
          headers: {
            Authorization:
              `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,

            "Content-Type":
              "application/json",
          },

          timeout: 15000,

          validateStatus:
            () => true,
        }
      );

    if (
      response.status < 200 ||
      response.status >= 300
    ) {
      console.error(
        "[TapQR][WhatsApp] Meta API rejected OTP:",
        {
          status:
            response.status,

          data:
            response.data,
        }
      );

      throw new AppError(
        "WhatsApp OTP could not be sent.",
        502,
        "WHATSAPP_SEND_FAILED"
      );
    }

    console.log(
      "[TapQR][WhatsApp] OTP accepted by Meta:",
      {
        status:
          response.status,

        messageId:
          response.data?.messages?.[0]?.id,
      }
    );
  } catch (
    error: any
  ) {
    if (
      error instanceof AppError
    ) {
      throw error;
    }

    console.error(
      "[TapQR][WhatsApp] Network/API error:",
      {
        message:
          error?.message,

        status:
          error?.response?.status,

        data:
          error?.response?.data,
      }
    );

    throw new AppError(
      "WhatsApp OTP service is temporarily unavailable.",
      502,
      "WHATSAPP_SERVICE_UNAVAILABLE"
    );
  }
}