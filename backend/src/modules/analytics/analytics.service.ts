import {
  AppError,
} from "../../cores/errors/AppError";

import {
  prisma,
} from "../../config/prisma";

import {
  AnalyticsRepository,
} from "./analytics.repository";

import {
  RecordScanInput,
} from "./analytics.types";

export class AnalyticsService {
  private readonly repository =
    new AnalyticsRepository();

  /*
  |--------------------------------------------------------------------------
  | RECORD PUBLIC QR SCAN
  |--------------------------------------------------------------------------
  */

  async recordScan(
    data: RecordScanInput
  ) {
    if (!data.qrCodeId) {
      throw new AppError(
        "QR Code ID is required.",
        400,
        "QR_ID_REQUIRED"
      );
    }

    try {
      return await this.repository.recordScan(
        data
      );
    } catch (error) {
      /*
       * Analytics must never take down the public QR
       * customer experience.
       */
      console.error(
        "[Analytics] Failed to record scan:",
        error
      );

      return null;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | BUSINESS ANALYTICS
  |--------------------------------------------------------------------------
  */

  async getBusinessOverview(
    userId: string,
    businessId: string,
    days = 30,
    qrCodeId?: string,
    limit = 10
  ) {
    /*
     * Verify business ownership.
     */
    const business =
      await prisma.business.findUnique({
        where: {
          id: businessId,
        },

        select: {
          id: true,
          ownerId: true,
          status: true,
          deletedAt: true,
        },
      });

    if (
      !business ||
      business.deletedAt
    ) {
      throw new AppError(
        "Business not found.",
        404,
        "BUSINESS_NOT_FOUND"
      );
    }

    if (
      business.ownerId !== userId
    ) {
      throw new AppError(
        "You do not have access to this business.",
        403,
        "BUSINESS_ACCESS_DENIED"
      );
    }

    /*
     * Normalize analytics period.
     */
    const safeDays =
      Math.min(
        Math.max(
          Math.floor(days),
          1
        ),
        365
      );

    const safeLimit =
      Math.min(
        Math.max(
          Math.floor(limit),
          1
        ),
        50
      );

    /*
     * Current period.
     */
    const endDate =
      new Date();

    const startDate =
      new Date(endDate);

    startDate.setUTCDate(
      startDate.getUTCDate() -
        safeDays
    );

    /*
     * Previous comparable period.
     */
    const previousEndDate =
      new Date(startDate);

    const previousStartDate =
      new Date(startDate);

    previousStartDate.setUTCDate(
      previousStartDate.getUTCDate() -
        safeDays
    );

    /*
     * Get QR codes owned by this business.
     *
     * If qrCodeId is present, repository guarantees
     * that the QR belongs to the requested business.
     */
    const qrCodes =
      await this.repository.getBusinessQrCodes(
        businessId,
        qrCodeId
      );

    if (
      qrCodeId &&
      qrCodes.length === 0
    ) {
      throw new AppError(
        "QR Code not found.",
        404,
        "QR_NOT_FOUND"
      );
    }

    const qrCodeIds =
      qrCodes.map(
        (qr) => qr.id
      );

    /*
     * No QR codes means valid business but no analytics.
     */
    if (qrCodeIds.length === 0) {
      return {
        period: {
          days: safeDays,
          startDate,
          endDate,
        },

        overview: {
          totalScans: 0,
          uniqueVisitors: 0,
          previousPeriodScans: 0,
          percentageChange: 0,
          activeQrCodes: 0,
          totalQrCodes: 0,
          averageDailyScans: 0,
        },

        scansByDay:
          this.buildDailySeries(
            [],
            startDate,
            endDate
          ),

        qrPerformance: [],

        locations: {
          countries: [],
          cities: [],
        },

        technology: {
          devices: [],
          browsers: [],
          operatingSystems: [],
        },

        referrers: [],

        recentScans: [],
      };
    }

    /*
     * Query analytics concurrently.
     *
     * PostgreSQL performs the aggregation.
     */
    const [
      totalScans,
      previousPeriodScans,
      uniqueVisitors,
      dailyScans,
      cities,
      countries,
      devices,
      browsers,
      operatingSystems,
      referrers,
      recentScans,
    ] = await Promise.all([
      this.repository.countScans(
        qrCodeIds,
        startDate,
        endDate
      ),

      this.repository.countScans(
        qrCodeIds,
        previousStartDate,
        previousEndDate
      ),

      this.repository.countUniqueVisitors(
        qrCodeIds,
        startDate,
        endDate
      ),

      this.repository.getDailyScans(
        qrCodeIds,
        startDate,
        endDate
      ),

      this.repository.getCities(
        qrCodeIds,
        startDate,
        endDate
      ),

      this.repository.getCountries(
        qrCodeIds,
        startDate,
        endDate
      ),

      this.repository.getDevices(
        qrCodeIds,
        startDate,
        endDate
      ),

      this.repository.getBrowsers(
        qrCodeIds,
        startDate,
        endDate
      ),

      this.repository.getOperatingSystems(
        qrCodeIds,
        startDate,
        endDate
      ),

      this.repository.getReferrers(
        qrCodeIds,
        startDate,
        endDate
      ),

      this.repository.getRecentScans(
        qrCodeIds,
        safeLimit
      ),
    ]);

    /*
     * Growth calculation.
     */
    const percentageChange =
      previousPeriodScans === 0
        ? totalScans > 0
          ? 100
          : 0
        : Number(
            (
              (
                (totalScans -
                  previousPeriodScans) /
                previousPeriodScans
              ) * 100
            ).toFixed(1)
          );

    /*
     * Average daily scans.
     */
    const averageDailyScans =
      Number(
        (
          totalScans /
          safeDays
        ).toFixed(2)
      );

    return {
      period: {
        days: safeDays,
        startDate,
        endDate,
      },

      overview: {
        totalScans,

        uniqueVisitors,

        previousPeriodScans,

        percentageChange,

        activeQrCodes:
          qrCodes.filter(
            (qr) =>
              qr.status === "ACTIVE"
          ).length,

        totalQrCodes:
          qrCodes.length,

        averageDailyScans,
      },

      /*
       * Timeline.
       */
      scansByDay:
        this.buildDailySeries(
          dailyScans,
          startDate,
          endDate
        ),

      /*
       * QR performance.
       *
       * Important:
       * scanCount is lifetime count stored on QRCode.
       * dashboard period scans are obtained separately
       * through the scan event aggregation.
       */
      qrPerformance:
        qrCodes.map(
          (qr) => ({
            id: qr.id,

            name: qr.name,

            shortCode:
              qr.shortCode,

            scanCount:
              qr.scanCount,

            status:
              qr.status,

            type:
              qr.type,

            experienceType:
              qr.experienceType,

            createdAt:
              qr.createdAt,

            updatedAt:
              qr.updatedAt,
          })
        ),

      /*
       * Geography.
       */
      locations: {
        cities:
          cities.map(
            (item) => ({
              name:
                item.city,

              scans:
                item._count._all,
            })
          ),

        countries:
          countries.map(
            (item) => ({
              name:
                item.country,

              scans:
                item._count._all,
            })
          ),
      },

      /*
       * Technology.
       */
      technology: {
        devices:
          devices.map(
            (item) => ({
              name:
                item.device,

              scans:
                item._count._all,
            })
          ),

        browsers:
          browsers.map(
            (item) => ({
              name:
                item.browser,

              scans:
                item._count._all,
            })
          ),

        operatingSystems:
          operatingSystems.map(
            (item) => ({
              name:
                item.operatingSystem,

              scans:
                item._count._all,
            })
          ),
      },

      /*
       * Traffic sources.
       */
      referrers:
        referrers.map(
          (item) => ({
            name:
              item.referrer,

            scans:
              item._count._all,
          })
        ),

      /*
       * Recent activity.
       */
      recentScans,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | COMPLETE DAILY SERIES
  |--------------------------------------------------------------------------
  */

  private buildDailySeries(
    rows: Array<{
      date: Date;
      scans: bigint;
    }>,
    startDate: Date,
    endDate: Date
  ) {
    const result =
      new Map<
        string,
        number
      >();

    const cursor =
      new Date(startDate);

    cursor.setUTCHours(
      0,
      0,
      0,
      0
    );

    while (
      cursor < endDate
    ) {
      const key =
        cursor
          .toISOString()
          .slice(0, 10);

      result.set(
        key,
        0
      );

      cursor.setUTCDate(
        cursor.getUTCDate() + 1
      );
    }

    for (
      const row of rows
    ) {
      const key =
        row.date
          .toISOString()
          .slice(0, 10);

      result.set(
        key,
        Number(row.scans)
      );
    }

    return Array.from(
      result.entries()
    ).map(
      ([date, scans]) => ({
        date,
        scans,
      })
    );
  }
}