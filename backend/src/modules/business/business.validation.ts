import { z } from "zod";

const optionalEmail = z
  .string()
  .trim()
  .email("Invalid email address")
  .optional();

const optionalPhone = z
  .string()
  .trim()
  .min(7, "Invalid phone number")
  .max(20, "Invalid phone number")
  .optional();

export const createBusinessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must not exceed 100 characters"),

  email: optionalEmail,

  phone: optionalPhone,

  description: z
    .string()
    .trim()
    .max(
      500,
      "Description must not exceed 500 characters"
    )
    .optional(),

  logo: z
    .string()
    .trim()
    .url("Logo must be a valid URL")
    .optional(),
});

export const updateBusinessSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .nullable()
      .optional(),

    phone: z
      .string()
      .trim()
      .min(7)
      .max(20)
      .nullable()
      .optional(),

    description: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional(),

    logo: z
      .string()
      .trim()
      .url("Logo must be a valid URL")
      .nullable()
      .optional(),
  })
  .strict();

export const updateBusinessProfileSchema = z
  .object({
    tagline: z
      .string()
      .trim()
      .max(150)
      .nullable()
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000)
      .nullable()
      .optional(),

    website: z
      .string()
      .trim()
      .url("Website must be a valid URL")
      .nullable()
      .optional(),

    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .nullable()
      .optional(),

    phone: z
      .string()
      .trim()
      .min(7)
      .max(20)
      .nullable()
      .optional(),

    whatsapp: z
      .string()
      .trim()
      .min(7)
      .max(20)
      .nullable()
      .optional(),

    addressLine1: z
      .string()
      .trim()
      .max(200)
      .nullable()
      .optional(),

    addressLine2: z
      .string()
      .trim()
      .max(200)
      .nullable()
      .optional(),

    city: z
      .string()
      .trim()
      .max(100)
      .nullable()
      .optional(),

    state: z
      .string()
      .trim()
      .max(100)
      .nullable()
      .optional(),

    postalCode: z
      .string()
      .trim()
      .max(20)
      .nullable()
      .optional(),

    country: z
      .string()
      .trim()
      .max(100)
      .nullable()
      .optional(),

    latitude: z
      .number()
      .min(-90)
      .max(90)
      .nullable()
      .optional(),

    longitude: z
      .number()
      .min(-180)
      .max(180)
      .nullable()
      .optional(),

    openingHours: z
      .unknown()
      .nullable()
      .optional(),

    socialLinks: z
      .unknown()
      .nullable()
      .optional(),

    coverImage: z
      .string()
      .trim()
      .url("Cover image must be a valid URL")
      .nullable()
      .optional(),
  })
  .strict();