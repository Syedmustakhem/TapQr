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

  private repository =
    new AnalyticsRepository();

  /**
   * Called by the public QR redirect flow.
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
    } catch (error: any) {
      console.error(
        "[Analytics] Failed to record scan:",
        error
      );

      /*
       * Scan tracking should never break
       * the customer's QR experience.
       *
       * The QR redirect should continue even
       * if analytics storage temporarily fails.
       */
      return null;
    }
  }

  async getBusinessOverview(
    userId: string,
    businessId: string,
    days = 30,
    qrCodeId?: string
  ) {
    const business =
      await prisma.business.findUnique({
        where: {
          id: businessId,
        },

        select: {
          id: true,

          ownerId: true,

          status: true,
        },
      });

    if (!business) {
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

    const safeDays =
      Math.min(
        Math.max(
          Math.floor(days),
          1
        ),
        365
      );

    const endDate =
      new Date();

    const startDate =
      new Date(endDate);

    startDate.setUTCDate(
      startDate.getUTCDate() -
        safeDays
    );

    const previousEndDate =
      new Date(startDate);

    const previousStartDate =
      new Date(startDate);

    previousStartDate.setUTCDate(
      previousStartDate.getUTCDate() -
        safeDays
    );

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

    const [
      totalScans,
      previousPeriodScans,
      dailyScans,
      cities,
      countries,
      devices,
      browsers,
      operatingSystems,
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

      this.repository.getRecentScans(
        qrCodeIds
      ),
    ]);

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

    return {
      period: {
        days: safeDays,

        startDate,

        endDate,
      },

      overview: {
        totalScans,

        previousPeriodScans,

        percentageChange,

        activeQrCodes:
          qrCodes.filter(
            (qr) =>
              qr.status === "ACTIVE"
          ).length,
      },

      scansByDay:
        this.buildDailySeries(
          dailyScans,
          startDate,
          endDate
        ),

      qrPerformance:
        qrCodes.map(
          (qr) => ({
            id: qr.id,

            name: qr.name,

            shortCode:
              qr.shortCode,

            scanCount:
              qr.scanCount,
          })
        ),

      locations: {
        cities:
          cities.map(
            (item) => ({
              name: item.city,

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

      recentScans,
    };
  }

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