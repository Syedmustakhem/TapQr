import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

export class CategoryRepository {
  /**
   * Create category
   */
  async create(
    data: Prisma.CatalogCategoryCreateInput
  ) {
    return prisma.catalogCategory.create({
      data,
    });
  }

  /**
   * Find category by ID
   *
   * Includes catalog information so the service
   * can verify business ownership.
   */
  async findById(id: string) {
    return prisma.catalogCategory.findUnique({
      where: {
        id,
      },
      include: {
        catalog: {
          select: {
            id: true,
            businessId: true,
          },
        },
      },
    });
  }

  /**
   * Get all categories belonging to a catalog.
   */
  async findByCatalogId(
    catalogId: string
  ) {
    return prisma.catalogCategory.findMany({
      where: {
        catalogId,
        isActive: true,
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
            items: true,
          },
        },
      },
    });
  }

  /**
   * Update category.
   */
  async update(
    id: string,
    data: Prisma.CatalogCategoryUpdateInput
  ) {
    return prisma.catalogCategory.update({
      where: {
        id,
      },
      data,
    });
  }

  /**
   * Soft delete category.
   *
   * We do NOT physically delete it because
   * deleting a category would cascade-delete
   * all items belonging to it.
   */
  async softDelete(id: string) {
    return prisma.catalogCategory.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });
  }
}