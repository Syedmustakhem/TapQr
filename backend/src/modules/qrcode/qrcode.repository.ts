import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

export class QRCodeRepository {
  /**
   * ============================================================
   * CREATE
   * ============================================================
   */

  async create(
    data: Prisma.QRCodeCreateInput
  ) {
    return prisma.qRCode.create({
      data,
    });
  }

  /**
   * ============================================================
   * FIND BY ID
   * ============================================================
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
   * ============================================================
   * FIND BY SHORT CODE
   * ============================================================
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
   * ============================================================
   * FIND CATALOG
   * ============================================================
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
   * ============================================================
   * FIND BUSINESS QR CODES
   * ============================================================
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
   * ============================================================
   * UPDATE
   * ============================================================
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
   * ============================================================
   * SOFT DELETE
   * ============================================================
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
   * ============================================================
   * SCAN COUNT
   * ============================================================
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

  /**
   * ============================================================
   * QR BRANDING
   * ============================================================
   */

  async findBranding(
    qrCodeId: string
  ) {
    return prisma.qRBranding.findUnique({
      where: {
        qrCodeId,
      },
    });
  }

  /**
   * Create QR branding.
   */
  async createBranding(
    qrCodeId: string,
    data: Prisma.QRBrandingCreateInput
  ) {
    return prisma.qRBranding.create({
      data: {
        ...data,

        qrCode: {
          connect: {
            id: qrCodeId,
          },
        },
      },
    });
  }

  /**
   * Create or update QR branding.
   */
  async upsertBranding(
    qrCodeId: string,
    data: Prisma.QRBrandingUpdateInput
  ) {
    return prisma.qRBranding.upsert({
      where: {
        qrCodeId,
      },

      create: {
        qrCode: {
          connect: {
            id: qrCodeId,
          },
        },
      },

      update: data,
    });
  }
}