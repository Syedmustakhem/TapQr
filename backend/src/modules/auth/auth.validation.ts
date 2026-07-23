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