import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const sendEmailOtpSchema = z.object({
  email: z.email("Invalid email address"),
});

export const verifyEmailOtpSchema = z.object({
  email: z.email("Invalid email address"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  fullName: z.string().min(3, "Full name must be at least 3 characters").optional(),
});

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export const sendWhatsappOtpSchema = z.object({
  phone: z.string().regex(E164_REGEX, "Phone must be in E.164 format, e.g. +14155551234"),
});

export const verifyWhatsappOtpSchema = z.object({
  phone: z.string().regex(E164_REGEX, "Phone must be in E.164 format, e.g. +14155551234"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  fullName: z.string().min(3, "Full name must be at least 3 characters").optional(),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(10, "idToken is required"),
});