import { Router } from "express";

import { AuthController } from "./auth.controller";
import { authenticate } from "./auth.middleware";

import { validate } from "../../cores/middleware/validate";
import { authLimiter } from "../../cores/middleware/rateLimiter";

import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "./auth.validation";

const router = Router();

const authController = new AuthController();

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  authController.login
);

router.post(
  "/refresh",
  validate(refreshSchema),
  authController.refresh
);

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  authenticate,
  authController.me
);

router.post(
  "/logout",
  authenticate,
  authController.logout
);

export default router;