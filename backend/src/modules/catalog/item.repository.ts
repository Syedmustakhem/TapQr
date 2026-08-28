import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

export class CatalogItemRepository {
  /**
   * Create catalog item
   */
  async create(
    data: Prisma.CatalogItemCreateInput
  ) {
    return prisma.catalogItem.create({
      data,
    });
  }

  /**
   * Find item by ID
   *
   * Item
   *   → Category
   *      → Catalog
   *         → Business
   */
  async findById(id: string) {
    return prisma.catalogItem.findUnique({
      where: {
        id,
      },

      include: {
        category: {
          include: {
            catalog: {
              select: {
                id: true,
                businessId: true,
                name: true,
                isActive: true,
              },
            },
          },
        },

        variants: {
          orderBy: {
            sortOrder: "asc",
          },
        },

        optionGroups: {
          orderBy: {
            sortOrder: "asc",
          },

          include: {
            options: {
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get items belonging to a category
   */
  async findByCategoryId(
    categoryId: string
  ) {
    return prisma.catalogItem.findMany({
      where: {
        categoryId,
        deletedAt: null,
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "desc",
        },
      ],

      include: {
        variants: {
          where: {
            isAvailable: true,
          },

          orderBy: {
            sortOrder: "asc",
          },
        },

        optionGroups: {
          orderBy: {
            sortOrder: "asc",
          },

          include: {
            options: {
              where: {
                isAvailable: true,
              },

              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update item
   */
  async update(
    id: string,
    data: Prisma.CatalogItemUpdateInput
  ) {
    return prisma.catalogItem.update({
      where: {
        id,
      },

      data,
    });
  }

  /**
   * Soft delete item
   */
  async softDelete(id: string) {
    return prisma.catalogItem.update({
      where: {
        id,
      },

      data: {
        deletedAt: new Date(),
      },
    });
  }
}