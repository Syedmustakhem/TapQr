import {
  Response,
  NextFunction,
} from "express";
import { AuthRequest } from "../auth/auth.types";
import { AppError } from "../../cores/errors/AppError";

/*
 * ============================================================
 * SUPER ADMIN GUARD
 * ============================================================
 *
 * Must run AFTER `authenticate`. Rejects everyone except
 * users with role SUPER_ADMIN.
 *
 * There is deliberately NO endpoint that grants SUPER_ADMIN —
 * the role is seeded directly in the database.
 */

export const requireSuperAdmin = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const role = req.user?.role;

  if (role !== "SUPER_ADMIN") {
    return next(
      new AppError(
        "Super admin access required.",
        403,
        "FORBIDDEN"
      )
    );
  }

  next();
};
