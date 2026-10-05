import { z } from "zod";

/*
 * ============================================================
 * SETTINGS VALIDATION
 * ============================================================
 */

const SUPPORTED_LANGUAGES = [
  "en",
  "hi",
  "te",
  "ta",
  "kn",
  "ml",
] as const;

const SUPPORTED_TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
] as const;

export const updatePreferencesSchema =
  z
    .object({
      language: z
        .enum(SUPPORTED_LANGUAGES)
        .optional(),
      timezone: z
        .enum(SUPPORTED_TIMEZONES)
        .optional(),
    })
    .refine(
      (data) =>
        data.language !== undefined ||
        data.timezone !== undefined,
      {
        message:
          "Provide language or timezone to update.",
      }
    );

export const createApiKeySchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(60),
    // Optional expiry in days from now (1–365).
    expiresInDays: z
      .number()
      .int()
      .min(1)
      .max(365)
      .optional(),
  });

export type UpdatePreferencesInput = z.infer<
  typeof updatePreferencesSchema
>;

export type CreateApiKeyInput = z.infer<
  typeof createApiKeySchema
>;

export const SUPPORTED_LANGUAGES_LIST =
  SUPPORTED_LANGUAGES;

export const SUPPORTED_TIMEZONES_LIST =
  SUPPORTED_TIMEZONES;
