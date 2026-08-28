import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

export class QRCodeRepository {
  /**
   * Create a QR code.
   */
  async create(
    data: Prisma.QRCodeCreateInput
  ) {
    return prisma.qRCode.create({
      data,
    });
  }

  /**
   * Find QR code by ID.
   *
   * Includes business ownership information,
   * business profile, attached catalog and branding.
   */
  async findById(id: string) {
    return prisma.qRCode.findUnique({
      where: {
        id,
      },

      include: {
        business: {
          select: {
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
          },
        },

        catalog: {
          include: {
            categories: {
              where: {
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
                items: {
                  where: {
                    isAvailable: true,
                    deletedAt: null,
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
                    variants: {
                      where: {
                        isAvailable: true,
                      },

                      orderBy: [
                        {
                          sortOrder: "asc",
                        },
                        {
                          createdAt: "asc",
                        },
                      ],
                    },

                    optionGroups: {
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

                          orderBy: [
                            {
                              sortOrder: "asc",
                            },
                            {
                              createdAt: "asc",
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },

        branding: true,
      },
    });
  }

  /**
   * Find QR code by public short code.
   *
   * Used by the public guest experience.
   */
  async findByShortCode(
    shortCode: string
  ) {
    return prisma.qRCode.findUnique({
      where: {
        shortCode,
      },

      include: {
        business: {
          select: {
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
          },
        },

        catalog: {
          include: {
            categories: {
              where: {
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
                items: {
                  where: {
                    isAvailable: true,
                    deletedAt: null,
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
                    variants: {
                      where: {
                        isAvailable: true,
                      },

                      orderBy: [
                        {
                          sortOrder: "asc",
                        },
                        {
                          createdAt: "asc",
                        },
                      ],
                    },

                    optionGroups: {
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

                          orderBy: [
                            {
                              sortOrder: "asc",
                            },
                            {
                              createdAt: "asc",
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },

        branding: true,
      },
    });
  }

  /**
   * Find a catalog by ID.
   *
   * Used when attaching a catalog
   * to a QR code.
   */
  async findCatalogById(
    catalogId: string
  ) {
    return prisma.catalog.findUnique({
      where: {
        id: catalogId,
      },

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

  /**
   * Find all QR codes belonging to a business.
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

  /**
   * Update QR code.
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
   * Soft delete QR code.
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
   * Increment QR scan count.
   *
   * Kept for compatibility with
   * existing analytics functionality.
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