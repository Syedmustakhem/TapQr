import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

export class VariantRepository {
  /**
   * Create variant
   */
  async create(
    data: Prisma.CatalogItemVariantCreateInput
  ) {
    return prisma.catalogItemVariant.create({
      data,
    });
  }

  /**
   * Find variant by ID
   *
   * Variant
   *   ↓
   * CatalogItem
   *   ↓
   * Category
   *   ↓
   * Catalog
   *   ↓
   * Business
   */
  async findById(id: string) {
    return prisma.catalogItemVariant.findUnique({
      where: {
        id,
      },

      include: {
        item: {
          include: {
            category: {
              include: {
                catalog: {
                  select: {
                    id: true,
                    businessId: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get variants belonging to an item
   */
  async findByItemId(
    itemId: string
  ) {
    return prisma.catalogItemVariant.findMany({
      where: {
        itemId,
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });
  }

  /**
   * Update variant
   */
  async update(
    id: string,
    data: Prisma.CatalogItemVariantUpdateInput
  ) {
    return prisma.catalogItemVariant.update({
      where: {
        id,
      },

      data,
    });
  }

  /**
   * Delete variant
   */
  async delete(id: string) {
    return prisma.catalogItemVariant.delete({
      where: {
        id,
      },
    });
  }
}