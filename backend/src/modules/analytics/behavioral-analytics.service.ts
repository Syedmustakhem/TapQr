import { AppError } from "../../cores/errors/AppError";
import { prisma } from "../../config/prisma";
import { BehavioralAnalyticsRepository } from "./behavioral-analytics.repository";

export class BehavioralAnalyticsService {
  private readonly repository = new BehavioralAnalyticsRepository();

  async getBehavioralAnalytics(userId: string, businessId: string, days = 30) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, ownerId: true, deletedAt: true },
    });
    if (!business || business.deletedAt)
      throw new AppError("Business not found.", 404, "BUSINESS_NOT_FOUND");
    if (business.ownerId !== userId)
      throw new AppError("You do not have access to this business.", 403, "BUSINESS_ACCESS_DENIED");

    const safeDays = Math.min(Math.max(Math.floor(Number(days) || 30), 1), 365);
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - safeDays);

    const qrCodes = await this.repository.getBusinessQrIds(businessId);
    const ids = qrCodes.map(q => q.id);

    if (!ids.length) return {
      period: { days: safeDays, startDate, endDate },
      overview: {
        visitors: 0, oneTimeVisitors: 0, returningVisitors: 0, returningVisitorRate: 0,
        highlyEngagedVisitors: 0, highlyEngagedRate: 0, converters: 0,
        repeatConverters: 0, repeatConverterRate: 0,
        averageVisitIntervalSeconds: 0, averageTimeToConversionSeconds: 0,
      },
      segments: [], scanIntervalDistribution: [], byQr: [],
    };

    const [overview, segments, intervals, byQr] = await Promise.all([
      this.repository.getBehaviorOverview(ids, startDate, endDate),
      this.repository.getSegments(ids, startDate, endDate),
      this.repository.getScanIntervalDistribution(ids, startDate, endDate),
      this.repository.getBehaviorByQr(ids, startDate, endDate),
    ]);

    return {
      period: { days: safeDays, startDate, endDate },
      overview: {
        ...overview,
        returningVisitorRate: overview.visitors
          ? Number(((overview.returningVisitors / overview.visitors) * 100).toFixed(2)) : 0,
        highlyEngagedRate: overview.visitors
          ? Number(((overview.highlyEngagedVisitors / overview.visitors) * 100).toFixed(2)) : 0,
        repeatConverterRate: overview.converters
          ? Number(((overview.repeatConverters / overview.converters) * 100).toFixed(2)) : 0,
      },
      segments: segments.map(r => ({
        segment: r.segment, visitors: Number(r.visitors), conversions: Number(r.conversions),
      })),
      scanIntervalDistribution: intervals.map(r => ({
        range: r.range, visitors: Number(r.visitors),
      })),
      byQr: byQr.map(r => ({
        qrCodeId: r.qr_code_id, qrName: r.qr_name,
        visitors: Number(r.visitors), returningVisitors: Number(r.returning_visitors),
        converters: Number(r.converters),
        returningRate: Number(r.visitors) ? Number(((Number(r.returning_visitors) / Number(r.visitors)) * 100).toFixed(2)) : 0,
        conversionRate: Number(r.visitors) ? Number(((Number(r.converters) / Number(r.visitors)) * 100).toFixed(2)) : 0,
      })),
    };
  }
}
export const behavioralAnalyticsService = new BehavioralAnalyticsService();
