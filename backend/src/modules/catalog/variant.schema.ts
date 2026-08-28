import { z } from "zod";

export const createVariantSchema = z.object({
  itemId: z
    .string()
    .min(1, "Item ID is required"),

  name: z
    .string()
    .trim()
    .min(1, "Variant name is required")
    .max(
      100,
      "Variant name cannot exceed 100 characters"
    ),

  price: z
    .number()
    .nonnegative(
      "Price cannot be negative"
    )
    .optional(),

  compareAtPrice: z
    .number()
    .nonnegative(
      "Compare-at price cannot be negative"
    )
    .optional(),

  sku: z
    .string()
    .trim()
    .max(
      100,
      "SKU cannot exceed 100 characters"
    )
    .optional(),

  stock: z
    .number()
    .nonnegative(
      "Stock cannot be negative"
    )
    .optional(),

  isAvailable: z
    .boolean()
    .optional(),

  sortOrder: z
    .number()
    .int()
    .nonnegative()
    .optional(),
});

export const updateVariantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  price: z
    .number()
    .nonnegative()
    .optional(),

  compareAtPrice: z
    .number()
    .nonnegative()
    .optional(),

  sku: z
    .string()
    .trim()
    .max(100)
    .optional(),

  stock: z
    .number()
    .nonnegative()
    .optional(),

  isAvailable: z
    .boolean()
    .optional(),

  sortOrder: z
    .number()
    .int()
    .nonnegative()
    .optional(),
});