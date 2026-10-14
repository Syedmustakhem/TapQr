// src/api/analyticsApi.ts
//
// Analytics endpoints, mirroring the TapQR web dashboard
// (app/dashboard and app/dashboard/analytics call these
// exact paths against https://api.tapqr.shop/api).
//
// Uses the shared authenticated axios instance from
// authApi.ts (Bearer token + 401 refresh interceptors).

import api from "./authApi";

export type AnalyticsOverview = {
  totalScans?: number | string | null;
  uniqueVisitors?: number | string | null;
  previousPeriodScans?:
    | number
    | string
    | null;
  percentageChange?:
    | number
    | string
    | null;
  activeQrCodes?: number | string | null;
  totalQrCodes?: number | string | null;
  averageDailyScans?:
    | number
    | string
    | null;
};

export type ScanByDay = {
  date: string;
  scans: number | string;
};

export type BreakdownRow = {
  name?: string | null;
  scans?: number | string | null;
  conversions?: number | string | null;
  value?: number | string | null;
  currency?: string | null;
};

export type QRPerformanceRow = {
  id: string;
  name: string;
  shortCode?: string | null;
  scanCount?: number | string | null;
  status?: string | null;
  experienceType?: string | null;
};

export type RecentScanRow = {
  id: string;
  qrCodeId: string;
  city?: string | null;
  country?: string | null;
  device?: string | null;
  browser?: string | null;
  operatingSystem?: string | null;
  referrer?: string | null;
  scannedAt: string;
};

export type AnalyticsData = {
  overview?: AnalyticsOverview;
  scansByDay?: ScanByDay[];
  qrPerformance?: QRPerformanceRow[];
  recentScans?: RecentScanRow[];
  devices?: BreakdownRow[];
  countries?: BreakdownRow[];
  cities?: BreakdownRow[];
};

type AnalyticsResponse = {
  success?: boolean;
  message?: string;
  data?: AnalyticsData;
};

/**
 * GET /analytics/business/:businessId?days=&limit=
 * — the main analytics payload used by both the
 * Overview and Analytics pages on web.
 */
export async function getBusinessAnalytics(
  businessId: string,
  days = 30,
  limit = 10
): Promise<AnalyticsData> {
  const res =
    await api.get<AnalyticsResponse>(
      `/analytics/business/${businessId}?days=${days}&limit=${limit}`
    );

  return res.data?.data ?? {};
}
