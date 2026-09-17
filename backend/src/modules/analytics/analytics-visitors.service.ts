import { AppError } from "../../cores/errors/AppError";
import { prisma } from "../../config/prisma";
import { VisitorAnalyticsRepository } from "./analytics-visitors.repository";

export class VisitorAnalyticsService {
  private readonly repository = new VisitorAnalyticsRepository();

  private period(days = 30) {
    const safeDays = Math.min(Math.max(Math.floor(days), 1), 365);
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - safeDays);

    return { safeDays, startDate, endDate };
  }

  private async assertBusinessOwner(userId: string, businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, ownerId: true, deletedAt: true },
    });

    if (!business || business.deletedAt) {
      throw new AppError(
        "Business not found.",
        404,
        "BUSINESS_NOT_FOUND",
      );
    }

    if (business.ownerId !== userId) {
      throw new AppError(
        "You do not have access to this business.",
        403,
        "BUSINESS_ACCESS_DENIED",
      );
    }
  }

  private buildDailySeries(
    rows: Array<{
      date: Date;
      unique_visitors: bigint;
      new_visitors: bigint;
      returning_visitors: bigint;
    }>,
    startDate: Date,
    endDate: Date,
  ) {
    const map = new Map<
      string,
      {
        uniqueVisitors: number;
        newVisitors: number;
        returningVisitors: number;
      }
    >();

    const cursor = new Date(startDate);
    cursor.setUTCHours(0, 0, 0, 0);

    while (cursor < endDate) {
      map.set(cursor.toISOString().slice(0, 10), {
        uniqueVisitors: 0,
        newVisitors: 0,
        returningVisitors: 0,
      });

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    for (const row of rows) {
      map.set(row.date.toISOString().slice(0, 10), {
        uniqueVisitors: Number(row.unique_visitors),
        newVisitors: Number(row.new_visitors),
        returningVisitors: Number(row.returning_visitors),
      });
    }

    return [...map.entries()].map(([date, values]) => ({
      date,
      ...values,
    }));
  }

  async getVisitorAnalytics(
    userId: string,
    businessId: string,
    days = 30,
  ) {
    await this.assertBusinessOwner(userId, businessId);

    const { safeDays, startDate, endDate } = this.period(days);

    const qrCodes = await prisma.qRCode.findMany({
      where: {
        businessId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    const qrCodeIds = qrCodes.map((qr) => qr.id);

    if (!qrCodeIds.length) {
      return {
        period: {
          days: safeDays,
          startDate,
          endDate,
        },
        overview: {
          uniqueVisitors: 0,
          newVisitors: 0,
          returningVisitors: 0,
          repeatVisitorRate: 0,
          totalIdentifiedScans: 0,
          repeatScans: 0,
          averageScansPerVisitor: 0,
          totalConversions: 0,
          uniqueConverters: 0,
          visitorConversionRate: 0,
          repeatVisitorConversions: 0,
        },
        frequency: [],
        dailyVisitors: [],
      };
    }

    const [
      overview,
      frequency,
      dailyVisitors,
      conversionOverview,
    ] = await Promise.all([
      this.repository.getVisitorOverview(
        qrCodeIds,
        startDate,
        endDate,
      ),
      this.repository.getFrequency(
        qrCodeIds,
        startDate,
        endDate,
      ),
      this.repository.getDailyVisitors(
        qrCodeIds,
        startDate,
        endDate,
      ),
      this.repository.getConversionOverview(
        qrCodeIds,
        startDate,
        endDate,
      ),
    ]);

    const repeatVisitorRate =
      overview.uniqueVisitors === 0
        ? 0
        : Number(
            (
              (overview.returningVisitors /
                overview.uniqueVisitors) *
              100
            ).toFixed(2),
          );

    const averageScansPerVisitor =
      overview.uniqueVisitors === 0
        ? 0
        : Number(
            (
              overview.totalIdentifiedScans /
              overview.uniqueVisitors
            ).toFixed(2),
          );

    const visitorConversionRate =
      overview.uniqueVisitors === 0
        ? 0
        : Number(
            (
              (conversionOverview.uniqueConverters /
                overview.uniqueVisitors) *
              100
            ).toFixed(2),
          );

    return {
      period: {
        days: safeDays,
        startDate,
        endDate,
      },
      overview: {
        ...overview,
        repeatVisitorRate,
        averageScansPerVisitor,
        ...conversionOverview,
        visitorConversionRate,
      },
      frequency: frequency.map((row) => ({
        range: row.range,
        visitors: Number(row.visitors),
      })),
      dailyVisitors: this.buildDailySeries(
        dailyVisitors,
        startDate,
        endDate,
      ),
    };
  }
}

export const visitorAnalyticsService =
  new VisitorAnalyticsService();
