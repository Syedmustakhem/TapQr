import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export class VisitorAnalyticsRepository {
  async getVisitorOverview(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date,
  ) {
    if (!qrCodeIds.length) {
      return {
        uniqueVisitors: 0,
        newVisitors: 0,
        returningVisitors: 0,
        totalIdentifiedScans: 0,
        repeatScans: 0,
      };
    }

    const [overviewRows] = await Promise.all([
      prisma.$queryRaw<
        Array<{
          unique_visitors: bigint;
          total_scans: bigint;
          repeat_scans: bigint;
          new_visitors: bigint;
          returning_visitors: bigint;
        }>
      >(Prisma.sql`
        WITH visitor_history AS (
          SELECT
            "visitorKey",
            MIN("matchedAt") AS first_seen_at
          FROM "QRRuleMatch"
          WHERE
            "qrCodeId" IN (${Prisma.join(qrCodeIds)})
            AND "visitorKey" IS NOT NULL
            AND "visitorKey" <> ''
          GROUP BY "visitorKey"
        ),
        current_scans AS (
          SELECT
            "visitorKey",
            COUNT(*)::bigint AS current_scans
          FROM "QRRuleMatch"
          WHERE
            "qrCodeId" IN (${Prisma.join(qrCodeIds)})
            AND "visitorKey" IS NOT NULL
            AND "visitorKey" <> ''
            AND "matchedAt" >= ${startDate}
            AND "matchedAt" < ${endDate}
          GROUP BY "visitorKey"
        )
        SELECT
          COUNT(*)::bigint AS unique_visitors,
          COALESCE(SUM(cs.current_scans), 0)::bigint AS total_scans,
          COALESCE(
            SUM(
              CASE
                WHEN cs.current_scans > 1
                THEN cs.current_scans - 1
                ELSE 0
              END
            ),
            0
          )::bigint AS repeat_scans,
          COUNT(*) FILTER (
            WHERE vh.first_seen_at >= ${startDate}
              AND vh.first_seen_at < ${endDate}
          )::bigint AS new_visitors,
          COUNT(*) FILTER (
            WHERE vh.first_seen_at < ${startDate}
          )::bigint AS returning_visitors
        FROM current_scans cs
        INNER JOIN visitor_history vh
          ON vh."visitorKey" = cs."visitorKey"
      `),
    ]);

    const row = overviewRows[0];

    return {
      uniqueVisitors: Number(row?.unique_visitors ?? 0),
      totalIdentifiedScans: Number(row?.total_scans ?? 0),
      repeatScans: Number(row?.repeat_scans ?? 0),
      newVisitors: Number(row?.new_visitors ?? 0),
      returningVisitors: Number(row?.returning_visitors ?? 0),
    };
  }

  async getFrequency(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date,
  ) {
    if (!qrCodeIds.length) return [];

    return prisma.$queryRaw<
      Array<{ range: string; visitors: bigint }>
    >(Prisma.sql`
      WITH visitor_scans AS (
        SELECT
          "visitorKey",
          COUNT(*)::int AS scan_count
        FROM "QRRuleMatch"
        WHERE
          "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL
          AND "visitorKey" <> ''
          AND "matchedAt" >= ${startDate}
          AND "matchedAt" < ${endDate}
        GROUP BY "visitorKey"
      )
      SELECT
        CASE
          WHEN scan_count = 1 THEN '1 scan'
          WHEN scan_count = 2 THEN '2 scans'
          WHEN scan_count BETWEEN 3 AND 5 THEN '3-5 scans'
          WHEN scan_count BETWEEN 6 AND 10 THEN '6-10 scans'
          ELSE '10+ scans'
        END AS range,
        COUNT(*)::bigint AS visitors
      FROM visitor_scans
      GROUP BY
        CASE
          WHEN scan_count = 1 THEN '1 scan'
          WHEN scan_count = 2 THEN '2 scans'
          WHEN scan_count BETWEEN 3 AND 5 THEN '3-5 scans'
          WHEN scan_count BETWEEN 6 AND 10 THEN '6-10 scans'
          ELSE '10+ scans'
        END
      ORDER BY
        CASE
          WHEN range = '1 scan' THEN 1
          WHEN range = '2 scans' THEN 2
          WHEN range = '3-5 scans' THEN 3
          WHEN range = '6-10 scans' THEN 4
          ELSE 5
        END
    `);
  }

  async getDailyVisitors(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date,
  ) {
    if (!qrCodeIds.length) return [];

    return prisma.$queryRaw<
      Array<{
        date: Date;
        unique_visitors: bigint;
        new_visitors: bigint;
        returning_visitors: bigint;
      }>
    >(Prisma.sql`
      WITH visitor_first_seen AS (
        SELECT
          "visitorKey",
          MIN("matchedAt") AS first_seen_at
        FROM "QRRuleMatch"
        WHERE
          "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL
          AND "visitorKey" <> ''
        GROUP BY "visitorKey"
      ),
      daily AS (
        SELECT
          DATE_TRUNC('day', m."matchedAt") AS date,
          m."visitorKey",
          v.first_seen_at
        FROM "QRRuleMatch" m
        INNER JOIN visitor_first_seen v
          ON v."visitorKey" = m."visitorKey"
        WHERE
          m."qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND m."visitorKey" IS NOT NULL
          AND m."visitorKey" <> ''
          AND m."matchedAt" >= ${startDate}
          AND m."matchedAt" < ${endDate}
        GROUP BY
          DATE_TRUNC('day', m."matchedAt"),
          m."visitorKey",
          v.first_seen_at
      )
      SELECT
        date,
        COUNT(*)::bigint AS unique_visitors,
        COUNT(*) FILTER (
          WHERE first_seen_at >= date
            AND first_seen_at < date + INTERVAL '1 day'
        )::bigint AS new_visitors,
        COUNT(*) FILTER (
          WHERE first_seen_at < date
        )::bigint AS returning_visitors
      FROM daily
      GROUP BY date
      ORDER BY date ASC
    `);
  }

  async getConversionOverview(
    qrCodeIds: string[],
    startDate: Date,
    endDate: Date,
  ) {
    if (!qrCodeIds.length) {
      return {
        totalConversions: 0,
        uniqueConverters: 0,
        repeatVisitorConversions: 0,
      };
    }

    const rows = await prisma.$queryRaw<
      Array<{
        total_conversions: bigint;
        unique_converters: bigint;
        repeat_visitor_conversions: bigint;
      }>
    >(Prisma.sql`
      WITH visitor_scan_counts AS (
        SELECT
          "visitorKey",
          COUNT(*)::int AS scan_count
        FROM "QRRuleMatch"
        WHERE
          "qrCodeId" IN (${Prisma.join(qrCodeIds)})
          AND "visitorKey" IS NOT NULL
          AND "visitorKey" <> ''
          AND "matchedAt" >= ${startDate}
          AND "matchedAt" < ${endDate}
        GROUP BY "visitorKey"
      )
      SELECT
        COUNT(c.id)::bigint AS total_conversions,
        COUNT(DISTINCT c."visitorKey") FILTER (
          WHERE c."visitorKey" IS NOT NULL
            AND c."visitorKey" <> ''
        )::bigint AS unique_converters,
        COUNT(c.id) FILTER (
          WHERE c."visitorKey" IN (
            SELECT "visitorKey"
            FROM visitor_scan_counts
            WHERE scan_count > 1
          )
        )::bigint AS repeat_visitor_conversions
      FROM "QRConversion" c
      WHERE
        c."qrCodeId" IN (${Prisma.join(qrCodeIds)})
        AND c."convertedAt" >= ${startDate}
        AND c."convertedAt" < ${endDate}
    `);

    const row = rows[0];

    return {
      totalConversions: Number(row?.total_conversions ?? 0),
      uniqueConverters: Number(row?.unique_converters ?? 0),
      repeatVisitorConversions: Number(
        row?.repeat_visitor_conversions ?? 0,
      ),
    };
  }
}
