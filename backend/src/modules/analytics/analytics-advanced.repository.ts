import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export class AdvancedAnalyticsRepository {
  async getOwnedQRCode(businessId: string, qrCodeId: string) {
    return prisma.qRCode.findFirst({
      where: { id: qrCodeId, businessId, deletedAt: null },
      select: {
        id: true,
        name: true,
        shortCode: true,
        status: true,
        sourceType: true,
        placementLabel: true,
        locationLabel: true,
        campaignName: true,
        scanCount: true,
      },
    });
  }

  async getQrOverview(
    qrCodeId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const [
      totalScans,
      uniqueVisitors,
      totalConversions,
      uniqueConverters,
    ] = await Promise.all([
      prisma.scanEvent.count({
        where: {
          qrCodeId,
          scannedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),

      prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(DISTINCT "ipAddress")::bigint AS count
        FROM "ScanEvent"
        WHERE "qrCodeId" = ${qrCodeId}
          AND "scannedAt" >= ${startDate}
          AND "scannedAt" < ${endDate}
          AND "ipAddress" IS NOT NULL
          AND "ipAddress" <> ''
      `),

      prisma.qRConversion.count({
        where: {
          qrCodeId,
          convertedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),

      prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(DISTINCT "visitorKey")::bigint AS count
        FROM "QRConversion"
        WHERE "qrCodeId" = ${qrCodeId}
          AND "convertedAt" >= ${startDate}
          AND "convertedAt" < ${endDate}
          AND "visitorKey" IS NOT NULL
          AND "visitorKey" <> ''
      `),
    ]);

    return {
      totalScans,
      uniqueVisitors: Number(uniqueVisitors[0]?.count ?? 0),
      totalConversions,
      uniqueConverters: Number(uniqueConverters[0]?.count ?? 0),
    };
  }

  async getDailyScans(
    qrCodeId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return prisma.$queryRaw<
      Array<{ date: Date; scans: bigint }>
    >(Prisma.sql`
      SELECT
        DATE_TRUNC('day', "scannedAt") AS date,
        COUNT(*)::bigint AS scans
      FROM "ScanEvent"
      WHERE "qrCodeId" = ${qrCodeId}
        AND "scannedAt" >= ${startDate}
        AND "scannedAt" < ${endDate}
      GROUP BY DATE_TRUNC('day', "scannedAt")
      ORDER BY date ASC
    `);
  }

  async getDailyConversions(
    qrCodeId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return prisma.$queryRaw<
      Array<{ date: Date; conversions: bigint }>
    >(Prisma.sql`
      SELECT
        DATE_TRUNC('day', "convertedAt") AS date,
        COUNT(*)::bigint AS conversions
      FROM "QRConversion"
      WHERE "qrCodeId" = ${qrCodeId}
        AND "convertedAt" >= ${startDate}
        AND "convertedAt" < ${endDate}
      GROUP BY DATE_TRUNC('day', "convertedAt")
      ORDER BY date ASC
    `);
  }

  async getSourceBreakdown(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date,
  ) {
    if (!qrCodeIds.length) return [];

    return prisma.$queryRaw<
      Array<{ sourceType: string | null; scans: bigint }>
    >(Prisma.sql`
      SELECT
        COALESCE(
          "sourceTypeSnapshot"::text,
          'UNKNOWN'
        ) AS "sourceType",
        COUNT(*)::bigint AS scans
      FROM "ScanEvent"
      WHERE "qrCodeId" IN (${Prisma.join(qrCodeIds)})
        AND "scannedAt" >= ${startDate}
        AND "scannedAt" < ${endDate}
      GROUP BY COALESCE(
        "sourceTypeSnapshot"::text,
        'UNKNOWN'
      )
      ORDER BY scans DESC
    `);
  }

  async getQrIdsForBusiness(businessId: string) {
    const rows = await prisma.qRCode.findMany({
      where: {
        businessId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        sourceType: true,
        placementLabel: true,
        locationLabel: true,
        campaignName: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return rows;
  }

  async getGroupedScans(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date,
    field: "sourceTypeSnapshot" | "qrCodeId",
  ) {
    if (!qrCodeIds.length) return [];

    if (field === "qrCodeId") {
      return prisma.scanEvent.groupBy({
        by: ["qrCodeId"],
        where: {
          qrCodeId: {
            in: qrCodeIds,
          },
          scannedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
        _count: {
          _all: true,
        },
        orderBy: {
          _count: {
            qrCodeId: "desc",
          },
        },
      });
    }

    return prisma.scanEvent.groupBy({
      by: ["sourceTypeSnapshot"],
      where: {
        qrCodeId: {
          in: qrCodeIds,
        },
        scannedAt: {
          gte: startDate,
          lt: endDate,
        },
        sourceTypeSnapshot: {
          not: null,
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          sourceTypeSnapshot: "desc",
        },
      },
    });
  }

  async getConversionCounts(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date,
  ) {
    if (!qrCodeIds.length) return [];

    return prisma.qRConversion.groupBy({
      by: ["qrCodeId"],
      where: {
        qrCodeId: {
          in: qrCodeIds,
        },
        convertedAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          qrCodeId: "desc",
        },
      },
    });
  }

  async getConversionCountsByTypeForQr(
    qrCodeId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return prisma.qRConversion.groupBy({
      by: ["conversionType"],
      where: {
        qrCodeId,
        convertedAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          conversionType: "desc",
        },
      },
    });
  }

  async getRecentScans(
    qrCodeId: string,
    limit: number,
  ) {
    return prisma.scanEvent.findMany({
      where: {
        qrCodeId,
      },
      select: {
        id: true,
        country: true,
        city: true,
        device: true,
        browser: true,
        operatingSystem: true,
        referrer: true,
        sourceTypeSnapshot: true,
        scannedAt: true,
      },
      orderBy: {
        scannedAt: "desc",
      },
      take: limit,
    });
  }

  async getSourceMetrics(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date,
    key: "source" | "placement" | "location" | "campaign",
  ) {
    if (!qrCodeIds.length) return [];

    const qrs = await prisma.qRCode.findMany({
      where: {
        id: {
          in: qrCodeIds,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        sourceType: true,
        placementLabel: true,
        locationLabel: true,
        campaignName: true,
      },
    });

    const scans = await prisma.scanEvent.groupBy({
      by: ["qrCodeId"],
      where: {
        qrCodeId: {
          in: qrCodeIds,
        },
        scannedAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      _count: {
        _all: true,
      },
    });

    const conversions = await prisma.qRConversion.groupBy({
      by: ["qrCodeId"],
      where: {
        qrCodeId: {
          in: qrCodeIds,
        },
        convertedAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      _count: {
        _all: true,
      },
    });

    const scanMap = new Map(
      scans.map((x) => [
        x.qrCodeId,
        x._count._all,
      ]),
    );

    const conversionMap = new Map(
      conversions.map((x) => [
        x.qrCodeId,
        x._count._all,
      ]),
    );

    const valueOf = (
      qr: (typeof qrs)[number],
    ) => {
      if (key === "source") {
        return qr.sourceType ?? "UNKNOWN";
      }

      if (key === "placement") {
        return (
          qr.placementLabel?.trim() ||
          "UNSPECIFIED"
        );
      }

      if (key === "location") {
        return (
          qr.locationLabel?.trim() ||
          "UNSPECIFIED"
        );
      }

      return (
        qr.campaignName?.trim() ||
        "UNSPECIFIED"
      );
    };

    const grouped = new Map<
      string,
      {
        scans: number;
        conversions: number;
        qrCodes: number;
      }
    >();

    for (const qr of qrs) {
      const value = valueOf(qr);

      const current = grouped.get(value) ?? {
        scans: 0,
        conversions: 0,
        qrCodes: 0,
      };

      current.scans +=
        scanMap.get(qr.id) ?? 0;

      current.conversions +=
        conversionMap.get(qr.id) ?? 0;

      current.qrCodes += 1;

      grouped.set(value, current);
    }

    return [...grouped.entries()]
      .map(([name, value]) => ({
        name,
        ...value,
      }))
      .sort(
        (a, b) => b.scans - a.scans,
      );
  }

  /**
   * Campaign analytics foundation.
   *
   * Campaign membership is authoritative through
   * QRCode.campaignId.
   *
   * Legacy QRCode.campaignName is deliberately
   * not used to identify campaign membership.
   */
  async getOwnedCampaignWithQRCodes(
    businessId: string,
    campaignId: string,
  ) {
    return prisma.campaign.findFirst({
      where: {
        id: campaignId,
        businessId,
      },
      select: {
        id: true,
        businessId: true,
        name: true,
        description: true,
        status: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
        updatedAt: true,

        qrCodes: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            shortCode: true,
            status: true,
            scanCount: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  async getCampaignOverview(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date,
  ) {
    if (!qrCodeIds.length) {
      return {
        totalScans: 0,
        uniqueVisitors: 0,
        totalConversions: 0,
        uniqueConverters: 0,
        conversionValue: 0,
        conversionCurrencies: [] as Array<{
          currency: string | null;
          value: number;
        }>,
      };
    }

    const [
      totalScans,
      uniqueVisitors,
      totalConversions,
      uniqueConverters,
      conversionValues,
    ] = await Promise.all([
      prisma.scanEvent.count({
        where: {
          qrCodeId: {
            in: qrCodeIds,
          },
          scannedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),

      prisma.$queryRaw<
        Array<{ count: bigint }>
      >(Prisma.sql`
        SELECT COUNT(
          DISTINCT "visitorKey"
        )::bigint AS count
        FROM "QRRuleMatch"
        WHERE "qrCodeId" IN (
          ${Prisma.join(qrCodeIds)}
        )
          AND "matchedAt" >= ${startDate}
          AND "matchedAt" < ${endDate}
          AND "visitorKey" IS NOT NULL
          AND "visitorKey" <> ''
      `),

      prisma.qRConversion.count({
        where: {
          qrCodeId: {
            in: qrCodeIds,
          },
          convertedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),

      prisma.$queryRaw<
        Array<{ count: bigint }>
      >(Prisma.sql`
        SELECT COUNT(
          DISTINCT "visitorKey"
        )::bigint AS count
        FROM "QRConversion"
        WHERE "qrCodeId" IN (
          ${Prisma.join(qrCodeIds)}
        )
          AND "convertedAt" >= ${startDate}
          AND "convertedAt" < ${endDate}
          AND "visitorKey" IS NOT NULL
          AND "visitorKey" <> ''
      `),

      prisma.$queryRaw<
        Array<{
          currency: string | null;
          value: Prisma.Decimal;
        }>
      >(Prisma.sql`
        SELECT
          "currency",
          COALESCE(
            SUM("value"),
            0
          ) AS value
        FROM "QRConversion"
        WHERE "qrCodeId" IN (
          ${Prisma.join(qrCodeIds)}
        )
          AND "convertedAt" >= ${startDate}
          AND "convertedAt" < ${endDate}
          AND "value" IS NOT NULL
        GROUP BY "currency"
        ORDER BY "currency" ASC
      `),
    ]);

    const conversionCurrencies =
      conversionValues.map((row) => ({
        currency: row.currency,
        value: Number(row.value),
      }));

    return {
      totalScans,

      uniqueVisitors: Number(
        uniqueVisitors[0]?.count ?? 0,
      ),

      totalConversions,

      uniqueConverters: Number(
        uniqueConverters[0]?.count ?? 0,
      ),

      conversionValue:
        conversionCurrencies.length === 1
          ? conversionCurrencies[0].value
          : conversionCurrencies.reduce(
              (sum, row) =>
                sum + row.value,
              0,
            ),

      conversionCurrencies,
    };
  }
  async getCampaignQRPerformance(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date,
  ) {
    if (!qrCodeIds.length) {
      return {
        scans: [],
        visitors: [],
        conversions: [],
        converters: [],
        values: [],
      };
    }

    const [scans, visitors, conversions, converters, values] =
      await Promise.all([
        prisma.$queryRaw<
          Array<{
            qrCodeId: string;
            scans: bigint;
          }>
        >(Prisma.sql`
          SELECT
            "qrCodeId",
            COUNT(*)::bigint AS scans
          FROM "ScanEvent"
          WHERE "qrCodeId" IN (${Prisma.join(qrCodeIds)})
            AND "scannedAt" >= ${startDate}
            AND "scannedAt" < ${endDate}
          GROUP BY "qrCodeId"
        `),

        prisma.$queryRaw<
          Array<{
            qrCodeId: string;
            visitors: bigint;
          }>
        >(Prisma.sql`
          SELECT
            "qrCodeId",
            COUNT(DISTINCT "visitorKey")::bigint AS visitors
          FROM "QRRuleMatch"
          WHERE "qrCodeId" IN (${Prisma.join(qrCodeIds)})
            AND "matchedAt" >= ${startDate}
            AND "matchedAt" < ${endDate}
            AND "visitorKey" IS NOT NULL
            AND "visitorKey" <> ''
          GROUP BY "qrCodeId"
        `),

        prisma.$queryRaw<
          Array<{
            qrCodeId: string;
            conversions: bigint;
          }>
        >(Prisma.sql`
          SELECT
            "qrCodeId",
            COUNT(*)::bigint AS conversions
          FROM "QRConversion"
          WHERE "qrCodeId" IN (${Prisma.join(qrCodeIds)})
            AND "convertedAt" >= ${startDate}
            AND "convertedAt" < ${endDate}
          GROUP BY "qrCodeId"
        `),

        prisma.$queryRaw<
          Array<{
            qrCodeId: string;
            converters: bigint;
          }>
        >(Prisma.sql`
          SELECT
            "qrCodeId",
            COUNT(DISTINCT "visitorKey")::bigint AS converters
          FROM "QRConversion"
          WHERE "qrCodeId" IN (${Prisma.join(qrCodeIds)})
            AND "convertedAt" >= ${startDate}
            AND "convertedAt" < ${endDate}
            AND "visitorKey" IS NOT NULL
            AND "visitorKey" <> ''
          GROUP BY "qrCodeId"
        `),

        prisma.$queryRaw<
          Array<{
            qrCodeId: string;
            value: number | null;
          }>
        >(Prisma.sql`
          SELECT
            "qrCodeId",
            COALESCE(SUM("value"), 0)::double precision AS value
          FROM "QRConversion"
          WHERE "qrCodeId" IN (${Prisma.join(qrCodeIds)})
            AND "convertedAt" >= ${startDate}
            AND "convertedAt" < ${endDate}
            AND "value" IS NOT NULL
          GROUP BY "qrCodeId"
        `),
      ]);

    return {
      scans,
      visitors,
      conversions,
      converters,
      values,
    };
  }

    /**
   * Campaign conversion and attribution analytics.
   *
   * Campaign membership is determined exclusively through
   * QRCode.campaignId. Attribution uses the existing
   * QRConversion fields populated by the conversion pipeline.
   */
  async getCampaignConversionAttribution(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date,
  ) {
    if (!qrCodeIds.length) {
      return {
        totalConversions: 0,
        attributedConversions: 0,
        conversionTypes: [],
        byRule: [],
        byExperiment: [],
        byVariant: [],
        valuesByCurrency: [],
      };
    }

    const [
      totalConversions,
      attributedConversions,
      conversionTypes,
      byRule,
      byExperiment,
      byVariant,
      valuesByCurrency,
    ] = await Promise.all([
      prisma.qRConversion.count({
        where: {
          qrCodeId: {
            in: qrCodeIds,
          },
          convertedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),

      prisma.qRConversion.count({
        where: {
          qrCodeId: {
            in: qrCodeIds,
          },
          convertedAt: {
            gte: startDate,
            lt: endDate,
          },
          OR: [
            {
              ruleId: {
                not: null,
              },
            },
            {
              experimentId: {
                not: null,
              },
            },
            {
              variantId: {
                not: null,
              },
            },
          ],
        },
      }),

      prisma.qRConversion.groupBy({
        by: ["conversionType"],
        where: {
          qrCodeId: {
            in: qrCodeIds,
          },
          convertedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
        _count: {
          _all: true,
        },
      }),

      prisma.qRConversion.groupBy({
        by: ["ruleId", "ruleVersion"],
        where: {
          qrCodeId: {
            in: qrCodeIds,
          },
          convertedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
        _count: {
          _all: true,
        },
      }),

      prisma.qRConversion.groupBy({
        by: ["experimentId"],
        where: {
          qrCodeId: {
            in: qrCodeIds,
          },
          convertedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
        _count: {
          _all: true,
        },
      }),

      prisma.qRConversion.groupBy({
        by: ["variantId"],
        where: {
          qrCodeId: {
            in: qrCodeIds,
          },
          convertedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
        _count: {
          _all: true,
        },
      }),

      prisma.qRConversion.groupBy({
        by: ["currency"],
        where: {
          qrCodeId: {
            in: qrCodeIds,
          },
          convertedAt: {
            gte: startDate,
            lt: endDate,
          },
          value: {
            not: null,
          },
        },
        _sum: {
          value: true,
        },
      }),
    ]);

    return {
      totalConversions,
      attributedConversions,
      conversionTypes,
      byRule,
      byExperiment,
      byVariant,
      valuesByCurrency,
    };
  }
  /**
   * Campaign daily analytics trends.
   *
   * Returns daily:
   * - scans
   * - unique visitors
   * - conversions
   */
  async getCampaignDailyTrends(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date,
  ) {
    if (!qrCodeIds.length) {
      return {
        scans: [],
        visitors: [],
        conversions: [],
      };
    }

    const [
      scans,
      visitors,
      conversions,
    ] = await Promise.all([
      prisma.$queryRaw<
        Array<{
          date: Date;
          scans: bigint;
        }>
      >(Prisma.sql`
        SELECT
          DATE_TRUNC(
            'day',
            "scannedAt"
          ) AS date,
          COUNT(*)::bigint AS scans
        FROM "ScanEvent"
        WHERE "qrCodeId" IN (
          ${Prisma.join(qrCodeIds)}
        )
          AND "scannedAt" >= ${startDate}
          AND "scannedAt" < ${endDate}
        GROUP BY DATE_TRUNC(
          'day',
          "scannedAt"
        )
        ORDER BY date ASC
      `),

      prisma.$queryRaw<
        Array<{
          date: Date;
          visitors: bigint;
        }>
      >(Prisma.sql`
        SELECT
          DATE_TRUNC(
            'day',
            "matchedAt"
          ) AS date,
          COUNT(
            DISTINCT "visitorKey"
          )::bigint AS visitors
        FROM "QRRuleMatch"
        WHERE "qrCodeId" IN (
          ${Prisma.join(qrCodeIds)}
        )
          AND "matchedAt" >= ${startDate}
          AND "matchedAt" < ${endDate}
          AND "visitorKey" IS NOT NULL
          AND "visitorKey" <> ''
        GROUP BY DATE_TRUNC(
          'day',
          "matchedAt"
        )
        ORDER BY date ASC
      `),

      prisma.$queryRaw<
        Array<{
          date: Date;
          conversions: bigint;
        }>
      >(Prisma.sql`
        SELECT
          DATE_TRUNC(
            'day',
            "convertedAt"
          ) AS date,
          COUNT(*)::bigint AS conversions
        FROM "QRConversion"
        WHERE "qrCodeId" IN (
          ${Prisma.join(qrCodeIds)}
        )
          AND "convertedAt" >= ${startDate}
          AND "convertedAt" < ${endDate}
        GROUP BY DATE_TRUNC(
          'day',
          "convertedAt"
        )
        ORDER BY date ASC
      `),
    ]);

    return {
      scans,
      visitors,
      conversions,
    };
  }
}