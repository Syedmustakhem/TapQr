import { AppError } from "../../cores/errors/AppError";
import { prisma } from "../../config/prisma";
import { AdvancedAnalyticsRepository } from "./analytics-advanced.repository";

const repository = new AdvancedAnalyticsRepository();

export class AdvancedAnalyticsService {
  private repository = repository;

  private period(days = 30) {
    const safeDays = Math.min(
      Math.max(Number(days) || 30, 1),
      365,
    );

    const endDate = new Date();
    const startDate = new Date(endDate);

    startDate.setDate(
      startDate.getDate() - safeDays,
    );

    return {
      safeDays,
      startDate,
      endDate,
    };
  }

  private async assertBusinessOwner(
    userId: string,
    businessId: string,
  ) {
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: userId,
      },
      select: {
        id: true,
      },
    });

    if (!business) {
      throw new AppError(
        "Business not found or access denied.",
        404,
        "BUSINESS_NOT_FOUND",
      );
    }

    return business;
  }

  private series<T extends { date: Date }>(
    rows: T[],
    startDate: Date,
    endDate: Date,
    key: keyof T,
  ) {
    const map = new Map<string, number>();

    for (const row of rows) {
      const date = row.date
        .toISOString()
        .slice(0, 10);

      map.set(
        date,
        Number(row[key] ?? 0),
      );
    }

    const result: Array<{
      date: string;
      [key: string]: string | number;
    }> = [];

    const cursor = new Date(startDate);

    cursor.setUTCHours(
      0,
      0,
      0,
      0,
    );

    const end = new Date(endDate);

    end.setUTCHours(
      0,
      0,
      0,
      0,
    );

    while (cursor < end) {
      const date = cursor
        .toISOString()
        .slice(0, 10);

      result.push({
        date,
        [String(key)]:
          map.get(date) ?? 0,
      });

      cursor.setUTCDate(
        cursor.getUTCDate() + 1,
      );
    }

    return result;
  }

  async getQrAnalytics(
    userId: string,
    businessId: string,
    qrCodeId: string,
    days = 30,
  ) {
    await this.assertBusinessOwner(
      userId,
      businessId,
    );

    const qr =
      await this.repository.getOwnedQRCode(
        businessId,
        qrCodeId,
      );

    if (!qr) {
      throw new AppError(
        "QR code not found.",
        404,
        "QR_CODE_NOT_FOUND",
      );
    }

    const {
      safeDays,
      startDate,
      endDate,
    } = this.period(days);

    const [
      overview,
      scans,
      conversions,
      sources,
      devices,
      locations,
      recentScans,
      conversionTypes,
    ] = await Promise.all([
      this.repository.getQrOverview(
        qrCodeId,
        startDate,
        endDate,
      ),

      this.repository.getDailyScans(
        qrCodeId,
        startDate,
        endDate,
      ),

      this.repository.getDailyConversions(
        qrCodeId,
        startDate,
        endDate,
      ),

      this.repository.getSourceBreakdown(
        [qrCodeId],
        startDate,
        endDate,
      ),

      this.repository.getSourceMetrics(
        [qrCodeId],
        startDate,
        endDate,
        "source",
      ),

      this.repository.getSourceMetrics(
        [qrCodeId],
        startDate,
        endDate,
        "location",
      ),

      this.repository.getRecentScans(
        qrCodeId,
        20,
      ),

      this.repository.getConversionCountsByTypeForQr(
        qrCodeId,
        startDate,
        endDate,
      ),
    ]);

    const conversionRate =
      overview.totalScans === 0
        ? 0
        : Number(
            (
              (overview.totalConversions /
                overview.totalScans) *
              100
            ).toFixed(2),
          );

    return {
      qrCode: {
        id: qr.id,
        name: qr.name,
        shortCode: qr.shortCode,
        status: qr.status,
        sourceType: qr.sourceType,
        placementLabel:
          qr.placementLabel,
        locationLabel:
          qr.locationLabel,
        campaignName:
          qr.campaignName,
        lifetimeScanCount:
          qr.scanCount,
      },

      period: {
        days: safeDays,
        startDate,
        endDate,
      },

      overview: {
        ...overview,
        conversionRate,
      },

      dailyScans: this.series(
        scans,
        startDate,
        endDate,
        "scans",
      ),

      dailyConversions: this.series(
        conversions,
        startDate,
        endDate,
        "conversions",
      ),

      sourceBreakdown:
        sources.map((item) => ({
          sourceType:
            item.sourceType,
          scans: Number(item.scans),
        })),

      devices,

      locations,

      recentScans,

      conversionTypes:
        conversionTypes.map((item) => ({
          type: item.conversionType,
          conversions:
            item._count._all,
        })),
    };
  }

  async getSourceAnalytics(
    userId: string,
    businessId: string,
    days = 30,
  ) {
    await this.assertBusinessOwner(
      userId,
      businessId,
    );

    const {
      safeDays,
      startDate,
      endDate,
    } = this.period(days);

    const qrs =
      await this.repository.getQrIdsForBusiness(
        businessId,
      );

    const qrCodeIds =
      qrs.map((qr) => qr.id);

    const [
      bySource,
      byPlacement,
      byLocation,
      byCampaign,
    ] = await Promise.all([
      this.repository.getSourceMetrics(
        qrCodeIds,
        startDate,
        endDate,
        "source",
      ),

      this.repository.getSourceMetrics(
        qrCodeIds,
        startDate,
        endDate,
        "placement",
      ),

      this.repository.getSourceMetrics(
        qrCodeIds,
        startDate,
        endDate,
        "location",
      ),

      this.repository.getSourceMetrics(
        qrCodeIds,
        startDate,
        endDate,
        "campaign",
      ),
    ]);

    const normalize = (
      rows: Array<{
        name: string;
        scans: number;
        conversions: number;
        qrCodes: number;
      }>,
    ) =>
      rows.map((row) => ({
        name: row.name,
        scans: row.scans,
        conversions:
          row.conversions,
        qrCodes: row.qrCodes,
        conversionRate:
          row.scans === 0
            ? 0
            : Number(
                (
                  (row.conversions /
                    row.scans) *
                  100
                ).toFixed(2),
              ),
      }));

    return {
      period: {
        days: safeDays,
        startDate,
        endDate,
      },

      totalQRCodes:
        qrs.length,

      bySource:
        normalize(bySource),

      byPlacement:
        normalize(byPlacement),

      byLocation:
        normalize(byLocation),

      byCampaign:
        normalize(byCampaign),

      totals: {
        scans: bySource.reduce(
          (sum, row) =>
            sum + row.scans,
          0,
        ),

        conversions:
          bySource.reduce(
            (sum, row) =>
              sum + row.conversions,
            0,
          ),
      },
    };
  }

  /**
   * Campaign analytics overview.
   *
   * Campaign membership is determined
   * exclusively through QRCode.campaignId.
   */
  async getCampaignAnalytics(
    userId: string,
    businessId: string,
    campaignId: string,
    days = 30,
  ) {
    await this.assertBusinessOwner(
      userId,
      businessId,
    );

    const campaign =
      await this.repository.getOwnedCampaignWithQRCodes(
        businessId,
        campaignId,
      );

    if (!campaign) {
      throw new AppError(
        "Campaign not found.",
        404,
        "CAMPAIGN_NOT_FOUND",
      );
    }

    const {
      safeDays,
      startDate,
      endDate,
    } = this.period(days);

    const qrCodeIds =
      campaign.qrCodes.map(
        (qr) => qr.id,
      );

    const overview =
      await this.repository.getCampaignOverview(
        qrCodeIds,
        startDate,
        endDate,
      );

    const conversionRate =
      overview.totalScans === 0
        ? 0
        : Number(
            (
              (overview.totalConversions /
                overview.totalScans) *
              100
            ).toFixed(2),
          );

    return {
      campaign: {
        id: campaign.id,
        businessId:
          campaign.businessId,
        name: campaign.name,
        description:
          campaign.description,
        status: campaign.status,
        startsAt:
          campaign.startsAt,
        endsAt:
          campaign.endsAt,
        createdAt:
          campaign.createdAt,
        updatedAt:
          campaign.updatedAt,
      },

      period: {
        days: safeDays,
        startDate,
        endDate,
      },

      overview: {
        totalScans:
          overview.totalScans,

        uniqueVisitors:
          overview.uniqueVisitors,

        totalConversions:
          overview.totalConversions,

        uniqueConverters:
          overview.uniqueConverters,

        conversionRate,

        conversionValue:
          overview.conversionValue,

        conversionCurrencies:
          overview.conversionCurrencies,
      },

      qrCodes:
        campaign.qrCodes.map(
          (qr) => ({
            id: qr.id,
            name: qr.name,
            shortCode:
              qr.shortCode,
            status: qr.status,
            lifetimeScanCount:
              qr.scanCount,
          }),
        ),
    };
  }
  async getCampaignQRPerformance(
    userId: string,
    businessId: string,
    campaignId: string,
    days = 30,
  ) {
    await this.assertBusinessOwner(userId, businessId);

    const campaign =
      await this.repository.getOwnedCampaignWithQRCodes(
        businessId,
        campaignId,
      );

    if (!campaign) {
      throw new AppError(
        "Campaign not found.",
        404,
        "CAMPAIGN_NOT_FOUND",
      );
    }

    const {
      safeDays,
      startDate,
      endDate,
    } = this.period(days);

    const qrCodes = campaign.qrCodes;

    const qrCodeIds = qrCodes.map((qr) => qr.id);

    const performance =
      await this.repository.getCampaignQRPerformance(
        qrCodeIds,
        startDate,
        endDate,
      );

    const scansMap = new Map(
      performance.scans.map((row) => [
        row.qrCodeId,
        Number(row.scans),
      ]),
    );

    const visitorsMap = new Map(
      performance.visitors.map((row) => [
        row.qrCodeId,
        Number(row.visitors),
      ]),
    );

    const conversionsMap = new Map(
      performance.conversions.map((row) => [
        row.qrCodeId,
        Number(row.conversions),
      ]),
    );

    const convertersMap = new Map(
      performance.converters.map((row) => [
        row.qrCodeId,
        Number(row.converters),
      ]),
    );

    const valuesMap = new Map(
      performance.values.map((row) => [
        row.qrCodeId,
        Number(row.value ?? 0),
      ]),
    );

    const results = qrCodes.map((qr) => {
      const scans = scansMap.get(qr.id) ?? 0;
      const uniqueVisitors = visitorsMap.get(qr.id) ?? 0;
      const conversions = conversionsMap.get(qr.id) ?? 0;
      const uniqueConverters = convertersMap.get(qr.id) ?? 0;
      const conversionValue = valuesMap.get(qr.id) ?? 0;

      const conversionRate =
        scans === 0
          ? 0
          : Number(((conversions / scans) * 100).toFixed(2));

      return {
        id: qr.id,
        name: qr.name,
        shortCode: qr.shortCode,
        status: qr.status,
        lifetimeScanCount: qr.scanCount,

        metrics: {
          scans,
          uniqueVisitors,
          conversions,
          uniqueConverters,
          conversionRate,
          conversionValue,
        },
      };
    });

    results.sort(
      (a, b) =>
        b.metrics.scans - a.metrics.scans ||
        b.metrics.conversions - a.metrics.conversions,
    );

    return {
      campaign: {
        id: campaign.id,
        businessId: campaign.businessId,
        name: campaign.name,
        status: campaign.status,
      },

      period: {
        days: safeDays,
        startDate,
        endDate,
      },

      summary: {
        qrCodes: results.length,
        totalScans: results.reduce(
          (sum, qr) => sum + qr.metrics.scans,
          0,
        ),
        totalVisitors: results.reduce(
          (sum, qr) => sum + qr.metrics.uniqueVisitors,
          0,
        ),
        totalConversions: results.reduce(
          (sum, qr) => sum + qr.metrics.conversions,
          0,
        ),
        totalConversionValue: results.reduce(
          (sum, qr) => sum + qr.metrics.conversionValue,
          0,
        ),
      },

      qrCodes: results.map((qr, index) => ({
        rank: index + 1,
        ...qr,
      })),
    };
  }

    /**
   * Campaign conversion and attribution analytics.
   *
   * Uses the existing QRConversion attribution pipeline:
   * rule -> experiment -> variant -> conversion.
   */
  async getCampaignConversionAttribution(
    userId: string,
    businessId: string,
    campaignId: string,
    days = 30,
  ) {
    await this.assertBusinessOwner(
      userId,
      businessId,
    );

    const campaign =
      await this.repository.getOwnedCampaignWithQRCodes(
        businessId,
        campaignId,
      );

    if (!campaign) {
      throw new AppError(
        "Campaign not found.",
        404,
        "CAMPAIGN_NOT_FOUND",
      );
    }

    const {
      safeDays,
      startDate,
      endDate,
    } = this.period(days);

    const qrCodeIds =
      campaign.qrCodes.map(
        (qr) => qr.id,
      );

    const analytics =
      await this.repository.getCampaignConversionAttribution(
        qrCodeIds,
        startDate,
        endDate,
      );

    const totalConversions =
      Number(
        analytics.totalConversions,
      );

    const attributedConversions =
      Number(
        analytics.attributedConversions,
      );

    const unattributedConversions =
      Math.max(
        totalConversions -
          attributedConversions,
        0,
      );

    const attributionRate =
      totalConversions === 0
        ? 0
        : Number(
            (
              (attributedConversions /
                totalConversions) *
              100
            ).toFixed(2),
          );

    const conversionTypes =
      analytics.conversionTypes
        .map((row) => ({
          type:
            row.conversionType,
          conversions:
            row._count._all,
        }))
        .sort(
          (a, b) =>
            b.conversions -
            a.conversions,
        );

    const byRule =
      analytics.byRule
        .map((row) => ({
          ruleId:
            row.ruleId,
          ruleVersion:
            row.ruleVersion,
          conversions:
            row._count._all,
          attributed:
            row.ruleId !== null,
        }))
        .sort(
          (a, b) =>
            b.conversions -
            a.conversions,
        );

    const byExperiment =
      analytics.byExperiment
        .map((row) => ({
          experimentId:
            row.experimentId,
          conversions:
            row._count._all,
          attributed:
            row.experimentId !== null,
        }))
        .sort(
          (a, b) =>
            b.conversions -
            a.conversions,
        );

    const byVariant =
      analytics.byVariant
        .map((row) => ({
          variantId:
            row.variantId,
          conversions:
            row._count._all,
          attributed:
            row.variantId !== null,
        }))
        .sort(
          (a, b) =>
            b.conversions -
            a.conversions,
        );

    const valuesByCurrency =
      analytics.valuesByCurrency
        .map((row) => ({
          currency:
            row.currency,
          value:
            Number(
              row._sum.value ??
                0,
            ),
        }))
        .sort((a, b) =>
          a.currency === null
            ? 1
            : b.currency === null
              ? -1
              : a.currency.localeCompare(
                  b.currency,
                ),
        );

    return {
      campaign: {
        id: campaign.id,
        businessId:
          campaign.businessId,
        name: campaign.name,
        description:
          campaign.description,
        status: campaign.status,
        startsAt:
          campaign.startsAt,
        endsAt:
          campaign.endsAt,
      },

      period: {
        days: safeDays,
        startDate,
        endDate,
      },

      summary: {
        totalConversions,
        attributedConversions,
        unattributedConversions,
        attributionRate,
      },

      conversionTypes,

      attribution: {
        byRule,
        byExperiment,
        byVariant,
      },

      conversionValue: {
        currencies:
          valuesByCurrency,
        total:
          valuesByCurrency.reduce(
            (sum, row) =>
              sum + row.value,
            0,
          ),
      },
    };
  }
  /**
   * Campaign daily trends.
   *
   * Returns a complete date series,
   * including days with zero activity.
   */
  async getCampaignDailyTrends(
    userId: string,
    businessId: string,
    campaignId: string,
    days = 30,
  ) {
    await this.assertBusinessOwner(
      userId,
      businessId,
    );

    const campaign =
      await this.repository.getOwnedCampaignWithQRCodes(
        businessId,
        campaignId,
      );

    if (!campaign) {
      throw new AppError(
        "Campaign not found.",
        404,
        "CAMPAIGN_NOT_FOUND",
      );
    }

    const {
      safeDays,
      startDate,
      endDate,
    } = this.period(days);

    const qrCodeIds =
      campaign.qrCodes.map(
        (qr) => qr.id,
      );

    const trends =
      await this.repository.getCampaignDailyTrends(
        qrCodeIds,
        startDate,
        endDate,
      );

    const scanMap =
      new Map<
        string,
        number
      >(
        trends.scans.map(
          (
            row: {
              date: Date;
              scans: bigint;
            },
          ) => [
            row.date
              .toISOString()
              .slice(0, 10),
            Number(row.scans),
          ],
        ),
      );

    const visitorMap =
      new Map<
        string,
        number
      >(
        trends.visitors.map(
          (
            row: {
              date: Date;
              visitors: bigint;
            },
          ) => [
            row.date
              .toISOString()
              .slice(0, 10),
            Number(row.visitors),
          ],
        ),
      );

    const conversionMap =
      new Map<
        string,
        number
      >(
        trends.conversions.map(
          (
            row: {
              date: Date;
              conversions: bigint;
            },
          ) => [
            row.date
              .toISOString()
              .slice(0, 10),
            Number(row.conversions),
          ],
        ),
      );

    const dailyTrends: Array<{
      date: string;
      scans: number;
      visitors: number;
      conversions: number;
    }> = [];

    const cursor =
      new Date(startDate);

    cursor.setUTCHours(
      0,
      0,
      0,
      0,
    );

    const normalizedEnd =
      new Date(endDate);

    normalizedEnd.setUTCHours(
      0,
      0,
      0,
      0,
    );

    while (
      cursor < normalizedEnd
    ) {
      const date =
        cursor
          .toISOString()
          .slice(0, 10);

      dailyTrends.push({
        date,

        scans:
          scanMap.get(date) ??
          0,

        visitors:
          visitorMap.get(date) ??
          0,

        conversions:
          conversionMap.get(date) ??
          0,
      });

      cursor.setUTCDate(
        cursor.getUTCDate() + 1,
      );
    }

    return {
      campaign: {
        id: campaign.id,
        businessId:
          campaign.businessId,
        name: campaign.name,
        status: campaign.status,
        startsAt:
          campaign.startsAt,
        endsAt:
          campaign.endsAt,
      },

      period: {
        days: safeDays,
        startDate,
        endDate,
      },

      dailyTrends,
    };
  }
}

export const advancedAnalyticsService =
  new AdvancedAnalyticsService();