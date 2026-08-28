import { z } from "zod";

export const createOptionGroupSchema =
  z
    .object({
      itemId: z
        .string()
        .min(1, "Item ID is required"),

      name: z
        .string()
        .trim()
        .min(
          1,
          "Option group name is required"
        )
        .max(100),

      required: z
        .boolean()
        .optional(),

      minSelect: z
        .number()
        .int()
        .nonnegative()
        .optional(),

      maxSelect: z
        .number()
        .int()
        .positive()
        .optional(),

      sortOrder: z
        .number()
        .int()
        .nonnegative()
        .optional(),
    })
    .refine(
      (data) =>
        data.maxSelect === undefined ||
        data.minSelect === undefined ||
        data.minSelect <= data.maxSelect,
      {
        message:
          "minSelect cannot exceed maxSelect",
        path: ["minSelect"],
      }
    );

export const updateOptionGroupSchema =
  z
    .object({
      name: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .optional(),

      required: z
        .boolean()
        .optional(),

      minSelect: z
        .number()
        .int()
        .nonnegative()
        .optional(),

      maxSelect: z
        .number()
        .int()
        .positive()
        .optional(),

      sortOrder: z
        .number()
        .int()
        .nonnegative()
        .optional(),
    });