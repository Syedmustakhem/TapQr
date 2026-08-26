import jwt, { SignOptions } from "jsonwebtoken";

import { env } from "../../config/env";

export interface JwtPayload {
  id: string;
  role: string;
}

/**
 * Generate access token
 */
export const generateAccessToken = (
  id: string,
  role: string
): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(
    {
      id,
      role,
    },
    env.JWT_SECRET,
    options
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (
  id: string
): string => {
  const options: SignOptions = {
    expiresIn:
      env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(
    {
      id,
    },
    env.JWT_REFRESH_SECRET,
    options
  );
};

/**
 * Verify access token
 */
export const verifyAccessToken = (
  token: string
): JwtPayload => {
  return jwt.verify(
    token,
    env.JWT_SECRET
  ) as JwtPayload;
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (
  token: string
): { id: string } => {
  return jwt.verify(
    token,
    env.JWT_REFRESH_SECRET
  ) as { id: string };
};