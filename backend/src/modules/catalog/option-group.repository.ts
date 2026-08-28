import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

export class OptionGroupRepository {
  /**
   * Create option group
   */
  async create(
    data: Prisma.CatalogItemOptionGroupCreateInput
  ) {
    return prisma.catalogItemOptionGroup.create({
      data,
      include: {
        options: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });
  }

  /**
   * Find option group
   */
  async findById(id: string) {
    return prisma.catalogItemOptionGroup.findUnique({
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

        options: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });
  }

  /**
   * Get option groups for item
   */
  async findByItemId(itemId: string) {
    return prisma.catalogItemOptionGroup.findMany({
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
    });
  }

  /**
   * Update option group
   */
  async update(
    id: string,
    data: Prisma.CatalogItemOptionGroupUpdateInput
  ) {
    return prisma.catalogItemOptionGroup.update({
      where: {
        id,
      },

      data,

      include: {
        options: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });
  }

  /**
   * Delete option group
   *
   * Prisma will cascade delete options.
   */
  async delete(id: string) {
    return prisma.catalogItemOptionGroup.delete({
      where: {
        id,
      },
    });
  }
}