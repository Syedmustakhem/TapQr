import { z } from "zod";

export const createCatalogItemSchema = z.object({
  categoryId: z
    .string()
    .min(1, "Category ID is required"),

  name: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(
      150,
      "Item name cannot exceed 150 characters"
    ),

  description: z
    .string()
    .trim()
    .max(
      2000,
      "Description cannot exceed 2000 characters"
    )
    .optional(),

  type: z
    .string()
    .trim()
    .min(1, "Item type is required")
    .max(50),

  price: z
    .number()
    .nonnegative()
    .optional(),

  compareAtPrice: z
    .number()
    .nonnegative()
    .optional(),

  currency: z
    .string()
    .trim()
    .length(3)
    .optional(),

  image: z
    .string()
    .url()
    .optional(),

  gallery: z
    .unknown()
    .optional(),

  sku: z
    .string()
    .trim()
    .max(100)
    .optional(),

  unit: z
    .string()
    .trim()
    .max(50)
    .optional(),

  stock: z
    .number()
    .nonnegative()
    .optional(),

  durationMinutes: z
    .number()
    .int()
    .nonnegative()
    .optional(),

  isAvailable: z
    .boolean()
    .optional(),

  isFeatured: z
    .boolean()
    .optional(),

  sortOrder: z
    .number()
    .int()
    .nonnegative()
    .optional(),

  metadata: z
    .unknown()
    .optional(),
});

export const updateCatalogItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .optional(),

  description: z
    .string()
    .trim()
    .max(2000)
    .optional(),

  type: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional(),

  price: z
    .number()
    .nonnegative()
    .optional(),

  compareAtPrice: z
    .number()
    .nonnegative()
    .optional(),

  currency: z
    .string()
    .trim()
    .length(3)
    .optional(),

  image: z
    .string()
    .url()
    .optional(),

  gallery: z
    .unknown()
    .optional(),

  sku: z
    .string()
    .trim()
    .max(100)
    .optional(),

  unit: z
    .string()
    .trim()
    .max(50)
    .optional(),

  stock: z
    .number()
    .nonnegative()
    .optional(),

  durationMinutes: z
    .number()
    .int()
    .nonnegative()
    .optional(),

  isAvailable: z
    .boolean()
    .optional(),

  isFeatured: z
    .boolean()
    .optional(),

  sortOrder: z
    .number()
    .int()
    .nonnegative()
    .optional(),

  metadata: z
    .unknown()
    .optional(),
});