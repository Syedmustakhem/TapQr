import { OAuth2Client } from "google-auth-library";

import { env } from "../../config/env";
import { AppError } from "../../cores/errors/AppError";

const client = new OAuth2Client();

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

/**
 * Verify a Google ID token issued for an approved
 * TapQR Web or Android OAuth client.
 */
export async function verifyGoogleIdToken(
  idToken: string
): Promise<GoogleProfile> {
  if (!idToken?.trim()) {
    throw new AppError(
      "Google ID token is required",
      401,
      "GOOGLE_TOKEN_MISSING"
    );
  }

  const allowedClientIds = [
    env.GOOGLE_CLIENT_ID_WEB,
    env.GOOGLE_CLIENT_ID_ANDROID,
  ].filter(
    (clientId): clientId is string =>
      Boolean(clientId?.trim())
  );

  if (allowedClientIds.length === 0) {
    console.error(
      "TapQR: No Google OAuth client IDs configured."
    );

    throw new AppError(
      "Google authentication is not configured",
      500,
      "GOOGLE_AUTH_NOT_CONFIGURED"
    );
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken.trim(),
      audience: allowedClientIds,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new AppError(
        "Invalid Google token",
        401,
        "INVALID_GOOGLE_TOKEN"
      );
    }

    if (!payload.sub) {
      throw new AppError(
        "Google account ID is missing",
        401,
        "GOOGLE_ID_MISSING"
      );
    }

    if (!payload.email) {
      throw new AppError(
        "Google account email is missing",
        401,
        "GOOGLE_EMAIL_MISSING"
      );
    }

    if (payload.email_verified !== true) {
      throw new AppError(
        "Google account email is not verified",
        401,
        "GOOGLE_EMAIL_NOT_VERIFIED"
      );
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase().trim(),
      name:
        payload.name?.trim() ||
        payload.email.split("@")[0],
      avatarUrl: payload.picture || null,
    };
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.error(
      "TapQR Google token verification failed:",
      message
    );

    throw new AppError(
      "Invalid Google token",
      401,
      "INVALID_GOOGLE_TOKEN"
    );
  }
}