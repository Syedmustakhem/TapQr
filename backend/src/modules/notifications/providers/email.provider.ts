import axios, { AxiosError } from "axios";

import { env } from "../../../config/env";
import { AppError } from "../../../cores/errors/AppError";

export interface NotificationEmailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface NotificationEmailResult {
  providerMessageId?: string;
  providerResponse?: unknown;
}

function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new AppError(
      "Invalid notification email address.",
      400,
      "INVALID_NOTIFICATION_EMAIL"
    );
  }

  return email;
}

/**
 * Generic Resend provider for application notifications.
 *
 * This is intentionally separate from the existing OTP sender.
 * OTP template logic stays in the auth module.
 */
export async function sendNotificationEmail(
  input: NotificationEmailInput
): Promise<NotificationEmailResult> {
  const apiKey =
    env.EMAIL_API_KEY?.trim();

  const from =
    env.EMAIL_FROM?.trim();

  if (!apiKey) {
    throw new AppError(
      "Email notification delivery is not configured.",
      500,
      "EMAIL_NOTIFICATION_NOT_CONFIGURED"
    );
  }

  if (!from) {
    throw new AppError(
      "Email sender is not configured.",
      500,
      "EMAIL_FROM_NOT_CONFIGURED"
    );
  }

  const to =
    normalizeEmail(input.to);

  const subject =
    input.subject.trim();

  if (!subject) {
    throw new AppError(
      "Notification email subject is required.",
      400,
      "EMAIL_SUBJECT_REQUIRED"
    );
  }

  try {
    const response =
      await axios.post(
        "https://api.resend.com/emails",
        {
          from,
          to: [to],
          subject,
          text: input.text,
          html: input.html,
        },
        {
          timeout: 15000,
          headers: {
            Authorization:
              `Bearer ${apiKey}`,
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
        }
      );

    return {
      providerMessageId:
        response.data?.id,
      providerResponse:
        response.data,
    };
  } catch (error) {
    const axiosError =
      error as AxiosError<{
        statusCode?: number;
        name?: string;
        message?: string;
      }>;

    const providerError =
      axiosError.response?.data;

    console.error(
      "[NOTIFICATION][EMAIL] Resend delivery failed",
      {
        status:
          axiosError.response?.status,
        statusCode:
          providerError?.statusCode,
        name:
          providerError?.name,
        message:
          providerError?.message,
      }
    );

    throw new AppError(
      "Notification email delivery failed.",
      502,
      "EMAIL_NOTIFICATION_SEND_FAILED"
    );
  }
}
