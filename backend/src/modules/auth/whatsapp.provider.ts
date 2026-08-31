import axios, { AxiosError } from "axios";

import { env } from "../../config/env";
import { AppError } from "../../cores/errors/AppError";

type MetaErrorResponse = {
  error?: {
    type?: string;
    message?: string;
    code?: number;
    error_subcode?: number;
    error_data?: unknown;
    fbtrace_id?: string;
  };
};

export async function sendOtpWhatsapp(
  toPhoneE164: string,
  otp: string
): Promise<void> {
  /*
   * -------------------------------------------------------
   * Validate configuration
   * -------------------------------------------------------
   */

  const accessToken =
    env.WHATSAPP_ACCESS_TOKEN?.trim();

  const phoneNumberId =
    env.WHATSAPP_PHONE_NUMBER_ID?.trim();

  const templateName =
    env.WHATSAPP_OTP_TEMPLATE_NAME?.trim();

  const templateLanguage =
    env.WHATSAPP_OTP_TEMPLATE_LANG?.trim() ||
    "en";

  const apiVersion =
    env.WHATSAPP_API_VERSION?.trim() ||
    "v19.0";

  if (!accessToken) {
    console.error(
      "[WHATSAPP] WHATSAPP_ACCESS_TOKEN is missing"
    );

    throw new AppError(
      "WhatsApp authentication is not configured.",
      500,
      "WHATSAPP_NOT_CONFIGURED"
    );
  }

  if (!phoneNumberId) {
    console.error(
      "[WHATSAPP] WHATSAPP_PHONE_NUMBER_ID is missing"
    );

    throw new AppError(
      "WhatsApp phone number is not configured.",
      500,
      "WHATSAPP_PHONE_NUMBER_NOT_CONFIGURED"
    );
  }

  if (!templateName) {
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
   * Validate OTP
   * -------------------------------------------------------
   */

  const normalizedOtp = String(otp).trim();

  if (!/^\d{6}$/.test(normalizedOtp)) {
    console.error("[WHATSAPP] Invalid OTP");

    throw new AppError(
      "Invalid verification code.",
      400,
      "INVALID_OTP"
    );
  }

  /*
   * -------------------------------------------------------
   * Validate international phone number
   *
   * Expected:
   * +919121657235
   * +14155552671
   * +447911123456
   *
   * E.164:
   * + followed by 7-15 digits
   * -------------------------------------------------------
   */

  const normalizedPhone = toPhoneE164
    .trim()
    .replace(/[\s().-]/g, "");

  if (!/^\+[1-9]\d{6,14}$/.test(normalizedPhone)) {
    console.error(
      "[WHATSAPP] Invalid E.164 phone number",
      {
        phone: normalizedPhone
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
   * Meta expects digits only.
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

  const url =
    `https://graph.facebook.com/${apiVersion}/` +
    `${phoneNumberId}/messages`;

  /*
   * -------------------------------------------------------
   * WhatsApp Authentication Template
   *
   * Template:
   * freshlaa_otp_verification
   *
   * Your Meta template contains:
   *
   * BODY
   * {{1}}
   *
   * BUTTON
   * Copy Code / URL style button
   *
   * The Meta logs showed:
   *
   * "Button at index 0 of type Url requires a parameter"
   *
   * Therefore we explicitly provide the button
   * parameter as well as the body parameter.
   * -------------------------------------------------------
   */

  const payload = {
    messaging_product: "whatsapp",

    recipient_type: "individual",

    to: phone,

    type: "template",

    template: {
      name: templateName,

      language: {
        code: templateLanguage,
      },

      components: [
        {
          type: "body",

          parameters: [
            {
              type: "text",
              text: normalizedOtp,
            },
          ],
        },

        {
          type: "button",

          sub_type: "url",

          index: "0",

          parameters: [
            {
              type: "text",
              text: normalizedOtp,
            },
          ],
        },
      ],
    },
  };

  /*
   * -------------------------------------------------------
   * Send
   * -------------------------------------------------------
   */

  try {
    const response =
      await axios.post(
        url,
        payload,
        {
          timeout: 15000,

          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },
        }
      );

    const messageId =
      response.data?.messages?.[0]?.id;

    console.log(
      "[WHATSAPP] OTP sent successfully",
      {
        phone:
          `${phone.slice(0, 3)}******${phone.slice(-2)}`,

        messageId,

        status:
          response.status,

        template:
          templateName,

        language:
          templateLanguage,

        apiVersion,
      }
    );
  } catch (error) {
    const axiosError =
      error as AxiosError<MetaErrorResponse>;

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

        fbtraceId:
          metaError?.fbtrace_id,

        phone:
          `${phone.slice(0, 3)}******${phone.slice(-2)}`,

        template:
          templateName,

        language:
          templateLanguage,

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