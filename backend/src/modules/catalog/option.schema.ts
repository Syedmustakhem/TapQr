import { z } from "zod";

export const createOptionSchema =
  z.object({
    groupId: z
      .string()
      .min(1, "Group ID is required"),

    name: z
      .string()
      .trim()
      .min(1, "Option name is required")
      .max(100),

    price: z
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

export const updateOptionSchema =
  z.object({
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

    isAvailable: z
      .boolean()
      .optional(),

    sortOrder: z
      .number()
      .int()
      .nonnegative()
      .optional(),
  });