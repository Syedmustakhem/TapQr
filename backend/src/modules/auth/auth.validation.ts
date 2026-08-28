import { z } from "zod";

const authModeSchema = z.enum(["register", "login"]);

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name must be at least 3 characters"),

  email: z.email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

/*
|--------------------------------------------------------------------------
| EMAIL OTP
|--------------------------------------------------------------------------
*/

export const sendEmailOtpSchema = z.object({
  email: z.email("Invalid email address"),

  mode: authModeSchema,
});

export const verifyEmailOtpSchema = z.object({
  email: z.email("Invalid email address"),

  otp: z
    .string()
    .regex(/^\d{6}$/, "OTP must be 6 digits"),

  mode: authModeSchema,

  fullName: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .optional(),
});

/*
|--------------------------------------------------------------------------
| WHATSAPP OTP
|--------------------------------------------------------------------------
*/

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export const sendWhatsappOtpSchema = z.object({
  phone: z
    .string()
    .regex(
      E164_REGEX,
      "Phone must be in E.164 format, e.g. +14155551234"
    ),

  mode: authModeSchema,
});

export const verifyWhatsappOtpSchema = z.object({
  phone: z
    .string()
    .regex(
      E164_REGEX,
      "Phone must be in E.164 format, e.g. +14155551234"
    ),

  otp: z
    .string()
    .regex(/^\d{6}$/, "OTP must be 6 digits"),

  mode: authModeSchema,

  fullName: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .optional(),
});

/*
|--------------------------------------------------------------------------
| GOOGLE
|--------------------------------------------------------------------------
*/

export const googleLoginSchema = z.object({
  idToken: z
    .string()
    .min(10, "idToken is required"),

  mode: authModeSchema,
});