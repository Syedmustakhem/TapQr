// src/api/campaignApi.ts
//
// Campaign endpoints, mirroring the TapQR web dashboard
// (app/dashboard/campaigns calls these exact paths against
// https://api.tapqr.shop/api).
//
// Uses the shared authenticated axios instance from
// authApi.ts (Bearer token + 401 refresh interceptors).

import api from "./authApi";

export type CampaignStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "ARCHIVED";

export type Campaign = {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  status: CampaignStatus;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CampaignInput = {
  name: string;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
};

/**
 * QR code attached to a campaign. Same shape as
 * QRCodeRecord plus the campaign linkage fields the
 * campaign endpoints return.
 */
export type CampaignQRCode = {
  id: string;
  businessId: string;
  name: string;
  shortCode: string;
  status: string;
  campaignId?: string | null;
  campaignName?: string | null;
  scanCount?: number | null;
  createdAt?: string;
};

type CampaignListResponse = {
  success?: boolean;
  message?: string;
  data?: Campaign[];
};

type CampaignResponse = {
  success?: boolean;
  message?: string;
  data?: Campaign;
};

type CampaignQRCodesResponse = {
  success?: boolean;
  message?: string;
  data?: CampaignQRCode[];
};

type CampaignQRCodeResponse = {
  success?: boolean;
  message?: string;
  data?: CampaignQRCode;
};

type Period = {
  days: number;
  startDate: string;
  endDate: string;
};

export type CampaignAnalytics = {
  campaign: Campaign;
  period: Period;
  overview?: {
    totalScans?: number;
    uniqueVisitors?: number;
    totalConversions?: number;
    conversionValue?: number;
  };
  summary: {
    totalScans: number;
    totalVisitors: number;
    totalConversions: number;
    totalConversionValue: number;
  };
};

type CampaignAnalyticsResponse = {
  success?: boolean;
  message?: string;
  data?: CampaignAnalytics;
};

export type QRPerformanceRow = {
  rank: number;
  id: string;
  name: string;
  shortCode: string;
  status: string;
  lifetimeScanCount?: number;
  metrics: {
    scans: number;
    uniqueVisitors: number;
    conversions: number;
    uniqueConverters: number;
    conversionRate: number;
    conversionValue: number;
  };
};

export type QRPerformanceAnalytics = {
  campaign: Campaign;
  period: Period;
  summary: {
    qrCodes: number;
    totalScans: number;
    totalVisitors: number;
    totalConversions: number;
    totalConversionValue: number;
  };
  qrCodes: QRPerformanceRow[];
};

type QRPerformanceResponse = {
  success?: boolean;
  message?: string;
  data?: QRPerformanceAnalytics;
};

export type AttributionAnalytics = {
  campaign: Campaign;
  period: Period;
  summary: {
    totalConversions: number;
    attributedConversions: number;
    unattributedConversions: number;
    attributionRate: number;
  };
  conversionTypes: Array<{
    type: string;
    conversions: number;
  }>;
  conversionValue: {
    currencies: Array<{
      currency: string | null;
      value: number;
    }>;
    total: number;
  };
};

type AttributionResponse = {
  success?: boolean;
  message?: string;
  data?: AttributionAnalytics;
};

/**
 * GET /campaign/business/:businessId/campaigns
 * — campaign library list.
 */
export async function getCampaigns(
  businessId: string
): Promise<Campaign[]> {
  const res =
    await api.get<CampaignListResponse>(
      `/campaign/business/${businessId}/campaigns`
    );

  return res.data?.data ?? [];
}

/**
 * POST /campaign/business/:businessId/campaigns
 * — create a campaign ({ name, description,
 * startsAt, endsAt }).
 */
export async function createCampaign(
  businessId: string,
  input: CampaignInput
): Promise<Campaign> {
  const res =
    await api.post<CampaignResponse>(
      `/campaign/business/${businessId}/campaigns`,
      input
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to create campaign."
    );
  }

  return res.data.data;
}

/**
 * PATCH /campaign/business/:businessId/campaigns/:campaignId
 * — edit a campaign ({ name, description,
 * startsAt, endsAt }).
 */
export async function updateCampaign(
  businessId: string,
  campaignId: string,
  input: Partial<CampaignInput>
): Promise<Campaign> {
  const res =
    await api.patch<CampaignResponse>(
      `/campaign/business/${businessId}/campaigns/${campaignId}`,
      input
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to update campaign."
    );
  }

  return res.data.data;
}

/**
 * PATCH /campaign/business/:businessId/campaigns/:campaignId/status
 * — status action ({ status }: ACTIVE / PAUSED /
 * COMPLETED / ARCHIVED).
 */
export async function setCampaignStatus(
  businessId: string,
  campaignId: string,
  status: CampaignStatus
): Promise<Campaign> {
  const res =
    await api.patch<CampaignResponse>(
      `/campaign/business/${businessId}/campaigns/${campaignId}/status`,
      { status }
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to update campaign status."
    );
  }

  return res.data.data;
}

/**
 * GET /campaign/business/:businessId/campaigns/:campaignId/qrcodes
 * — QR codes attached to this campaign.
 */
export async function getCampaignQRCodes(
  businessId: string,
  campaignId: string
): Promise<CampaignQRCode[]> {
  const res =
    await api.get<CampaignQRCodesResponse>(
      `/campaign/business/${businessId}/campaigns/${campaignId}/qrcodes`
    );

  return res.data?.data ?? [];
}

/**
 * POST /campaign/business/:businessId/campaigns/:campaignId/qrcodes/:qrCodeId
 * — attach a QR code to the campaign.
 */
export async function attachQRCode(
  businessId: string,
  campaignId: string,
  qrCodeId: string
): Promise<CampaignQRCode> {
  const res =
    await api.post<CampaignQRCodeResponse>(
      `/campaign/business/${businessId}/campaigns/${campaignId}/qrcodes/${qrCodeId}`
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to attach QR code."
    );
  }

  return res.data.data;
}

/**
 * DELETE /campaign/business/:businessId/campaigns/:campaignId/qrcodes/:qrCodeId
 * — detach a QR code from the campaign.
 */
export async function detachQRCode(
  businessId: string,
  campaignId: string,
  qrCodeId: string
): Promise<void> {
  await api.delete(
    `/campaign/business/${businessId}/campaigns/${campaignId}/qrcodes/${qrCodeId}`
  );
}

/**
 * GET /analytics/business/:businessId/campaigns/:campaignId?days=
 * — campaign-level analytics payload (mirrors the web
 * dashboard's CampaignAnalytics type).
 */
export async function getCampaignAnalytics(
  businessId: string,
  campaignId: string,
  days = 30
): Promise<CampaignAnalytics> {
  const res =
    await api.get<CampaignAnalyticsResponse>(
      `/analytics/business/${businessId}/campaigns/${campaignId}?days=${days}`
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to load campaign analytics."
    );
  }

  return res.data.data;
}

/**
 * GET /analytics/business/:businessId/campaigns/:campaignId/conversion-attribution?days=
 * — conversion attribution breakdown for the campaign.
 */
export async function getCampaignAttribution(
  businessId: string,
  campaignId: string,
  days = 30
): Promise<AttributionAnalytics> {
  const res =
    await api.get<AttributionResponse>(
      `/analytics/business/${businessId}/campaigns/${campaignId}/conversion-attribution?days=${days}`
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to load conversion attribution."
    );
  }

  return res.data.data;
}

/**
 * GET /analytics/business/:businessId/campaigns/:campaignId/qr-performance?days=
 * — per-QR performance table for the campaign.
 */
export async function getCampaignQRPerformance(
  businessId: string,
  campaignId: string,
  days = 30
): Promise<QRPerformanceAnalytics> {
  const res =
    await api.get<QRPerformanceResponse>(
      `/analytics/business/${businessId}/campaigns/${campaignId}/qr-performance?days=${days}`
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to load QR performance."
    );
  }

  return res.data.data;
}
