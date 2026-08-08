import { prisma } from "../../config/prisma";
import { Prisma } from "@prisma/client";

export class QRCodeRepository {

  async create(data: Prisma.QRCodeCreateInput) {
    return prisma.qRCode.create({
      data,
    });
  }

  async findById(id: string) {
    return prisma.qRCode.findUnique({
      where: {
        id,
      },
    });
  }

  async findByShortCode(shortCode: string) {
    return prisma.qRCode.findUnique({
      where: {
        shortCode,
      },
    });
  }

  async findByBusinessId(businessId: string) {
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

  async incrementScanCount(id: string) {
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