import { Request } from "express";

export interface AnalyticsAuthRequest
  extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/*
|--------------------------------------------------------------------------
| PUBLIC QR SCAN
|--------------------------------------------------------------------------
*/

export interface RecordScanInput {
  qrCodeId: string;

  ipAddress?: string;

  userAgent?: string;

  referrer?: string;

  browser?: string;

  device?: string;

  operatingSystem?: string;
}

/*
|--------------------------------------------------------------------------
| ANALYTICS QUERY
|--------------------------------------------------------------------------
*/

export interface AnalyticsQuery {
  days: number;

  qrCodeId?: string;

  limit: number;
}