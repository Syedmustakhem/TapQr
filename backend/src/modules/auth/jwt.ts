import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export interface JwtPayload {
  id: string;
  role: string;
}

export const generateAccessToken = (
  id: string,
  role: string
) => {
  return jwt.sign(
    { id, role },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
    }
  );
};

export const generateRefreshToken = (
  id: string
) => {
  return jwt.sign(
    { id },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    }
  );
};

export const verifyAccessToken = (
  token: string
) => {
  return jwt.verify(
    token,
    env.JWT_SECRET
  ) as JwtPayload;
};

export const verifyRefreshToken = (
  token: string
) => {
  return jwt.verify(
    token,
    env.JWT_REFRESH_SECRET
  ) as { id: string };
};