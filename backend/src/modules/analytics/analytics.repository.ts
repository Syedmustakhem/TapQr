import {
  Prisma,
} from "@prisma/client";

import { prisma } from "../../config/prisma";

import {
  RecordScanInput,
} from "./analytics.types";

export class AnalyticsRepository {

  /**
   * Record one QR scan.
   *
   * The scan event and QR scan counter are updated
   * inside one transaction.
   */
  async recordScan(
    data: RecordScanInput
  ) {
    return prisma.$transaction(
      async (tx) => {

        const scan =
          await tx.scanEvent.create({
            data: {
              qrCodeId:
                data.qrCodeId,

              ipAddress:
                data.ipAddress,

              userAgent:
                data.userAgent,

              referrer:
                data.referrer,

              browser:
                data.browser,

              device:
                data.device,

              operatingSystem:
                data.operatingSystem,
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

        return scan;
      }
    );
  }

  /**
   * Get QR codes belonging to a business.
   *
   * If qrCodeId is supplied, it is additionally
   * restricted to this business.
   */
  async getBusinessQrCodes(
    businessId: string,
    qrCodeId?: string
  ) {
    return prisma.qRCode.findMany({
      where: {
        businessId,

        deletedAt: null,

        ...(qrCodeId
          ? {
              id: qrCodeId,
            }
          : {}),
      },

      select: {
        id: true,

        name: true,

        shortCode: true,

        scanCount: true,

        status: true,

        createdAt: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Count scans for a set of QR codes.
   */
  async countScans(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    if (
      qrCodeIds.length === 0
    ) {
      return 0;
    }

    return prisma.scanEvent.count({
      where: {
        qrCodeId: {
          in: qrCodeIds,
        },

        scannedAt: {
          gte: startDate,

          lt: endDate,
        },
      },
    });
  }

  /**
   * Daily scan aggregation.
   *
   * PostgreSQL performs the grouping.
   * We do NOT load every ScanEvent into Node.js.
   */
  async getDailyScans(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    if (
      qrCodeIds.length === 0
    ) {
      return [];
    }

    return prisma.$queryRaw<
      Array<{
        date: Date;
        scans: bigint;
      }>
    >(
      Prisma.sql`
        SELECT
          DATE_TRUNC(
            'day',
            "scannedAt"
          ) AS date,

          COUNT(*)::bigint AS scans

        FROM "ScanEvent"

        WHERE
          "qrCodeId" IN (${Prisma.join(
            qrCodeIds
          )})

          AND "scannedAt" >= ${startDate}

          AND "scannedAt" < ${endDate}

        GROUP BY
          DATE_TRUNC(
            'day',
            "scannedAt"
          )

        ORDER BY date ASC
      `
    );
  }

  /**
   * City analytics.
   */
  async getCities(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    if (
      qrCodeIds.length === 0
    ) {
      return [];
    }

    return prisma.scanEvent.groupBy({
      by: ["city"],

      where: {
        qrCodeId: {
          in: qrCodeIds,
        },

        scannedAt: {
          gte: startDate,

          lt: endDate,
        },

        city: {
          not: null,
        },
      },

      _count: {
        _all: true,
      },

      orderBy: {
        _count: {
          city: "desc",
        },
      },

      take: 10,
    });
  }

  /**
   * Country analytics.
   */
  async getCountries(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    if (
      qrCodeIds.length === 0
    ) {
      return [];
    }

    return prisma.scanEvent.groupBy({
      by: ["country"],

      where: {
        qrCodeId: {
          in: qrCodeIds,
        },

        scannedAt: {
          gte: startDate,

          lt: endDate,
        },

        country: {
          not: null,
        },
      },

      _count: {
        _all: true,
      },

      orderBy: {
        _count: {
          country: "desc",
        },
      },

      take: 10,
    });
  }

  /**
   * Device analytics.
   */
  async getDevices(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    if (
      qrCodeIds.length === 0
    ) {
      return [];
    }

    return prisma.scanEvent.groupBy({
      by: ["device"],

      where: {
        qrCodeId: {
          in: qrCodeIds,
        },

        scannedAt: {
          gte: startDate,

          lt: endDate,
        },

        device: {
          not: null,
        },
      },

      _count: {
        _all: true,
      },

      orderBy: {
        _count: {
          device: "desc",
        },
      },

      take: 10,
    });
  }

  /**
   * Browser analytics.
   */
  async getBrowsers(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    if (
      qrCodeIds.length === 0
    ) {
      return [];
    }

    return prisma.scanEvent.groupBy({
      by: ["browser"],

      where: {
        qrCodeId: {
          in: qrCodeIds,
        },

        scannedAt: {
          gte: startDate,

          lt: endDate,
        },

        browser: {
          not: null,
        },
      },

      _count: {
        _all: true,
      },

      orderBy: {
        _count: {
          browser: "desc",
        },
      },

      take: 10,
    });
  }

  /**
   * Operating system analytics.
   */
  async getOperatingSystems(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    if (
      qrCodeIds.length === 0
    ) {
      return [];
    }

    return prisma.scanEvent.groupBy({
      by: ["operatingSystem"],

      where: {
        qrCodeId: {
          in: qrCodeIds,
        },

        scannedAt: {
          gte: startDate,

          lt: endDate,
        },

        operatingSystem: {
          not: null,
        },
      },

      _count: {
        _all: true,
      },

      orderBy: {
        _count: {
          operatingSystem: "desc",
        },
      },

      take: 10,
    });
  }

  /**
   * Recent scans.
   *
   * Always limited.
   */
  async getRecentScans(
    qrCodeIds: string[],
    limit = 10
  ) {
    if (
      qrCodeIds.length === 0
    ) {
      return [];
    }

    return prisma.scanEvent.findMany({
      where: {
        qrCodeId: {
          in: qrCodeIds,
        },
      },

      select: {
        id: true,

        qrCodeId: true,

        city: true,

        country: true,

        device: true,

        browser: true,

        operatingSystem: true,

        referrer: true,

        scannedAt: true,
      },

      orderBy: {
        scannedAt: "desc",
      },

      take: Math.min(
        Math.max(limit, 1),
        50
      ),
    });
  }
}