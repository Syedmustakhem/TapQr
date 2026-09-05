import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

const catalogInclude = {
  categories: {
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
    include: {
      items: {
        where: { isAvailable: true, deletedAt: null },
        orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
        include: {
          variants: {
            where: { isAvailable: true },
            orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
          },
          optionGroups: {
            orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
            include: {
              options: {
                where: { isAvailable: true },
                orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
              },
            },
          },
        },
      },
    },
  },
};

const businessSelect = {
  id: true,
  ownerId: true,
  name: true,
  slug: true,
  email: true,
  phone: true,
  logo: true,
  description: true,
  status: true,
  profile: true,
};

export class QRCodeRepository {
  async create(data: Prisma.QRCodeCreateInput) {
    return prisma.qRCode.create({ data });
  }

  async findById(id: string) {
    return prisma.qRCode.findUnique({
      where: { id },
      include: {
        business: { select: businessSelect },
        catalog: { include: catalogInclude },
        branding: true,
      },
    });
  }

  async findByShortCode(shortCode: string) {
    return prisma.qRCode.findUnique({
      where: { shortCode },
      include: {
        business: { select: businessSelect },
        catalog: { include: catalogInclude },
        branding: true,
      },
    });
  }

  async findCatalogById(catalogId: string) {
    return prisma.catalog.findUnique({
      where: { id: catalogId },
      select: {
        id: true,
        businessId: true,
        name: true,
        description: true,
        type: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByBusinessId(businessId: string) {
    return prisma.qRCode.findMany({
      where: { businessId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        catalog: {
          select: {
            id: true,
            businessId: true,
            name: true,
            description: true,
            type: true,
            isActive: true,
            sortOrder: true,
          },
        },
        branding: true,
      },
    });
  }

  async update(id: string, data: Prisma.QRCodeUpdateInput) {
    return prisma.qRCode.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return prisma.qRCode.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async incrementScanCount(id: string) {
    return prisma.qRCode.update({
      where: { id },
      data: { scanCount: { increment: 1 }, lastScannedAt: new Date() },
    });
  }

  async touchScan(id: string) {
    return prisma.qRCode.update({
      where: { id },
      data: { lastScannedAt: new Date() },
    });
  }

  async findBranding(qrCodeId: string) {
    return prisma.qRBranding.findUnique({ where: { qrCodeId } });
  }

  async createBranding(qrCodeId: string, data: Prisma.QRBrandingCreateInput) {
    return prisma.qRBranding.create({
      data: { ...data, qrCode: { connect: { id: qrCodeId } } },
    });
  }

  async upsertBranding(qrCodeId: string, data: Prisma.QRBrandingUpdateInput) {
    return prisma.qRBranding.upsert({
      where: { qrCodeId },
      create: { qrCode: { connect: { id: qrCodeId } } },
      update: data,
    });
  }
}
