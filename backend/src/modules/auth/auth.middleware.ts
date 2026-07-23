import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth.types";
import { verifyAccessToken } from "./jwt";
import { AppError } from "../../cores/errors/AppError";

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(
      new AppError(
        "Authorization header is missing",
        401
      )
    );
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(
      new AppError(
        "Invalid authorization header",
        401
      )
    );
  }

  try {
    const decoded = verifyAccessToken(token);

    req.user = decoded;

    next();
  } catch {
    return next(
      new AppError(
        "Invalid or expired access token",
        401
      )
    );
  }
};