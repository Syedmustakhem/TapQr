/**
 * Data captured when a QR Code is scanned.
 *
 * This data comes from the public QR redirect request,
 * not from the authenticated user.
 */
export interface CreateScanEventDTO {
  qrCodeId: string;

  ipAddress?: string;

  country?: string;

  city?: string;

  browser?: string;

  device?: string;

  operatingSystem?: string;

  referrer?: string;

  userAgent?: string;
}

/**
 * Basic scan information returned by analytics APIs.
 */
export interface ScanEventResponse {
  id: string;

  qrCodeId: string;

  ipAddress: string | null;

  country: string | null;

  city: string | null;

  browser: string | null;

  device: string | null;

  operatingSystem: string | null;

  referrer: string | null;

  userAgent: string | null;

  scannedAt: Date;
}