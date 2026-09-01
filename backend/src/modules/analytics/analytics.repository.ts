import {
  Prisma,
} from "@prisma/client";

import {
  prisma,
} from "../../config/prisma";

import {
  RecordScanInput,
} from "./analytics.types";

export class AnalyticsRepository {
  /*
  |--------------------------------------------------------------------------
  | RECORD SCAN
  |--------------------------------------------------------------------------
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

  /*
  |--------------------------------------------------------------------------
  | BUSINESS QR CODES
  |--------------------------------------------------------------------------
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

        type: true,

        experienceType: true,

        createdAt: true,

        updatedAt: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | TOTAL SCANS
  |--------------------------------------------------------------------------
  */

  async countScans(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    if (qrCodeIds.length === 0) {
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

  /*
  |--------------------------------------------------------------------------
  | UNIQUE VISITORS
  |--------------------------------------------------------------------------
  |
  | Uses distinct IP addresses recorded by the existing
  | ScanEvent model.
  |
  | This is a visitor estimate, not a person identity system.
  |
  */

  async countUniqueVisitors(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    if (qrCodeIds.length === 0) {
      return 0;
    }

    const result =
      await prisma.$queryRaw<
        Array<{
          count: bigint;
        }>
      >(
        Prisma.sql`
          SELECT
            COUNT(
              DISTINCT "ipAddress"
            )::bigint AS count
          FROM "ScanEvent"
          WHERE
            "qrCodeId" IN (
              ${Prisma.join(
                qrCodeIds
              )}
            )
            AND "scannedAt" >= ${startDate}
            AND "scannedAt" < ${endDate}
            AND "ipAddress" IS NOT NULL
            AND "ipAddress" <> ''
        `
      );

    return Number(
      result[0]?.count ?? 0
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DAILY SCANS
  |--------------------------------------------------------------------------
  */

  async getDailyScans(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    if (qrCodeIds.length === 0) {
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
          "qrCodeId" IN (
            ${Prisma.join(
              qrCodeIds
            )}
          )

          AND "scannedAt" >= ${startDate}

          AND "scannedAt" < ${endDate}

        GROUP BY
          DATE_TRUNC(
            'day',
            "scannedAt"
          )

        ORDER BY
          date ASC
      `
    );
  }

  /*
  |--------------------------------------------------------------------------
  | COUNTRIES
  |--------------------------------------------------------------------------
  */

  async getCountries(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    if (qrCodeIds.length === 0) {
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

  /*
  |--------------------------------------------------------------------------
  | CITIES
  |--------------------------------------------------------------------------
  */

  async getCities(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    if (qrCodeIds.length === 0) {
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

  /*
  |--------------------------------------------------------------------------
  | DEVICES
  |--------------------------------------------------------------------------
  */

  async getDevices(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    if (qrCodeIds.length === 0) {
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

  /*
  |--------------------------------------------------------------------------
  | BROWSERS
  |--------------------------------------------------------------------------
  */

  async getBrowsers(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    if (qrCodeIds.length === 0) {
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

  /*
  |--------------------------------------------------------------------------
  | OPERATING SYSTEMS
  |--------------------------------------------------------------------------
  */

  async getOperatingSystems(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    if (qrCodeIds.length === 0) {
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

  /*
  |--------------------------------------------------------------------------
  | REFERRERS
  |--------------------------------------------------------------------------
  */

  async getReferrers(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    if (qrCodeIds.length === 0) {
      return [];
    }

    return prisma.scanEvent.groupBy({
      by: ["referrer"],

      where: {
        qrCodeId: {
          in: qrCodeIds,
        },

        scannedAt: {
          gte: startDate,

          lt: endDate,
        },

        referrer: {
          not: null,
        },
      },

      _count: {
        _all: true,
      },

      orderBy: {
        _count: {
          referrer: "desc",
        },
      },

      take: 10,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | RECENT SCANS
  |--------------------------------------------------------------------------
  */

  async getRecentScans(
    qrCodeIds: string[],
    limit = 10
  ) {
    if (qrCodeIds.length === 0) {
      return [];
    }

    const safeLimit =
      Math.min(
        Math.max(
          Math.floor(limit),
          1
        ),
        50
      );

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

      take: safeLimit,
    });
  }
}