import { z } from "zod";

export const createCatalogSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Catalog name must be at least 2 characters")
    .max(100, "Catalog name cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  type: z.enum([
    "MENU",
    "PRODUCTS",
    "SERVICES",
    "GENERAL",
  ]),
});

export const updateCatalogSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Catalog name must be at least 2 characters")
    .max(100, "Catalog name cannot exceed 100 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  type: z
    .enum([
      "MENU",
      "PRODUCTS",
      "SERVICES",
      "GENERAL",
    ])
    .optional(),

  isActive: z
    .boolean()
    .optional(),

  sortOrder: z
    .number()
    .int()
    .min(0)
    .optional(),
});