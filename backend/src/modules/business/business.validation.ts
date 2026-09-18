import { z } from "zod";

/* ==========================================================================
   COMMON VALIDATORS
   ========================================================================== */

const optionalEmail = z
  .string()
  .trim()
  .email("Invalid email address")
  .optional();

const nullableEmail = z
  .string()
  .trim()
  .email("Invalid email address")
  .nullable()
  .optional();

const optionalPhone = z
  .string()
  .trim()
  .min(7, "Invalid phone number")
  .max(20, "Invalid phone number")
  .regex(
    /^\+?[0-9\s().-]+$/,
    "Invalid phone number"
  )
  .optional();

const nullablePhone = z
  .string()
  .trim()
  .min(7, "Invalid phone number")
  .max(20, "Invalid phone number")
  .regex(
    /^\+?[0-9\s().-]+$/,
    "Invalid phone number"
  )
  .nullable()
  .optional();

const optionalUrl = z
  .string()
  .trim()
  .url("Invalid URL")
  .optional();

const nullableUrl = z
  .string()
  .trim()
  .url("Invalid URL")
  .nullable()
  .optional();

const optionalText = (
  max: number,
  message?: string
) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional();

const nullableText = (
  max: number,
  message?: string
) =>
  z
    .string()
    .trim()
    .max(max, message)
    .nullable()
    .optional();

/* ==========================================================================
   OPENING HOURS
   ========================================================================== */

const timeSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "Time must be in HH:mm format"
  );

const dayHoursSchema = z.object({
  open: timeSchema,
  close: timeSchema,
});

const openingHoursSchema = z
  .object({
    monday: dayHoursSchema.nullable().optional(),
    tuesday: dayHoursSchema.nullable().optional(),
    wednesday: dayHoursSchema.nullable().optional(),
    thursday: dayHoursSchema.nullable().optional(),
    friday: dayHoursSchema.nullable().optional(),
    saturday: dayHoursSchema.nullable().optional(),
    sunday: dayHoursSchema.nullable().optional(),
  })
  .strict();

/* ==========================================================================
   SOCIAL LINKS
   ========================================================================== */

const socialLinksSchema = z
  .object({
    instagram: optionalUrl,
    facebook: optionalUrl,
    linkedin: optionalUrl,
    youtube: optionalUrl,
    twitter: optionalUrl,
    x: optionalUrl,
    tiktok: optionalUrl,
  })
  .strict();

/* ==========================================================================
   CREATE BUSINESS
   ========================================================================== */

export const createBusinessSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        2,
        "Business name must be at least 2 characters"
      )
      .max(
        100,
        "Business name must not exceed 100 characters"
      ),

    legalName: optionalText(
      150,
      "Legal name must not exceed 150 characters"
    ),

    displayName: optionalText(
      100,
      "Display name must not exceed 100 characters"
    ),

    businessType: optionalText(
      100,
      "Business type must not exceed 100 characters"
    ),

    industry: optionalText(
      100,
      "Industry must not exceed 100 characters"
    ),

    category: optionalText(
      100,
      "Category must not exceed 100 characters"
    ),

    subcategory: optionalText(
      100,
      "Subcategory must not exceed 100 characters"
    ),

    email: optionalEmail,

    phone: optionalPhone,

    website: optionalUrl,

    whatsapp: optionalPhone,

    logo: optionalUrl,

    coverImage: optionalUrl,

    description: z
      .string()
      .trim()
      .max(
        1000,
        "Description must not exceed 1000 characters"
      )
      .optional(),

    timezone: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .optional(),

    currency: z
      .string()
      .trim()
      .length(
        3,
        "Currency must be a 3-letter ISO code"
      )
      .optional(),

    language: z
      .string()
      .trim()
      .min(2)
      .max(20)
      .optional(),

    country: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),
  })
  .strict();

/* ==========================================================================
   UPDATE BUSINESS
   ========================================================================== */

export const updateBusinessSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .nullable()
      .optional(),

    legalName: nullableText(150),

    displayName: nullableText(100),

    businessType: nullableText(100),

    industry: nullableText(100),

    category: nullableText(100),

    subcategory: nullableText(100),

    email: nullableEmail,

    phone: nullablePhone,

    website: nullableUrl,

    whatsapp: nullablePhone,

    logo: nullableUrl,

    coverImage: nullableUrl,

    description: nullableText(1000),

    timezone: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .nullable()
      .optional(),

    currency: z
      .string()
      .trim()
      .length(
        3,
        "Currency must be a 3-letter ISO code"
      )
      .nullable()
      .optional(),

    language: z
      .string()
      .trim()
      .min(2)
      .max(20)
      .nullable()
      .optional(),

    country: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .nullable()
      .optional(),

    isVerified: z
      .boolean()
      .optional(),

    isPublished: z
      .boolean()
      .optional(),

    onboardingCompleted: z
      .boolean()
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      Object.keys(data).length > 0,
    {
      message:
        "At least one business field is required.",
    }
  );

/* ==========================================================================
   UPDATE BUSINESS PROFILE
   ========================================================================== */

export const updateBusinessProfileSchema = z
  .object({
    tagline: nullableText(150),

    description: nullableText(1000),

    website: nullableUrl,

    email: nullableEmail,

    phone: nullablePhone,

    whatsapp: nullablePhone,

    addressLine1: nullableText(200),

    addressLine2: nullableText(200),

    city: nullableText(100),

    state: nullableText(100),

    postalCode: nullableText(20),

    country: nullableText(100),

    latitude: z
      .number()
      .finite()
      .min(-90)
      .max(90)
      .nullable()
      .optional(),

    longitude: z
      .number()
      .finite()
      .min(-180)
      .max(180)
      .nullable()
      .optional(),

    openingHours:
      openingHoursSchema
        .nullable()
        .optional(),

    socialLinks:
      socialLinksSchema
        .nullable()
        .optional(),

    coverImage: nullableUrl,
  })
  .strict()
  .refine(
    (data) =>
      Object.keys(data).length > 0,
    {
      message:
        "At least one profile field is required.",
    }
  );