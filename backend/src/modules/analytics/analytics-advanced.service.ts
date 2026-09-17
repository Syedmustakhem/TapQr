import { AppError } from "../../cores/errors/AppError";
import { prisma } from "../../config/prisma";
import { AdvancedAnalyticsRepository } from "./analytics-advanced.repository";

export class AdvancedAnalyticsService {
  private readonly repository = new AdvancedAnalyticsRepository();

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
    if (!business || business.deletedAt) throw new AppError("Business not found.", 404, "BUSINESS_NOT_FOUND");
    if (business.ownerId !== userId) throw new AppError("You do not have access to this business.", 403, "BUSINESS_ACCESS_DENIED");
  }

  private series<T extends { date: Date }>(
    rows: T[],
    startDate: Date,
    endDate: Date,
    valueKey: keyof T,
  ) {
    const map = new Map<string, number>();
    const cursor = new Date(startDate);
    cursor.setUTCHours(0, 0, 0, 0);
    while (cursor < endDate) {
      map.set(cursor.toISOString().slice(0, 10), 0);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    for (const row of rows) {
      map.set(row.date.toISOString().slice(0, 10), Number(row[valueKey] ?? 0));
    }
    return [...map.entries()].map(([date, value]) => ({ date, value }));
  }

  async getQrAnalytics(userId: string, businessId: string, qrCodeId: string, days = 30, limit = 10) {
    await this.assertBusinessOwner(userId, businessId);
    const qr = await this.repository.getOwnedQRCode(businessId, qrCodeId);
    if (!qr) throw new AppError("QR Code not found.", 404, "QR_NOT_FOUND");

    const { safeDays, startDate, endDate } = this.period(days);
    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 50);

    const [overview, scans, conversions, sources, devices, locations, recentScans, conversionTypes] =
      await Promise.all([
        this.repository.getQrOverview(qrCodeId, startDate, endDate),
        this.repository.getDailyScans(qrCodeId, startDate, endDate),
        this.repository.getDailyConversions(qrCodeId, startDate, endDate),
        this.repository.getSourceBreakdown([qrCodeId], startDate, endDate),
        prisma.scanEvent.groupBy({
          by: ["device"],
          where: { qrCodeId, scannedAt: { gte: startDate, lt: endDate }, device: { not: null } },
          _count: { _all: true }, orderBy: { _count: { device: "desc" } }, take: 10,
        }),
        prisma.scanEvent.groupBy({
          by: ["country", "city"],
          where: { qrCodeId, scannedAt: { gte: startDate, lt: endDate }, country: { not: null } },
          _count: { _all: true }, orderBy: { _count: { city: "desc" } }, take: 20,
        }),
        this.repository.getRecentScans(qrCodeId, safeLimit),
        this.repository.getConversionCountsByTypeForQr(qrCodeId, startDate, endDate),
      ]);

    const conversionRate = overview.totalScans === 0 ? 0 : Number(((overview.totalConversions / overview.totalScans) * 100).toFixed(2));

    return {
      qr: {
        id: qr.id, name: qr.name, shortCode: qr.shortCode, status: qr.status,
        sourceType: qr.sourceType, placementLabel: qr.placementLabel,
        locationLabel: qr.locationLabel, campaignName: qr.campaignName,
        lifetimeScanCount: qr.scanCount,
      },
      period: { days: safeDays, startDate, endDate },
      overview: { ...overview, conversionRate },
      dailyScans: this.series(scans, startDate, endDate, "scans"),
      dailyConversions: this.series(conversions, startDate, endDate, "conversions"),
      sourceBreakdown: sources.map(x => ({ sourceType: x.sourceType, scans: Number(x.scans) })),
      deviceBreakdown: devices.map(x => ({ device: x.device, scans: x._count._all })),
      locationBreakdown: locations.map(x => ({ country: x.country, city: x.city, scans: x._count._all })),
      conversionTypes: conversionTypes.map(x => ({ type: x.conversionType, conversions: x._count._all })),
      recentScans,
    };
  }

  async getSourceAnalytics(userId: string, businessId: string, days = 30) {
    await this.assertBusinessOwner(userId, businessId);
    const { safeDays, startDate, endDate } = this.period(days);
    const qrs = await this.repository.getQrIdsForBusiness(businessId);
    const qrIds = qrs.map(q => q.id);

    const [bySource, byPlacement, byLocation, byCampaign] = await Promise.all([
      this.repository.getSourceMetrics(qrIds, startDate, endDate, "source"),
      this.repository.getSourceMetrics(qrIds, startDate, endDate, "placement"),
      this.repository.getSourceMetrics(qrIds, startDate, endDate, "location"),
      this.repository.getSourceMetrics(qrIds, startDate, endDate, "campaign"),
    ]);

    const normalize = (rows: Array<{ name: string; scans: number; conversions: number; qrCodes: number }>) =>
      rows.map(row => ({
        name: row.name,
        qrCodes: row.qrCodes,
        scans: row.scans,
        conversions: row.conversions,
        conversionRate: row.scans === 0 ? 0 : Number(((row.conversions / row.scans) * 100).toFixed(2)),
      }));

    return {
      period: { days: safeDays, startDate, endDate },
      totals: {
        qrCodes: qrs.length,
        scans: bySource.reduce((sum, row) => sum + row.scans, 0),
        conversions: bySource.reduce((sum, row) => sum + row.conversions, 0),
      },
      bySource: normalize(bySource),
      byPlacement: normalize(byPlacement),
      byLocation: normalize(byLocation),
      byCampaign: normalize(byCampaign),
    };
  }
}
