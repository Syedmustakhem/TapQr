import { z } from "zod";

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

      if (
        data.experienceType !==
          "REDIRECT" &&
        data.type === "STATIC" &&
        data.destinationUrl
      ) {
        // Allowed for backward compatibility.
        // We do not reject it.
      }
    });

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