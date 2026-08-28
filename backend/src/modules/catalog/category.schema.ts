import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  image: z
    .string()
    .url("Invalid category image URL")
    .optional(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  description: z
    .string()
    .trim()
    .max(500)
    .optional(),

  image: z
    .string()
    .url("Invalid category image URL")
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