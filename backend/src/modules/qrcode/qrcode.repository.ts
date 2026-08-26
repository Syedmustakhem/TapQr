import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

export class QRCodeRepository {
  /**
   * Create QR Code
   */
  async create(
    data: Prisma.QRCodeCreateInput
  ) {
    return prisma.qRCode.create({
      data,
    });
  }

  /**
   * Find QR Code by ID
   *
   * Includes business owner information
   * for authorization checks.
   */
  async findById(id: string) {
    return prisma.qRCode.findUnique({
      where: {
        id,
      },
      include: {
        business: {
          select: {
            ownerId: true,
          },
        },
      },
    });
  }

  /**
   * Find QR Code by short code
   *
   * Used by public QR redirects.
   */
  async findByShortCode(
    shortCode: string
  ) {
    return prisma.qRCode.findUnique({
      where: {
        shortCode,
      },
    });
  }

  /**
   * Find all QR Codes for a business
   */
  async findByBusinessId(
    businessId: string
  ) {
    return prisma.qRCode.findMany({
      where: {
        businessId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Update QR Code
   */
  async update(
    id: string,
    data: Prisma.QRCodeUpdateInput
  ) {
    return prisma.qRCode.update({
      where: {
        id,
      },
      data,
    });
  }

  /**
   * Soft delete QR Code
   */
  async softDelete(id: string) {
    return prisma.qRCode.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Increment QR scan count
   */
  async incrementScanCount(
    id: string
  ) {
    return prisma.qRCode.update({
      where: {
        id,
      },
      data: {
        scanCount: {
          increment: 1,
        },
      },
    });
  }
}