import { z } from "zod";

const authModeSchema =
  z.enum([
    "register",
    "login",
  ]);

const E164_REGEX =
  /^\+[1-9]\d{6,14}$/;

// ============================================================
// ACCOUNT IDENTIFICATION
// ============================================================

export const identifyAccountSchema =
  z
    .object({
      email: z
        .email(
          "Invalid email address"
        )
        .optional(),

      phone: z
        .string()
        .regex(
          E164_REGEX,
          "Phone must be in international format, e.g. +14155552671"
        )
        .optional(),
    })
    .refine(
      (data) =>
        !!data.email ||
        !!data.phone,
      {
        message:
          "Email or phone is required",
      }
    );

// ============================================================
// PASSWORD REGISTER
// ============================================================

export const registerSchema =
  z.object({
    fullName: z
      .string()
      .trim()
      .min(
        3,
        "Full name must be at least 3 characters"
      ),

    email: z.email(
      "Invalid email address"
    ),

    password: z
      .string()
      .min(
        8,
        "Password must be at least 8 characters"
      ),
  });

// ============================================================
// PASSWORD LOGIN
// ============================================================

export const loginSchema =
  z.object({
    email: z.email(
      "Invalid email address"
    ),

    password: z
      .string()
      .min(
        8,
        "Password must be at least 8 characters"
      ),
  });

// ============================================================
// REFRESH
// ============================================================

export const refreshSchema =
  z.object({
    refreshToken: z
      .string()
      .min(
        1,
        "Refresh token is required"
      ),
  });

// ============================================================
// EMAIL OTP SEND
// ============================================================

export const sendEmailOtpSchema =
  z.object({
    email: z.email(
      "Invalid email address"
    ),

    mode: authModeSchema,
  });

// ============================================================
// EMAIL OTP VERIFY
// ============================================================

export const verifyEmailOtpSchema =
  z.object({
    email: z.email(
      "Invalid email address"
    ),

    otp: z
      .string()
      .regex(
        /^\d{6}$/,
        "OTP must be 6 digits"
      ),

    mode: authModeSchema,

    fullName: z
      .string()
      .trim()
      .min(
        3,
        "Full name must be at least 3 characters"
      )
      .optional(),
  });

// ============================================================
// WHATSAPP OTP SEND
// ============================================================

export const sendWhatsappOtpSchema =
  z.object({
    phone: z
      .string()
      .trim()
      .regex(
        E164_REGEX,
        "Phone must be in international E.164 format, e.g. +14155552671"
      ),

    mode: authModeSchema,
  });

// ============================================================
// WHATSAPP OTP VERIFY
// ============================================================

export const verifyWhatsappOtpSchema =
  z.object({
    phone: z
      .string()
      .trim()
      .regex(
        E164_REGEX,
        "Phone must be in international E.164 format, e.g. +14155552671"
      ),

    otp: z
      .string()
      .regex(
        /^\d{6}$/,
        "OTP must be 6 digits"
      ),

    mode: authModeSchema,

    fullName: z
      .string()
      .trim()
      .min(
        3,
        "Full name must be at least 3 characters"
      )
      .optional(),
  });

// ============================================================
// GOOGLE
// ============================================================

export const googleLoginSchema =
  z.object({
    idToken: z
      .string()
      .min(
        10,
        "idToken is required"
      ),

    mode: authModeSchema,
  });