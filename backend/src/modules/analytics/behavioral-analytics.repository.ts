import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export class BehavioralAnalyticsRepository {
  async getBusinessQrIds(businessId: string) {
    return prisma.qRCode.findMany({
      where: { businessId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getBehaviorOverview(qrCodeIds: string[], startDate: Date, endDate: Date) {
    if (!qrCodeIds.length) return {
      visitors: 0, oneTimeVisitors: 0, returningVisitors: 0,
      highlyEngagedVisitors: 0, converters: 0, repeatConverters: 0,
      averageVisitIntervalSeconds: 0, averageTimeToConversionSeconds: 0,
    };

    const rows = await prisma.$queryRaw<Array<any>>(Prisma.sql`
      WITH visitor_period AS (
        SELECT "visitorKey", COUNT(*)::int AS scan_count
        FROM "QRRuleMatch"
        WHERE "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL AND "visitorKey" <> ''
          AND "matchedAt" >= ${startDate} AND "matchedAt" < ${endDate}
        GROUP BY "visitorKey"
      ),
      visitor_sequence AS (
        SELECT "visitorKey", "matchedAt",
          LAG("matchedAt") OVER (PARTITION BY "visitorKey" ORDER BY "matchedAt") AS previous_scan
        FROM "QRRuleMatch"
        WHERE "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL AND "visitorKey" <> ''
          AND "matchedAt" >= ${startDate} AND "matchedAt" < ${endDate}
      ),
      converters AS (
        SELECT c.id, c."visitorKey", c."convertedAt", vp.scan_count
        FROM "QRConversion" c
        LEFT JOIN visitor_period vp ON vp."visitorKey" = c."visitorKey"
        WHERE c."qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND c."convertedAt" >= ${startDate} AND c."convertedAt" < ${endDate}
      ),
      first_scans AS (
        SELECT "visitorKey", MIN("matchedAt") AS first_scan_at
        FROM "QRRuleMatch"
        WHERE "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL AND "visitorKey" <> ''
          AND "matchedAt" < ${endDate}
        GROUP BY "visitorKey"
      ),
      conversion_times AS (
        SELECT c."visitorKey",
          EXTRACT(EPOCH FROM (c."convertedAt" - fs.first_scan_at)) AS seconds_to_conversion
        FROM converters c
        INNER JOIN first_scans fs ON fs."visitorKey" = c."visitorKey"
        WHERE c."visitorKey" IS NOT NULL AND c."visitorKey" <> ''
          AND fs.first_scan_at <= c."convertedAt"
      )
      SELECT
        COUNT(*)::bigint AS visitors,
        COUNT(*) FILTER (WHERE scan_count = 1)::bigint AS one_time_visitors,
        COUNT(*) FILTER (WHERE scan_count >= 2)::bigint AS returning_visitors,
        COUNT(*) FILTER (WHERE scan_count >= 5)::bigint AS highly_engaged_visitors,
        (SELECT COUNT(DISTINCT "visitorKey")::bigint FROM converters
          WHERE "visitorKey" IS NOT NULL AND "visitorKey" <> '') AS converters,
        (SELECT COUNT(DISTINCT "visitorKey")::bigint FROM converters
          WHERE "visitorKey" IS NOT NULL AND "visitorKey" <> '' AND scan_count >= 2) AS repeat_converters,
        (SELECT AVG(EXTRACT(EPOCH FROM ("matchedAt" - previous_scan))) FROM visitor_sequence
          WHERE previous_scan IS NOT NULL) AS avg_visit_interval_seconds,
        (SELECT AVG(seconds_to_conversion) FROM conversion_times) AS avg_time_to_conversion_seconds
      FROM visitor_period
    `);
    const r = rows[0];
    return {
      visitors: Number(r?.visitors ?? 0),
      oneTimeVisitors: Number(r?.one_time_visitors ?? 0),
      returningVisitors: Number(r?.returning_visitors ?? 0),
      highlyEngagedVisitors: Number(r?.highly_engaged_visitors ?? 0),
      converters: Number(r?.converters ?? 0),
      repeatConverters: Number(r?.repeat_converters ?? 0),
      averageVisitIntervalSeconds: Number(r?.avg_visit_interval_seconds ?? 0),
      averageTimeToConversionSeconds: Number(r?.avg_time_to_conversion_seconds ?? 0),
    };
  }

  async getSegments(qrCodeIds: string[], startDate: Date, endDate: Date) {
    if (!qrCodeIds.length) return [];
    return prisma.$queryRaw<Array<any>>(Prisma.sql`
      WITH visitor_stats AS (
        SELECT "visitorKey", COUNT(*)::int AS scan_count
        FROM "QRRuleMatch"
        WHERE "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL AND "visitorKey" <> ''
          AND "matchedAt" >= ${startDate} AND "matchedAt" < ${endDate}
        GROUP BY "visitorKey"
      ),
      conversion_stats AS (
        SELECT "visitorKey", COUNT(*)::int AS conversion_count
        FROM "QRConversion"
        WHERE "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL AND "visitorKey" <> ''
          AND "convertedAt" >= ${startDate} AND "convertedAt" < ${endDate}
        GROUP BY "visitorKey"
      ),
      classified AS (
        SELECT vs."visitorKey", vs.scan_count, COALESCE(cs.conversion_count, 0) AS conversion_count,
          CASE
            WHEN COALESCE(cs.conversion_count, 0) >= 2 THEN 'REPEAT_CONVERTER'
            WHEN COALESCE(cs.conversion_count, 0) >= 1 THEN 'CONVERTER'
            WHEN vs.scan_count >= 5 THEN 'HIGH_ENGAGEMENT'
            WHEN vs.scan_count >= 2 THEN 'RETURNING'
            ELSE 'ONE_TIME'
          END AS segment
        FROM visitor_stats vs LEFT JOIN conversion_stats cs ON cs."visitorKey" = vs."visitorKey"
      )
      SELECT segment, COUNT(*)::bigint AS visitors,
        COALESCE(SUM(conversion_count), 0)::bigint AS conversions
      FROM classified GROUP BY segment
      ORDER BY CASE segment
        WHEN 'ONE_TIME' THEN 1 WHEN 'RETURNING' THEN 2
        WHEN 'HIGH_ENGAGEMENT' THEN 3 WHEN 'CONVERTER' THEN 4
        WHEN 'REPEAT_CONVERTER' THEN 5 ELSE 6 END
    `);
  }

  async getScanIntervalDistribution(qrCodeIds: string[], startDate: Date, endDate: Date) {
    if (!qrCodeIds.length) return [];
    return prisma.$queryRaw<Array<any>>(Prisma.sql`
      WITH sequence AS (
        SELECT "visitorKey",
          EXTRACT(EPOCH FROM ("matchedAt" - LAG("matchedAt") OVER (
            PARTITION BY "visitorKey" ORDER BY "matchedAt"
          ))) AS interval_seconds
        FROM "QRRuleMatch"
        WHERE "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL AND "visitorKey" <> ''
          AND "matchedAt" >= ${startDate} AND "matchedAt" < ${endDate}
      )
      SELECT
        CASE
          WHEN interval_seconds < 3600 THEN '<1 hour'
          WHEN interval_seconds < 86400 THEN '1-24 hours'
          WHEN interval_seconds < 604800 THEN '1-7 days'
          WHEN interval_seconds < 2592000 THEN '8-30 days'
          ELSE '30+ days'
        END AS range,
        COUNT(DISTINCT "visitorKey")::bigint AS visitors
      FROM sequence
      WHERE interval_seconds IS NOT NULL
      GROUP BY 1
      ORDER BY CASE range
        WHEN '<1 hour' THEN 1 WHEN '1-24 hours' THEN 2
        WHEN '1-7 days' THEN 3 WHEN '8-30 days' THEN 4 ELSE 5 END
    `);
  }

  async getBehaviorByQr(qrCodeIds: string[], startDate: Date, endDate: Date) {
    if (!qrCodeIds.length) return [];
    return prisma.$queryRaw<Array<any>>(Prisma.sql`
      WITH visitor_stats AS (
        SELECT "qrCodeId", "visitorKey", COUNT(*)::int AS scan_count
        FROM "QRRuleMatch"
        WHERE "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL AND "visitorKey" <> ''
          AND "matchedAt" >= ${startDate} AND "matchedAt" < ${endDate}
        GROUP BY "qrCodeId", "visitorKey"
      ),
      converter_stats AS (
        SELECT DISTINCT "qrCodeId", "visitorKey"
        FROM "QRConversion"
        WHERE "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL AND "visitorKey" <> ''
          AND "convertedAt" >= ${startDate} AND "convertedAt" < ${endDate}
      )
      SELECT q.id AS qr_code_id, q.name AS qr_name,
        COUNT(DISTINCT vs."visitorKey")::bigint AS visitors,
        COUNT(DISTINCT vs."visitorKey") FILTER (WHERE vs.scan_count >= 2)::bigint AS returning_visitors,
        COUNT(DISTINCT cs."visitorKey")::bigint AS converters
      FROM "QRCode" q
      INNER JOIN visitor_stats vs ON vs."qrCodeId" = q.id
      LEFT JOIN converter_stats cs ON cs."qrCodeId" = q.id AND cs."visitorKey" = vs."visitorKey"
      WHERE q.id IN (${Prisma.join(qrCodeIds)})
      GROUP BY q.id, q.name
      ORDER BY visitors DESC
    `);
  }
}
