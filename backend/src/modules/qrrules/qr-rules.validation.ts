import {
  QRRuleActionType,
  QRRuleConditionType,
  QRRuleLogic,
  QRRuleOperator,
} from "@prisma/client";

import { z } from "zod";

/**
 * ============================================================
 * CONDITION
 * ============================================================
 */

const conditionSchema = z.object({
  id: z.string().min(1).optional(),

  type: z.nativeEnum(QRRuleConditionType),

  operator: z.nativeEnum(QRRuleOperator),

  value: z.unknown(),

  sortOrder: z.number().int().min(0).default(0),
});

/**
 * ============================================================
 * CONDITION GROUP
 * ============================================================
 *
 * Groups can contain:
 * - conditions
 * - nested child groups
 */

const conditionGroupSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().min(1).optional(),

    logic: z.nativeEnum(QRRuleLogic).default(QRRuleLogic.AND),

    sortOrder: z.number().int().min(0).default(0),

    conditions: z
      .array(conditionSchema)
      .default([]),

    children: z
      .array(conditionGroupSchema)
      .default([]),
  })
);

/**
 * ============================================================
 * ACTION
 * ============================================================
 */

const actionTypeSchema =
  z.nativeEnum(QRRuleActionType);

const actionValueSchema = z
  .string()
  .trim()
  .min(1, "Action value is required.");

/**
 * ============================================================
 * CREATE RULE
 * ============================================================
 */

export const createQRRuleSchema = z.object({
  qrCodeId: z
    .string()
    .min(1, "QR Code ID is required."),

  name: z
    .string()
    .trim()
    .min(1, "Rule name is required.")
    .max(120, "Rule name cannot exceed 120 characters."),

  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable(),

  priority: z
    .number()
    .int()
    .min(-100000)
    .max(100000)
    .default(0),

  startsAt: z
    .coerce
    .date()
    .optional()
    .nullable(),

  endsAt: z
    .coerce
    .date()
    .optional()
    .nullable(),

  logic: z
    .nativeEnum(QRRuleLogic)
    .default(QRRuleLogic.AND),

  actionType: actionTypeSchema,

  actionValue: actionValueSchema,

  fallbackActionType: actionTypeSchema
    .optional()
    .nullable(),

  fallbackActionValue: z
    .string()
    .trim()
    .optional()
    .nullable(),

  conditions: z
    .array(conditionSchema)
    .default([]),

  groups: z
    .array(conditionGroupSchema)
    .default([]),

  experimentId: z
    .string()
    .min(1)
    .optional()
    .nullable(),
});

/**
 * ============================================================
 * UPDATE RULE
 * ============================================================
 */

export const updateQRRuleSchema =
  createQRRuleSchema
    .omit({
      qrCodeId: true,
    })
    .partial()
    .extend({
      conditions: z
        .array(conditionSchema)
        .optional(),

      groups: z
        .array(conditionGroupSchema)
        .optional(),
    });

/**
 * ============================================================
 * ID PARAM
 * ============================================================
 */

export const qrRuleIdSchema = z.object({
  id: z.string().min(1),
});

/**
 * ============================================================
 * QR CODE PARAM
 * ============================================================
 */

export const qrCodeRuleParamSchema =
  z.object({
    qrCodeId: z.string().min(1),
  });

/**
 * ============================================================
 * ROLLBACK
 * ============================================================
 */

export const rollbackQRRuleSchema =
  z.object({
    version: z
      .number()
      .int()
      .min(1),
  });

/**
 * ============================================================
 * SIMULATOR
 * ============================================================
 *
 * We are defining the validation now so the same contracts
 * can later be reused by the Rule Simulator.
 */

export const simulateQRRuleSchema = z.object({
  qrCodeId: z.string().min(1),

  timestamp: z.coerce.date().optional(),

  timezone: z.string().trim().min(1).optional(),

  headers: z
    .record(z.string(), z.string())
    .optional(),

  query: z
    .record(z.string(), z.string())
    .optional(),

  visitorKey: z
    .string()
    .trim()
    .max(128)
    .optional(),

  customerId: z
    .string()
    .trim()
    .optional(),

  custom: z
    .record(z.string(), z.unknown())
    .optional(),
});

export const qrRuleMatchesQuerySchema = z.object({
  qrCodeId: z.string().min(1),

  ruleId: z.string().optional(),

  status: z
    .enum([
      "MATCHED",
      "NOT_MATCHED",
      "FALLBACK",
      "ERROR",
    ])
    .optional(),

  from: z.coerce.date().optional(),

  to: z.coerce.date().optional(),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50),

  offset: z.coerce
    .number()
    .int()
    .min(0)
    .default(0),
});
  

export type CreateQRRuleInput =
  z.infer<typeof createQRRuleSchema>;

export type UpdateQRRuleInput =
  z.infer<typeof updateQRRuleSchema>;

export type RollbackQRRuleInput =
  z.infer<typeof rollbackQRRuleSchema>;

export type SimulateQRRuleInput =
  z.infer<typeof simulateQRRuleSchema>;