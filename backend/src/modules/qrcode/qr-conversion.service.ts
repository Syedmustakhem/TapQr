import { Prisma } from "@prisma/client";
import { AppError } from "../../cores/errors/AppError";
import { prisma } from "../../config/prisma";

export type CreatePublicQRConversionInput = {
  shortCode: string;
  conversionType: string;
  externalId?: string;
  value?: number | string;
  currency?: string;
  visitorKey?: string;
  metadata?: Record<string, unknown>;
};

export class QRConversionService {
  async createPublicConversion(input: CreatePublicQRConversionInput) {
    const shortCode = input.shortCode.trim();
    const conversionType = input.conversionType.trim().toUpperCase();

    if (!shortCode) {
      throw new AppError("QR code is required.", 400, "QR_CODE_REQUIRED");
    }

    if (!conversionType || conversionType.length > 100) {
      throw new AppError(
        "A valid conversion type is required.",
        400,
        "CONVERSION_TYPE_REQUIRED"
      );
    }

    const qr = await prisma.qRCode.findUnique({
      where: { shortCode },
      select: {
        id: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!qr || qr.deletedAt) {
      throw new AppError("QR Code not found.", 404, "QR_NOT_FOUND");
    }

    if (qr.status !== "ACTIVE") {
      throw new AppError(
        "This QR Code is currently unavailable.",
        410,
        "QR_NOT_ACTIVE"
      );
    }

    const externalId = input.externalId?.trim() || undefined;
    const visitorKey = input.visitorKey?.trim() || undefined;

    // Public conversion calls are intentionally idempotent when the
    // merchant supplies an external event/order identifier.
    if (externalId) {
      const existing = await prisma.qRConversion.findFirst({
        where: {
          qrCodeId: qr.id,
          externalId,
          conversionType,
        },
      });

      if (existing) {
        return this.toResponse(existing, true);
      }
    }

    // Attribute the conversion to the latest matched Smart Rule for
    // this visitor. The client never supplies rule/experiment IDs.
    const latestMatch = visitorKey
      ? await prisma.qRRuleMatch.findFirst({
          where: {
            qrCodeId: qr.id,
            visitorKey,
            status: "MATCHED",
          },
          orderBy: { matchedAt: "desc" },
          select: {
            ruleId: true,
            ruleVersion: true,
            experimentId: true,
            variantId: true,
          },
        })
      : null;

    // If a conversion happens without a rule match, still attribute it
    // to an experiment assignment when one exists for this QR.
    let experimentId = latestMatch?.experimentId ?? null;
    let variantId = latestMatch?.variantId ?? null;

    if (!experimentId && visitorKey) {
      const assignment = await prisma.qRExperimentAssignment.findFirst({
        where: {
          visitorKey,
          experiment: {
            qrCodeId: qr.id,
          },
        },
        orderBy: { lastSeenAt: "desc" },
        select: {
          experimentId: true,
          variantId: true,
        },
      });

      experimentId = assignment?.experimentId ?? null;
      variantId = assignment?.variantId ?? null;
    }

    let value: Prisma.Decimal | undefined;
    if (input.value !== undefined && input.value !== null && input.value !== "") {
      const numericValue = Number(input.value);
      if (!Number.isFinite(numericValue)) {
        throw new AppError("Conversion value must be numeric.", 400, "INVALID_VALUE");
      }
      value = new Prisma.Decimal(numericValue);
    }

    const conversion = await prisma.qRConversion.create({
      data: {
        qrCodeId: qr.id,
        ruleId: latestMatch?.ruleId ?? null,
        ruleVersion: latestMatch?.ruleVersion ?? null,
        experimentId,
        variantId,
        conversionType,
        externalId: externalId ?? null,
        value,
        currency: input.currency?.trim().toUpperCase() || null,
        visitorKey: visitorKey ?? null,
      },
    });

    if (experimentId && variantId) {
      await prisma.qRExperimentVariant.update({
        where: { id: variantId },
        data: { conversionCount: { increment: 1 } },
      });

      await prisma.qRExperiment.update({
        where: { id: experimentId },
        data: { conversionCount: { increment: 1 } },
      });
    }

    return this.toResponse(conversion, false);
  }

  private toResponse(
    conversion: {
      id: string;
      ruleId: string | null;
      ruleVersion: number | null;
      experimentId: string | null;
      variantId: string | null;
    },
    duplicate: boolean
  ) {
    return {
      conversionId: conversion.id,
      duplicate,
      attributed: Boolean(
        conversion.ruleId || conversion.experimentId || conversion.variantId
      ),
      ruleId: conversion.ruleId,
      ruleVersion: conversion.ruleVersion,
      experimentId: conversion.experimentId,
      variantId: conversion.variantId,
    };
  }
}
