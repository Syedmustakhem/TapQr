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

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: [env.GOOGLE_CLIENT_ID_WEB, env.GOOGLE_CLIENT_ID_ANDROID].filter(
        Boolean
      ) as string[],
    });
  } catch {
    throw new AppError("Invalid Google token", 401);
  }

  const payload = ticket.getPayload();

  if (!payload || !payload.email_verified) {
    throw new AppError("Google account email is not verified", 401);
  }

  return {
    googleId: payload.sub,
    email: payload.email as string,
    name: payload.name || (payload.email as string).split("@")[0],
    avatarUrl: payload.picture || null,
  };
}