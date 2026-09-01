import { z } from "zod";

/*
|--------------------------------------------------------------------------
| COMMON VALIDATORS
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| OPENING HOURS
|--------------------------------------------------------------------------
|
| Example:
|
| {
|   monday: {
|     open: "09:00",
|     close: "21:00"
|   },
|   tuesday: {
|     open: "09:00",
|     close: "21:00"
|   }
| }
|
*/

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

/*
|--------------------------------------------------------------------------
| SOCIAL LINKS
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| CREATE BUSINESS
|--------------------------------------------------------------------------
*/

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

    logo: optionalUrl,
  })
  .strict();

/*
|--------------------------------------------------------------------------
| UPDATE BUSINESS
|--------------------------------------------------------------------------
*/

export const updateBusinessSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    email: nullableEmail,

    phone: nullablePhone,

    description: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional(),

    logo: nullableUrl,
  })
  .strict();

/*
|--------------------------------------------------------------------------
| UPDATE BUSINESS PROFILE
|--------------------------------------------------------------------------
*/

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

    website: nullableUrl,

    email: nullableEmail,

    phone: nullablePhone,

    whatsapp: nullablePhone,

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

    openingHours: openingHoursSchema
      .nullable()
      .optional(),

    socialLinks: socialLinksSchema
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