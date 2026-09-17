import { AppError } from "../../cores/errors/AppError";
import { prisma } from "../../config/prisma";
import { QRJourneyAnalyticsRepository } from "./qr-journey-analytics.repository";

export class QRJourneyAnalyticsService {
  private readonly repository = new QRJourneyAnalyticsRepository();

  async getJourneyAnalytics(
    userId: string,
    businessId: string,
    days = 30,
  ) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        ownerId: true,
        deletedAt: true,
      },
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

    const safeDays = Math.min(
      Math.max(Math.floor(Number(days) || 30), 1),
      365,
    );

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - safeDays);

    const qrCodes = await this.repository.getBusinessQrIds(businessId);
    const qrCodeIds = qrCodes.map((qr) => qr.id);

    if (!qrCodeIds.length) {
      return {
        period: { days: safeDays, startDate, endDate },
        overview: {
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
        },
        funnel: [],
        dailyJourney: [],
        byQr: [],
      };
    }

    const [overview, funnel, dailyJourney, byQr] =
      await Promise.all([
        this.repository.getJourneyOverview(
          qrCodeIds,
          startDate,
          endDate,
        ),
        this.repository.getFunnel(
          qrCodeIds,
          startDate,
          endDate,
        ),
        this.repository.getDailyJourney(
          qrCodeIds,
          startDate,
          endDate,
        ),
        this.repository.getJourneyByQr(
          qrCodeIds,
          startDate,
          endDate,
        ),
      ]);

    return {
      period: {
        days: safeDays,
        startDate,
        endDate,
      },
      overview,
      funnel,
      dailyJourney: dailyJourney.map((row) => ({
        date: row.date,
        visitors: Number(row.visitors),
        repeatVisitors: Number(row.repeat_visitors),
        converters: Number(row.converters),
      })),
      byQr: byQr.map((row) => ({
        qrCodeId: row.qr_code_id,
        qrName: row.qr_name,
        visitors: Number(row.visitors),
        repeatVisitors: Number(row.repeat_visitors),
        converters: Number(row.converters),
        conversionRate:
          Number(row.visitors) > 0
            ? Number(
                (
                  (Number(row.converters) /
                    Number(row.visitors)) *
                  100
                ).toFixed(2),
              )
            : 0,
      })),
    };
  }
}

export const qrJourneyAnalyticsService =
  new QRJourneyAnalyticsService();
