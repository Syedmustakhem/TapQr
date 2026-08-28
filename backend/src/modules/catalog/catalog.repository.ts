import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

export class CatalogRepository {
  /**
   * Create catalog
   */
  async create(
    data: Prisma.CatalogCreateInput
  ) {
    return prisma.catalog.create({
      data,
    });
  }

  /**
   * Find catalog by ID
   */
  async findById(id: string) {
    return prisma.catalog.findUnique({
      where: {
        id,
      },
      include: {
        categories: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });
  }

  /**
   * Find all catalogs for business
   */
  async findByBusinessId(
    businessId: string
  ) {
    return prisma.catalog.findMany({
      where: {
        businessId,
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
      include: {
        _count: {
          select: {
            categories: true,
          },
        },
      },
    });
  }

  /**
   * Update catalog
   */
  async update(
    id: string,
    data: Prisma.CatalogUpdateInput
  ) {
    return prisma.catalog.update({
      where: {
        id,
      },
      data,
    });
  }

  /**
   * Delete catalog
   */
  async delete(id: string) {
    return prisma.catalog.delete({
      where: {
        id,
      },
    });
  }
}