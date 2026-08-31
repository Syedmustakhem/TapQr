import axios, {
  AxiosError,
} from "axios";

import { env } from "../../config/env";
import { AppError } from "../../cores/errors/AppError";

type ResendErrorResponse = {
  statusCode?: number;

  name?: string;

  message?: string;

  errors?: unknown;
};

export async function sendOtpEmail(
  email: string,
  otp: string,
  userName: string = "there"
): Promise<void> {
  /*
   * -------------------------------------------------------
   * Validate configuration
   * -------------------------------------------------------
   */

  const apiKey =
    env.EMAIL_API_KEY?.trim();

  const from =
    env.EMAIL_FROM?.trim();

  const templateId =
    env.RESEND_TEMPLATE_ID?.trim();

  if (!apiKey) {
    console.error(
      "[EMAIL] EMAIL_API_KEY is missing"
    );

    throw new AppError(
      "Email authentication is not configured.",
      500,
      "EMAIL_NOT_CONFIGURED"
    );
  }

  if (!from) {
    console.error(
      "[EMAIL] EMAIL_FROM is missing"
    );

    throw new AppError(
      "Email sender is not configured.",
      500,
      "EMAIL_FROM_NOT_CONFIGURED"
    );
  }

  if (!templateId) {
    console.error(
      "[EMAIL] RESEND_TEMPLATE_ID is missing"
    );

    throw new AppError(
      "Email OTP template is not configured.",
      500,
      "EMAIL_TEMPLATE_NOT_CONFIGURED"
    );
  }

  /*
   * -------------------------------------------------------
   * Validate email
   * -------------------------------------------------------
   */

  const normalizedEmail =
    email.trim().toLowerCase();

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      normalizedEmail
    )
  ) {
    throw new AppError(
      "Invalid email address.",
      400,
      "INVALID_EMAIL"
    );
  }

  /*
   * -------------------------------------------------------
   * Validate OTP
   * -------------------------------------------------------
   */

  const normalizedOtp =
    String(otp).trim();

  if (!/^\d{6}$/.test(normalizedOtp)) {
    throw new AppError(
      "Invalid verification code.",
      400,
      "INVALID_OTP"
    );
  }

  /*
   * -------------------------------------------------------
   * Resend template request
   *
   * IMPORTANT:
   *
   * DO NOT add:
   *
   * html
   * react
   * subject
   *
   * when using the Resend template.
   *
   * -------------------------------------------------------
   */

  const payload = {
    from,

    to: [
      normalizedEmail,
    ],

    template: {
      id: templateId,

      variables: {
        USER_NAME:
          userName?.trim() ||
          "there",

        OTP:
          normalizedOtp,

        EXPIRY_MINUTES:
          "10",
      },
    },
  };

  try {
    const response =
      await axios.post(
        "https://api.resend.com/emails",
        payload,
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

    console.log(
      "[EMAIL] OTP sent successfully",
      {
        email:
          `${normalizedEmail.slice(0, 3)}***@${normalizedEmail.split("@")[1]}`,

        messageId:
          response.data?.id,

        status:
          response.status,

        templateId,
      }
    );
  } catch (error) {
    const axiosError =
      error as AxiosError<ResendErrorResponse>;

    console.error(
      "[EMAIL] Resend API error",
      {
        status:
          axiosError.response?.status,

        data:
          axiosError.response?.data,

        message:
          axiosError.message,

        templateId,
      }
    );

    throw new AppError(
      "Unable to send verification email. Please try again shortly.",
      502,
      "EMAIL_SEND_FAILED"
    );
  }
}