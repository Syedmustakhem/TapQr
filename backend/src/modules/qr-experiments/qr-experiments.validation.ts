import {
  QRExperimentAllocationType,
  QRRuleActionType,
} from "@prisma/client";
import { z } from "zod";

const optionalDate = z
  .union([z.string().datetime(), z.null()])
  .optional();

export const createQRExperimentSchema = z.object({
  qrCodeId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).nullable().optional(),
  allocationType: z.nativeEnum(QRExperimentAllocationType).optional(),
  startsAt: optionalDate,
  endsAt: optionalDate,
});

export const updateQRExperimentSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  allocationType: z.nativeEnum(QRExperimentAllocationType).optional(),
  startsAt: optionalDate,
  endsAt: optionalDate,
});

export const experimentIdSchema = z.object({
  id: z.string().min(1),
});

export const variantParamSchema = z.object({
  id: z.string().min(1),
  variantId: z.string().min(1),
});

export const experimentListQuerySchema = z.object({
  qrCodeId: z.string().min(1).optional(),
});

export const createVariantSchema = z.object({
  name: z.string().trim().min(1).max(100),
  allocation: z.number().int().min(0).max(1000000),
  actionType: z.nativeEnum(QRRuleActionType),
  actionValue: z.string().trim().min(1).max(4000),
});

export const updateVariantSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  allocation: z.number().int().min(0).max(1000000).optional(),
  actionType: z.nativeEnum(QRRuleActionType).optional(),
  actionValue: z.string().trim().min(1).max(4000).optional(),
});

export const createConversionSchema = z.object({
  qrCodeId: z.string().min(1),
  conversionType: z.string().trim().min(1).max(80),
  externalId: z.string().trim().max(255).optional().nullable(),
  value: z.number().finite().optional().nullable(),
  currency: z.string().trim().max(10).optional().nullable(),
  visitorKey: z.string().trim().max(255).optional().nullable(),
  experimentId: z.string().min(1).optional().nullable(),
  variantId: z.string().min(1).optional().nullable(),
  ruleId: z.string().min(1).optional().nullable(),
  ruleVersion: z.number().int().positive().optional().nullable(),
});
