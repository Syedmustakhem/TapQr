import { Request } from "express";

export interface AnalyticsAuthRequest
  extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export interface RecordScanInput {
  qrCodeId: string;

  ipAddress?: string;

  userAgent?: string;

  referrer?: string;

  browser?: string;

  device?: string;

  operatingSystem?: string;
}