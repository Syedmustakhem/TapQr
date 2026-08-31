import axios, { AxiosError } from "axios";

import { env } from "../../config/env";
import { AppError } from "../../cores/errors/AppError";

/**
 * Send TapQR email OTP using Resend template.
 *
 * Resend template:
 * RESEND_TEMPLATE_ID
 *
 * Required template variables:
 * - USER_NAME
 * - OTP
 * - EXPIRY_MINUTES
 */
export async function sendOtpEmail(
  toEmail: string,
  otp: string,
  userName: string = "there"
): Promise<void> {
  /*
   * -------------------------------------------------------
   * Validate configuration
   * -------------------------------------------------------
   */

  if (!env.EMAIL_API_KEY?.trim()) {
    console.error("[EMAIL] EMAIL_API_KEY is missing");

    throw new AppError(
      "Email authentication is not configured.",
      500,
      "EMAIL_NOT_CONFIGURED"
    );
  }

  if (!env.EMAIL_FROM?.trim()) {
    console.error("[EMAIL] EMAIL_FROM is missing");

    throw new AppError(
      "Email sender is not configured.",
      500,
      "EMAIL_FROM_NOT_CONFIGURED"
    );
  }

  if (!env.RESEND_TEMPLATE_ID?.trim()) {
    console.error("[EMAIL] RESEND_TEMPLATE_ID is missing");

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
    toEmail.trim().toLowerCase();

  if (
    !normalizedEmail ||
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

  if (!/^\d{6}$/.test(otp)) {
    console.error("[EMAIL] Invalid OTP generated", {
      otpLength: otp?.length,
    });

    throw new AppError(
      "Invalid verification code.",
      500,
      "INVALID_OTP"
    );
  }

  /*
   * -------------------------------------------------------
   * Resend API
   *
   * IMPORTANT:
   * Resend requires `subject` even when using
   * a stored template.
   * -------------------------------------------------------
   */

  const payload = {
    from: env.EMAIL_FROM,

    to: [normalizedEmail],

    subject: "Your TapQR verification code",

    template: {
      id: env.RESEND_TEMPLATE_ID,

      variables: {
        USER_NAME: userName || "there",
        OTP: otp,
        EXPIRY_MINUTES: "10",
      },
    },
  };

  try {
    const response = await axios.post(
      "https://api.resend.com/emails",
      payload,
      {
        timeout: 15000,

        headers: {
          Authorization:
            `Bearer ${env.EMAIL_API_KEY}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },
      }
    );

    /*
     * ---------------------------------------------------
     * Success
     * ---------------------------------------------------
     */

    console.log(
      "[EMAIL] OTP sent successfully",
      {
        email:
          `${normalizedEmail.slice(0, 3)}******` +
          `${normalizedEmail.slice(
            normalizedEmail.indexOf("@")
          )}`,

        messageId:
          response.data?.id,

        status:
          response.status,

        templateId:
          env.RESEND_TEMPLATE_ID,
      }
    );
  } catch (error) {
    const axiosError =
      error as AxiosError<{
        statusCode?: number;
        name?: string;
        message?: string;
        error?: unknown;
      }>;

    const resendError =
      axiosError.response?.data;

    /*
     * ---------------------------------------------------
     * Detailed server-side logging
     *
     * NEVER log:
     * - EMAIL_API_KEY
     * - OTP
     * ---------------------------------------------------
     */

    console.error(
      "[EMAIL] Resend API error",
      {
        status:
          axiosError.response?.status,

        statusCode:
          resendError?.statusCode,

        name:
          resendError?.name,

        message:
          resendError?.message,

        error:
          resendError?.error,

        templateId:
          env.RESEND_TEMPLATE_ID,

        email:
          `${normalizedEmail.slice(0, 3)}******` +
          `${normalizedEmail.slice(
            normalizedEmail.indexOf("@")
          )}`,
      }
    );

    /*
     * ---------------------------------------------------
     * Convert provider error to application error
     * ---------------------------------------------------
     */

    throw new AppError(
      "Failed to send email OTP. Please try again shortly.",
      502,
      "EMAIL_SEND_FAILED"
    );
  }
}