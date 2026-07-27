import { z } from "zod";

export const createBusinessSchema = z.object({
  name: z
    .string()
    .min(3, "Business name must be at least 3 characters")
    .max(100, "Business name cannot exceed 100 characters"),

  email: z
    .string()
    .email("Invalid business email")
    .optional(),

  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 digits")
    .optional(),

  logo: z
    .string()
    .url("Logo must be a valid URL")
    .optional(),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});