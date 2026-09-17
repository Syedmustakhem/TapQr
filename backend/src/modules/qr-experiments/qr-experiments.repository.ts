import {
  Prisma,
  QRExperimentAllocationType,
  QRExperimentStatus,
} from "@prisma/client";
import { prisma } from "../../config/prisma";

const experimentInclude = {
  qrCode: {
    select: {
      id: true,
      name: true,
      shortCode: true,
      businessId: true,
    },
  },
  variants: {
    orderBy: {
      createdAt: "asc" as const,
    },
  },
  rules: {
    select: {
      id: true,
      name: true,
      status: true,
      priority: true,
    },
  },
} satisfies Prisma.QRExperimentInclude;

export class QRExperimentsRepository {
  async findQRCodeForOwner(qrCodeId: string, ownerId: string) {
    return prisma.qRCode.findFirst({
      where: {
        id: qrCodeId,
        business: {
          ownerId,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        businessId: true,
        status: true,
      },
    });
  }

  async findExperimentForOwner(id: string, ownerId: string) {
    return prisma.qRExperiment.findFirst({
      where: {
        id,
        qrCode: {
          business: {
            ownerId,
          },
        },
      },
      include: experimentInclude,
    });
  }

  async listExperimentsForOwner(
    ownerId: string,
    qrCodeId?: string
  ) {
    return prisma.qRExperiment.findMany({
      where: {
        ...(qrCodeId ? { qrCodeId } : {}),
        qrCode: {
          business: {
            ownerId,
          },
        },
      },
      include: experimentInclude,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async createExperiment(data: Prisma.QRExperimentUncheckedCreateInput) {
    return prisma.qRExperiment.create({
      data,
      include: experimentInclude,
    });
  }

  async updateExperiment(
    id: string,
    data: Prisma.QRExperimentUpdateInput
  ) {
    return prisma.qRExperiment.update({
      where: { id },
      data,
      include: experimentInclude,
    });
  }

  async archiveExperiment(id: string) {
    return prisma.qRExperiment.update({
      where: { id },
      data: {
        status: QRExperimentStatus.ARCHIVED,
      },
      include: experimentInclude,
    });
  }

  async createVariant(
    data: Prisma.QRExperimentVariantUncheckedCreateInput
  ) {
    return prisma.qRExperimentVariant.create({
      data,
    });
  }

  async findVariantForExperiment(
    experimentId: string,
    variantId: string
  ) {
    return prisma.qRExperimentVariant.findFirst({
      where: {
        id: variantId,
        experimentId,
      },
    });
  }

  async updateVariant(
    variantId: string,
    data: Prisma.QRExperimentVariantUpdateInput
  ) {
    return prisma.qRExperimentVariant.update({
      where: { id: variantId },
      data,
    });
  }

  async deleteVariant(variantId: string) {
    return prisma.qRExperimentVariant.delete({
      where: { id: variantId },
    });
  }

  async countVariants(experimentId: string) {
    return prisma.qRExperimentVariant.count({
      where: { experimentId },
    });
  }

  async getVariantAllocations(experimentId: string) {
    return prisma.qRExperimentVariant.findMany({
      where: { experimentId },
      select: {
        id: true,
        allocation: true,
      },
    });
  }

  async findAssignment(
    experimentId: string,
    visitorKey: string
  ) {
    return prisma.qRExperimentAssignment.findUnique({
      where: {
        experimentId_visitorKey: {
          experimentId,
          visitorKey,
        },
      },
      include: {
        variant: true,
      },
    });
  }

  async listConversionsForExperiment(
    experimentId: string,
    limit = 100,
    offset = 0
  ) {
    return prisma.qRConversion.findMany({
      where: { experimentId },
      orderBy: { convertedAt: "desc" },
      take: Math.min(Math.max(limit, 1), 100),
      skip: Math.max(offset, 0),
    });
  }

  async findConversionByExternalId(
    qrCodeId: string,
    externalId: string
  ) {
    return prisma.qRConversion.findFirst({
      where: {
        qrCodeId,
        externalId,
      },
    });
  }

  async createConversion(
    data: Prisma.QRConversionUncheckedCreateInput
  ) {
    return prisma.qRConversion.create({ data });
  }

  async incrementConversion(
    experimentId: string,
    variantId: string
  ) {
    return prisma.$transaction([
      prisma.qRExperiment.update({
        where: { id: experimentId },
        data: {
          conversionCount: {
            increment: 1,
          },
        },
      }),
      prisma.qRExperimentVariant.update({
        where: { id: variantId },
        data: {
          conversionCount: {
            increment: 1,
          },
        },
      }),
    ]);
  }
}
