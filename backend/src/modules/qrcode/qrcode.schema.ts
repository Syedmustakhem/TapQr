import { z } from "zod";

/**
 * ============================================================
 * CREATE QR CODE
 * ============================================================
 */

export const createQRCodeSchema =
  z
    .object({
      businessId: z
        .string()
        .uuid("Invalid Business ID"),

      catalogId: z
        .string()
        .min(1, "Invalid Catalog ID")
        .optional(),

      name: z
        .string()
        .trim()
        .min(
          3,
          "QR name must be at least 3 characters"
        )
        .max(
          100,
          "QR name cannot exceed 100 characters"
        ),

      description: z
        .string()
        .trim()
        .max(500)
        .optional(),

      type: z.enum([
        "STATIC",
        "DYNAMIC",
      ]),

      destinationUrl: z
        .string()
        .url("Invalid destination URL")
        .optional(),

      experienceType: z
        .enum([
          "BUSINESS",
          "CATALOG",
          "MENU",
          "SERVICES",
          "PRODUCTS",
          "CONTACT",
          "REDIRECT",
        ])
        .default("BUSINESS"),

      enabledSections: z
        .array(
          z.string().trim().min(1)
        )
        .max(30)
        .optional(),
    })
    .superRefine((data, ctx) => {
      /**
       * Redirect QR requires URL.
       */
      if (
        data.experienceType ===
          "REDIRECT" &&
        !data.destinationUrl
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["destinationUrl"],
          message:
            "Destination URL is required for redirect QR codes.",
        });
      }

      /**
       * Catalog based experiences require catalog.
       */
      if (
        [
          "CATALOG",
          "MENU",
          "SERVICES",
          "PRODUCTS",
        ].includes(
          data.experienceType
        ) &&
        !data.catalogId
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["catalogId"],
          message:
            "Catalog is required for this QR experience.",
        });
      }

      /**
       * Static QR backward compatibility.
       *
       * We intentionally allow destinationUrl
       * for existing records.
       */
      if (
        data.experienceType !==
          "REDIRECT" &&
        data.type === "STATIC" &&
        data.destinationUrl
      ) {
        // Allowed for backward compatibility.
      }
    });

/**
 * ============================================================
 * UPDATE QR CODE
 * ============================================================
 */

export const updateQRCodeSchema =
  z.object({
    catalogId: z
      .string()
      .min(1)
      .nullable()
      .optional(),

    name: z
      .string()
      .trim()
      .min(3)
      .max(100)
      .optional(),

    description: z
      .string()
      .trim()
      .max(500)
      .optional(),

    destinationUrl: z
      .string()
      .url()
      .nullable()
      .optional(),

    experienceType: z
      .enum([
        "BUSINESS",
        "CATALOG",
        "MENU",
        "SERVICES",
        "PRODUCTS",
        "CONTACT",
        "REDIRECT",
      ])
      .optional(),

    enabledSections: z
      .array(
        z.string().trim().min(1)
      )
      .max(30)
      .optional(),

    status: z
      .enum([
        "ACTIVE",
        "PAUSED",
        "EXPIRED",
      ])
      .optional(),
  });

/**
 * ============================================================
 * QR BRANDING / QR STUDIO
 * ============================================================
 */

const hexColorSchema = z
  .string()
  .trim()
  .regex(
    /^#[0-9A-Fa-f]{6}$/,
    "Color must be a valid HEX color."
  );

export const updateQRBrandingSchema =
  z.object({
    primaryColor:
      hexColorSchema
        .nullable()
        .optional(),

    secondaryColor:
      hexColorSchema
        .nullable()
        .optional(),

    backgroundColor:
      hexColorSchema
        .nullable()
        .optional(),

    qrForegroundColor:
      hexColorSchema
        .nullable()
        .optional(),

    qrBackgroundColor:
      hexColorSchema
        .nullable()
        .optional(),

    logoUrl: z
      .string()
      .trim()
      .url("Invalid logo URL.")
      .nullable()
      .optional(),

    coverImageUrl: z
      .string()
      .trim()
      .url("Invalid cover image URL.")
      .nullable()
      .optional(),

    buttonStyle: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .nullable()
      .optional(),

    fontFamily: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .nullable()
      .optional(),
  });

export type UpdateQRBrandingInput =
  z.infer<
    typeof updateQRBrandingSchema
  >;