import axios, { AxiosError } from "axios";

import { env } from "../../../config/env";
import { AppError } from "../../../cores/errors/AppError";

export interface NotificationWhatsAppInput {
  toPhoneE164: string;
  recipientName: string;
  message: string;
}

export interface NotificationWhatsAppResult {
  providerMessageId?: string;
  providerResponse?: unknown;
}

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

function normalizePhone(value: string) {
  const phone = value.trim().replace(/[\s().-]/g, "");

  if (!/^\+[1-9]\d{6,14}$/.test(phone)) {
    throw new AppError(
      "Invalid WhatsApp phone number.",
      400,
      "INVALID_NOTIFICATION_WHATSAPP_PHONE"
    );
  }

  return phone.slice(1);
}

/**
 * Sends the currently approved TapQR Utility template:
 *
 * tapqr_security_alert
 *   {{1}} -> recipient name
 *   {{2}} -> security/account notification message
 *
 * The template's URL button is configured in Meta and therefore
 * does not need a body parameter here.
 */
export async function sendNotificationWhatsApp(
  input: NotificationWhatsAppInput
): Promise<NotificationWhatsAppResult> {
  const accessToken = env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const templateName =
    env.WHATSAPP_NOTIFICATION_TEMPLATE_NAME?.trim();
  const templateLanguage =
    env.WHATSAPP_NOTIFICATION_TEMPLATE_LANG?.trim() || "en_US";
  const apiVersion =
    env.WHATSAPP_API_VERSION?.trim() || "v19.0";

  if (!accessToken) {
    throw new AppError(
      "WhatsApp notification delivery is not configured.",
      500,
      "WHATSAPP_NOTIFICATION_NOT_CONFIGURED"
    );
  }

  if (!phoneNumberId) {
    throw new AppError(
      "WhatsApp phone number is not configured.",
      500,
      "WHATSAPP_PHONE_NUMBER_NOT_CONFIGURED"
    );
  }

  if (!templateName) {
    throw new AppError(
      "WhatsApp notification template is not configured.",
      500,
      "WHATSAPP_NOTIFICATION_TEMPLATE_NOT_CONFIGURED"
    );
  }

  const phone = normalizePhone(input.toPhoneE164);
  const recipientName = input.recipientName.trim() || "there";
  const message = input.message.trim();

  if (!message) {
    throw new AppError(
      "Notification message is required.",
      400,
      "WHATSAPP_NOTIFICATION_MESSAGE_REQUIRED"
    );
  }

  const url =
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  try {
    const response = await axios.post(
      url,
      {
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
                  text: recipientName,
                },
                {
                  type: "text",
                  text: message,
                },
              ],
            },
          ],
        },
      },
      {
        timeout: 15_000,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    return {
      providerMessageId: response.data?.messages?.[0]?.id,
      providerResponse: response.data,
    };
  } catch (error) {
    const axiosError = error as AxiosError<MetaErrorResponse>;
    const metaError = axiosError.response?.data?.error;

    console.error("[NOTIFICATION][WHATSAPP] Meta delivery failed", {
      status: axiosError.response?.status,
      type: metaError?.type,
      code: metaError?.code,
      subcode: metaError?.error_subcode,
      message: metaError?.message,
      fbtraceId: metaError?.fbtrace_id,
    });

    throw new AppError(
      metaError?.message || "Notification WhatsApp delivery failed.",
      502,
      "WHATSAPP_NOTIFICATION_SEND_FAILED"
    );
  }
}
