import axios from "axios";

import { env } from "../../config/env";
import { AppError } from "../../cores/errors/AppError";

/**
 * Resend production template.
 *
 * This template must be published in Resend.
 */
const RESEND_TEMPLATE_ID =
  "3d683be8-012e-4227-aa1e-6229b7002c94";

const RESEND_API_URL =
  "https://api.resend.com/emails";

export async function sendOtpEmail(
  toEmail: string,
  otp: string,
  userName: string = "there"
): Promise<void> {
  if (
    !env.EMAIL_API_KEY
  ) {
    throw new AppError(
      "Email service is not configured.",
      500,
      "EMAIL_API_KEY_MISSING"
    );
  }

  if (
    !env.EMAIL_FROM
  ) {
    throw new AppError(
      "Email sender is not configured.",
      500,
      "EMAIL_FROM_MISSING"
    );
  }

  const normalizedEmail =
    toEmail
      .trim()
      .toLowerCase();

  const payload = {
    from:
      env.EMAIL_FROM,

    to: [
      normalizedEmail,
    ],

    template: {
      id:
        RESEND_TEMPLATE_ID,

      variables: {
        USER_NAME:
          userName,

        OTP:
          otp,

        EXPIRY_MINUTES:
          "10",
      },
    },
  };

  try {
    const response =
      await axios.post(
        RESEND_API_URL,

        payload,

        {
          headers: {
            Authorization:
              `Bearer ${env.EMAIL_API_KEY}`,

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
        "[TapQR][Email] Resend rejected OTP:",
        {
          status:
            response.status,

          data:
            response.data,
        }
      );

      throw new AppError(
        "Email OTP could not be sent.",
        502,
        "EMAIL_SEND_FAILED"
      );
    }

    console.log(
      "[TapQR][Email] OTP accepted by Resend:",
      {
        status:
          response.status,

        id:
          response.data?.id,
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
      "[TapQR][Email] Resend API error:",
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
      "Email OTP service is temporarily unavailable.",
      502,
      "EMAIL_SERVICE_UNAVAILABLE"
    );
  }
}