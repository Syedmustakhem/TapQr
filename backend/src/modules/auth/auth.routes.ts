import { Router } from "express";

import { AuthController } from "./auth.controller";
import { authenticate } from "./auth.middleware";

import { validate } from "../../cores/middleware/validate";
import { authLimiter } from "../../cores/middleware/rateLimiter";

import {
  registerSchema,
  loginSchema,
  refreshSchema,
  sendEmailOtpSchema,
  verifyEmailOtpSchema,
  sendWhatsappOtpSchema,
  verifyWhatsappOtpSchema,
  googleLoginSchema,
} from "./auth.validation";

const router = Router();

const authController = new AuthController();

/*
|--------------------------------------------------------------------------
| Public Routes — password-based (existing)
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
| Public Routes — Email OTP (NEW)
|--------------------------------------------------------------------------
*/

router.post(
  "/email/send-otp",
  authLimiter,
  validate(sendEmailOtpSchema),
  authController.sendEmailOtp
);

router.post(
  "/email/verify-otp",
  authLimiter,
  validate(verifyEmailOtpSchema),
  authController.verifyEmailOtp
);

/*
|--------------------------------------------------------------------------
| Public Routes — WhatsApp OTP (NEW)
|--------------------------------------------------------------------------
*/

router.post(
  "/whatsapp/send-otp",
  authLimiter,
  validate(sendWhatsappOtpSchema),
  authController.sendWhatsappOtp
);

router.post(
  "/whatsapp/verify-otp",
  authLimiter,
  validate(verifyWhatsappOtpSchema),
  authController.verifyWhatsappOtp
);

/*
|--------------------------------------------------------------------------
| Public Routes — Google OAuth (NEW)
|--------------------------------------------------------------------------
*/

router.post(
  "/google",
  authLimiter,
  validate(googleLoginSchema),
  authController.googleLogin
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