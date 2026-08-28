import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

export class OptionRepository {
  /**
   * Create option
   */
  async create(
    data: Prisma.CatalogItemOptionCreateInput
  ) {
    return prisma.catalogItemOption.create({
      data,
    });
  }

  /**
   * Find option
   *
   * Option
   *  ↓
   * Group
   *  ↓
   * Item
   *  ↓
   * Category
   *  ↓
   * Catalog
   *  ↓
   * Business
   */
  async findById(id: string) {
    return prisma.catalogItemOption.findUnique({
      where: {
        id,
      },

      include: {
        group: {
          include: {
            item: {
              include: {
                category: {
                  include: {
                    catalog: {
                      select: {
                        businessId: true,
                      },
                    },
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
   * Get options
   */
  async findByGroupId(
    groupId: string
  ) {
    return prisma.catalogItemOption.findMany({
      where: {
        groupId,
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
   * Update option
   */
  async update(
    id: string,
    data: Prisma.CatalogItemOptionUpdateInput
  ) {
    return prisma.catalogItemOption.update({
      where: {
        id,
      },

      data,
    });
  }

  /**
   * Delete option
   */
  async delete(id: string) {
    return prisma.catalogItemOption.delete({
      where: {
        id,
      },
    });
  }
}