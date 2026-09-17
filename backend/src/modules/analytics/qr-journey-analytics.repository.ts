import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export class QRJourneyAnalyticsRepository {
  async getBusinessQrIds(businessId: string) {
    return prisma.qRCode.findMany({
      where: {
        businessId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getJourneyOverview(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date,
  ) {
    if (!qrCodeIds.length) {
      return {
        uniqueVisitors: 0,
        firstTimeVisitors: 0,
        repeatVisitors: 0,
        repeatVisitorRate: 0,
        totalIdentifiedScans: 0,
        averageScansPerVisitor: 0,
        totalConversions: 0,
        uniqueConverters: 0,
        visitorConversionRate: 0,
        conversionsAfterRepeatVisit: 0,
        averageTimeToConversionSeconds: 0,
      };
    }

    const rows = await prisma.$queryRaw<
      Array<{
        unique_visitors: bigint;
        first_time_visitors: bigint;
        repeat_visitors: bigint;
        total_identified_scans: bigint;
        total_conversions: bigint;
        unique_converters: bigint;
        conversions_after_repeat: bigint;
        avg_time_to_conversion_seconds: number | null;
      }>
    >(Prisma.sql`
      WITH period_visitors AS (
        SELECT
          "visitorKey",
          COUNT(*)::bigint AS period_scans,
          MIN("matchedAt") AS first_period_scan
        FROM "QRRuleMatch"
        WHERE
          "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL
          AND "visitorKey" <> ''
          AND "matchedAt" >= ${startDate}
          AND "matchedAt" < ${endDate}
        GROUP BY "visitorKey"
      ),
      all_before AS (
        SELECT
          "visitorKey",
          MIN("matchedAt") AS first_seen
        FROM "QRRuleMatch"
        WHERE
          "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL
          AND "visitorKey" <> ''
          AND "matchedAt" < ${startDate}
        GROUP BY "visitorKey"
      ),
      visitor_conversions AS (
        SELECT
          c.id,
          c."visitorKey",
          c."convertedAt"
        FROM "QRConversion" c
        WHERE
          c."qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND c."convertedAt" >= ${startDate}
          AND c."convertedAt" < ${endDate}
      ),
      first_scan AS (
        SELECT
          "visitorKey",
          MIN("matchedAt") AS first_scan_at
        FROM "QRRuleMatch"
        WHERE
          "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL
          AND "visitorKey" <> ''
          AND "matchedAt" < ${endDate}
        GROUP BY "visitorKey"
      ),
      visitor_scan_before_conversion AS (
        SELECT
          c.id AS conversion_id,
          c."visitorKey",
          c."convertedAt",
          COUNT(m.id)::int AS scans_before_conversion
        FROM visitor_conversions c
        LEFT JOIN "QRRuleMatch" m
          ON m."visitorKey" = c."visitorKey"
          AND m."qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND m."matchedAt" <= c."convertedAt"
        WHERE
          c."visitorKey" IS NOT NULL
          AND c."visitorKey" <> ''
        GROUP BY c.id, c."visitorKey", c."convertedAt"
      ),
      conversion_time AS (
        SELECT
          vc.id,
          EXTRACT(
            EPOCH FROM (vc."convertedAt" - fs.first_scan_at)
          ) AS seconds_to_conversion
        FROM visitor_conversions vc
        INNER JOIN first_scan fs
          ON fs."visitorKey" = vc."visitorKey"
        WHERE vc."visitorKey" IS NOT NULL
          AND vc."visitorKey" <> ''
          AND fs.first_scan_at <= vc."convertedAt"
      )
      SELECT
        COUNT(*)::bigint AS unique_visitors,
        COUNT(*) FILTER (
          WHERE ab.first_seen IS NULL
        )::bigint AS first_time_visitors,
        COUNT(*) FILTER (
          WHERE ab.first_seen IS NOT NULL
        )::bigint AS repeat_visitors,
        COALESCE(SUM(pv.period_scans), 0)::bigint AS total_identified_scans,
        (SELECT COUNT(*)::bigint FROM visitor_conversions) AS total_conversions,
        (
          SELECT COUNT(DISTINCT "visitorKey")::bigint
          FROM visitor_conversions
          WHERE "visitorKey" IS NOT NULL
            AND "visitorKey" <> ''
        ) AS unique_converters,
        (
          SELECT COUNT(*)::bigint
          FROM visitor_scan_before_conversion
          WHERE scans_before_conversion > 1
        ) AS conversions_after_repeat,
        (
          SELECT AVG(seconds_to_conversion)
          FROM conversion_time
        ) AS avg_time_to_conversion_seconds
      FROM period_visitors pv
      LEFT JOIN all_before ab
        ON ab."visitorKey" = pv."visitorKey"
    `);

    const row = rows[0];

    const uniqueVisitors = Number(row?.unique_visitors ?? 0);
    const firstTimeVisitors = Number(row?.first_time_visitors ?? 0);
    const repeatVisitors = Number(row?.repeat_visitors ?? 0);
    const totalIdentifiedScans = Number(row?.total_identified_scans ?? 0);
    const totalConversions = Number(row?.total_conversions ?? 0);
    const uniqueConverters = Number(row?.unique_converters ?? 0);

    return {
      uniqueVisitors,
      firstTimeVisitors,
      repeatVisitors,
      repeatVisitorRate:
        uniqueVisitors > 0
          ? Number(((repeatVisitors / uniqueVisitors) * 100).toFixed(2))
          : 0,
      totalIdentifiedScans,
      averageScansPerVisitor:
        uniqueVisitors > 0
          ? Number((totalIdentifiedScans / uniqueVisitors).toFixed(2))
          : 0,
      totalConversions,
      uniqueConverters,
      visitorConversionRate:
        uniqueVisitors > 0
          ? Number(((uniqueConverters / uniqueVisitors) * 100).toFixed(2))
          : 0,
      conversionsAfterRepeatVisit: Number(
        row?.conversions_after_repeat ?? 0,
      ),
      averageTimeToConversionSeconds: Number(
        row?.avg_time_to_conversion_seconds ?? 0,
      ),
    };
  }

  async getFunnel(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date,
  ) {
    if (!qrCodeIds.length) return [];

    const rows = await prisma.$queryRaw<
      Array<{
        stage: string;
        visitors: bigint;
      }>
    >(Prisma.sql`
      WITH visitors AS (
        SELECT DISTINCT "visitorKey"
        FROM "QRRuleMatch"
        WHERE
          "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL
          AND "visitorKey" <> ''
          AND "matchedAt" >= ${startDate}
          AND "matchedAt" < ${endDate}
      ),
      repeat_visitors AS (
        SELECT "visitorKey"
        FROM "QRRuleMatch"
        WHERE
          "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL
          AND "visitorKey" <> ''
          AND "matchedAt" >= ${startDate}
          AND "matchedAt" < ${endDate}
        GROUP BY "visitorKey"
        HAVING COUNT(*) > 1
      ),
      converters AS (
        SELECT DISTINCT "visitorKey"
        FROM "QRConversion"
        WHERE
          "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL
          AND "visitorKey" <> ''
          AND "convertedAt" >= ${startDate}
          AND "convertedAt" < ${endDate}
      )
      SELECT 'IDENTIFIED_VISITOR' AS stage, COUNT(*)::bigint AS visitors
      FROM visitors
      UNION ALL
      SELECT 'REPEAT_VISITOR' AS stage, COUNT(*)::bigint
      FROM repeat_visitors
      UNION ALL
      SELECT 'CONVERTER' AS stage, COUNT(*)::bigint
      FROM converters
      ORDER BY
        CASE stage
          WHEN 'IDENTIFIED_VISITOR' THEN 1
          WHEN 'REPEAT_VISITOR' THEN 2
          WHEN 'CONVERTER' THEN 3
        END
    `);

    return rows.map((row) => ({
      stage: row.stage,
      visitors: Number(row.visitors),
    }));
  }

  async getDailyJourney(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date,
  ) {
    if (!qrCodeIds.length) return [];

    return prisma.$queryRaw<
      Array<{
        date: Date;
        visitors: bigint;
        repeat_visitors: bigint;
        converters: bigint;
      }>
    >(Prisma.sql`
      WITH daily_visitors AS (
        SELECT
          DATE_TRUNC('day', "matchedAt") AS date,
          "visitorKey",
          COUNT(*)::int AS scan_count
        FROM "QRRuleMatch"
        WHERE
          "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL
          AND "visitorKey" <> ''
          AND "matchedAt" >= ${startDate}
          AND "matchedAt" < ${endDate}
        GROUP BY DATE_TRUNC('day', "matchedAt"), "visitorKey"
      ),
      daily_converters AS (
        SELECT
          DATE_TRUNC('day', "convertedAt") AS date,
          "visitorKey"
        FROM "QRConversion"
        WHERE
          "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL
          AND "visitorKey" <> ''
          AND "convertedAt" >= ${startDate}
          AND "convertedAt" < ${endDate}
        GROUP BY DATE_TRUNC('day', "convertedAt"), "visitorKey"
      )
      SELECT
        dv.date,
        COUNT(*)::bigint AS visitors,
        COUNT(*) FILTER (
          WHERE dv.scan_count > 1
        )::bigint AS repeat_visitors,
        COUNT(DISTINCT dc."visitorKey")::bigint AS converters
      FROM daily_visitors dv
      LEFT JOIN daily_converters dc
        ON dc.date = dv.date
        AND dc."visitorKey" = dv."visitorKey"
      GROUP BY dv.date
      ORDER BY dv.date ASC
    `);
  }

  async getJourneyByQr(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date,
  ) {
    if (!qrCodeIds.length) return [];

    return prisma.$queryRaw<
      Array<{
        qr_code_id: string;
        qr_name: string;
        visitors: bigint;
        repeat_visitors: bigint;
        converters: bigint;
      }>
    >(Prisma.sql`
      WITH visitor_stats AS (
        SELECT
          m."qrCodeId",
          m."visitorKey",
          COUNT(*)::int AS scan_count
        FROM "QRRuleMatch" m
        WHERE
          m."qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND m."visitorKey" IS NOT NULL
          AND m."visitorKey" <> ''
          AND m."matchedAt" >= ${startDate}
          AND m."matchedAt" < ${endDate}
        GROUP BY m."qrCodeId", m."visitorKey"
      ),
      converter_stats AS (
        SELECT DISTINCT
          "qrCodeId",
          "visitorKey"
        FROM "QRConversion"
        WHERE
          "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL
          AND "visitorKey" <> ''
          AND "convertedAt" >= ${startDate}
          AND "convertedAt" < ${endDate}
      )
      SELECT
        q.id AS qr_code_id,
        q.name AS qr_name,
        COUNT(DISTINCT vs."visitorKey")::bigint AS visitors,
        COUNT(DISTINCT vs."visitorKey") FILTER (
          WHERE vs.scan_count > 1
        )::bigint AS repeat_visitors,
        COUNT(DISTINCT cs."visitorKey")::bigint AS converters
      FROM "QRCode" q
      INNER JOIN visitor_stats vs
        ON vs."qrCodeId" = q.id
      LEFT JOIN converter_stats cs
        ON cs."qrCodeId" = q.id
        AND cs."visitorKey" = vs."visitorKey"
      WHERE q.id IN (${Prisma.join(qrCodeIds)})
      GROUP BY q.id, q.name
      ORDER BY visitors DESC
    `);
  }
}
