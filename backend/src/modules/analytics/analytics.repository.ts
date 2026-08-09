import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { CreateScanEventDTO } from "./analytics.types";

export class AnalyticsRepository {

  /**
   * Creates a scan event and increments the QR scan counter
   * inside one database transaction.
   */
  async createScanEventAndIncrementCount(
    data: CreateScanEventDTO
  ) {
    return prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {

        const scanEvent =
          await tx.scanEvent.create({
            data: {
              qrCode: {
                connect: {
                  id: data.qrCodeId,
                },
              },

              ipAddress: data.ipAddress,
              country: data.country,
              city: data.city,
              browser: data.browser,
              device: data.device,
              operatingSystem:
                data.operatingSystem,
              referrer: data.referrer,
              userAgent: data.userAgent,
            },
          });

        await tx.qRCode.update({
          where: {
            id: data.qrCodeId,
          },

          data: {
            scanCount: {
              increment: 1,
            },
          },
        });

        return scanEvent;
      }
    );
  }

  /**
   * Get all scans for one QR code.
   */
  async findByQRCodeId(
    qrCodeId: string
  ) {
    return prisma.scanEvent.findMany({
      where: {
        qrCodeId,
      },

      orderBy: {
        scannedAt: "desc",
      },
    });
  }

  /**
   * Count scans for one QR code.
   */
  async countByQRCodeId(
    qrCodeId: string
  ) {
    return prisma.scanEvent.count({
      where: {
        qrCodeId,
      },
    });
  }

  /**
   * Count scans belonging to a business.
   */
  async countByBusinessId(
    businessId: string
  ) {
    return prisma.scanEvent.count({
      where: {
        qrCode: {
          businessId,
        },
      },
    });
  }

  /**
   * Get business scan events.
   */
  async findByBusinessId(
    businessId: string
  ) {
    return prisma.scanEvent.findMany({
      where: {
        qrCode: {
          businessId,
        },
      },

      include: {
        qrCode: {
          select: {
            id: true,
            name: true,
            shortCode: true,
          },
        },
      },

      orderBy: {
        scannedAt: "desc",
      },
    });
  }

  /**
   * Get scans for a QR code within a date range.
   */
  async findByQRCodeIdAndDateRange(
    qrCodeId: string,
    from?: Date,
    to?: Date
  ) {
    return prisma.scanEvent.findMany({
      where: {
        qrCodeId,

        ...(from || to
          ? {
              scannedAt: {
                ...(from
                  ? {
                      gte: from,
                    }
                  : {}),

                ...(to
                  ? {
                      lte: to,
                    }
                  : {}),
              },
            }
          : {}),
      },

      orderBy: {
        scannedAt: "desc",
      },
    });
  }

  /**
   * Get business scans within a date range.
   */
  async findByBusinessIdAndDateRange(
    businessId: string,
    from?: Date,
    to?: Date
  ) {
    return prisma.scanEvent.findMany({
      where: {
        qrCode: {
          businessId,
        },

        ...(from || to
          ? {
              scannedAt: {
                ...(from
                  ? {
                      gte: from,
                    }
                  : {}),

                ...(to
                  ? {
                      lte: to,
                    }
                  : {}),
              },
            }
          : {}),
      },

      include: {
        qrCode: {
          select: {
            id: true,
            name: true,
            shortCode: true,
          },
        },
      },

      orderBy: {
        scannedAt: "desc",
      },
    });
  }
}