import axios from "axios";

import { env } from "../../config/env";
import { AppError } from "../../cores/errors/AppError";

const RESEND_API_URL =
  "https://api.resend.com/emails";

const OTP_TEMPLATE_ID =
  "3d683be8-012e-4227-aa1e-6229b7002c94";

export async function sendOtpEmail(
  toEmail: string,
  otp: string,
  userName = "there"
): Promise<void> {
  /*
   * Configuration checks
   */
  if (!env.EMAIL_API_KEY?.trim()) {
    console.error(
      "[EMAIL] EMAIL_API_KEY is missing"
    );

    throw new AppError(
      "Email authentication is not configured.",
      500,
      "EMAIL_NOT_CONFIGURED"
    );
  }

  if (!env.EMAIL_FROM?.trim()) {
    console.error(
      "[EMAIL] EMAIL_FROM is missing"
    );

    throw new AppError(
      "Email sender is not configured.",
      500,
      "EMAIL_FROM_NOT_CONFIGURED"
    );
  }

  const payload = {
    from: env.EMAIL_FROM,

    to: [toEmail],

    template: {
      id: OTP_TEMPLATE_ID,

      variables: {
        USER_NAME: userName,
        OTP: otp,
        EXPIRY_MINUTES: "10",
      },
    },
  };

  try {
    const response =
      await axios.post(
        RESEND_API_URL,
        payload,
        {
          timeout: 15000,

          headers: {
            Authorization:
              `Bearer ${env.EMAIL_API_KEY}`,

            "Content-Type":
              "application/json",
          },
        }
      );

    console.log(
      "[EMAIL] OTP sent successfully",
      {
        to: toEmail,
        resendId:
          response.data?.id,
      }
    );
  } catch (error: any) {
    console.error(
      "[EMAIL] Resend API error",
      {
        status:
          error?.response?.status,

        data:
          error?.response?.data,

        message:
          error?.message,
      }
    );

    throw new AppError(
      "Failed to send email OTP. Please try again shortly.",
      502,
      "EMAIL_SEND_FAILED"
    );
  }
}