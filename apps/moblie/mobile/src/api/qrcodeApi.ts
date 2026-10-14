// src/api/qrcodeApi.ts
//
// QR code endpoints, mirroring the TapQR web dashboard
// (app/dashboard/qr calls these exact paths against
// https://api.tapqr.shop/api).
//
// Uses the shared authenticated axios instance from
// authApi.ts (Bearer token + 401 refresh interceptors).

import api from "./authApi";

export type QRStatus =
  | "ACTIVE"
  | "PAUSED"
  | "EXPIRED";

export type QRType =
  | "STATIC"
  | "DYNAMIC";

export type QRCodeRecord = {
  id: string;
  businessId?: string;
  name: string;
  description?: string | null;
  type: QRType;
  destinationUrl?: string | null;
  shortCode: string;
  status: QRStatus;
  experienceType?: string | null;
  scanCount?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

type QRListResponse = {
  success?: boolean;
  message?: string;
  data?: QRCodeRecord[];
};

type QRResponse = {
  success?: boolean;
  message?: string;
  data?: QRCodeRecord;
};

export type QRBranding = {
  qrForegroundColor?: string | null;
  qrBackgroundColor?: string | null;
  [key: string]: unknown;
};

type BrandingResponse = {
  success?: boolean;
  message?: string;
  data?: QRBranding;
};

/**
 * GET /qrcodes/business/:businessId — list QR codes.
 */
export async function getQRCodes(
  businessId: string
): Promise<QRCodeRecord[]> {
  const res =
    await api.get<QRListResponse>(
      `/qrcodes/business/${businessId}`
    );

  return res.data?.data ?? [];
}

/**
 * PUT /qrcodes/:id — update a QR code.
 * The web dashboard pauses/activates via
 * PUT /qrcodes/:id { status }.
 */
export async function updateQRCode(
  id: string,
  input: Partial<QRCodeRecord>
): Promise<QRCodeRecord> {
  const res =
    await api.put<QRResponse>(
      `/qrcodes/${id}`,
      input
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to update QR code."
    );
  }

  return res.data.data;
}

/**
 * Convenience wrapper for the pause/activate row action.
 */
export async function setQRCodeStatus(
  id: string,
  status: "ACTIVE" | "PAUSED"
): Promise<QRCodeRecord> {
  return updateQRCode(id, { status });
}

/**
 * DELETE /qrcodes/:id — delete a QR code.
 */
export async function deleteQRCode(
  id: string
): Promise<void> {
  await api.delete(`/qrcodes/${id}`);
}

/**
 * GET /qrcodes/:qrCodeId/branding — load QR Studio
 * design settings. Returns null when no branding
 * record exists yet (web falls back to defaults).
 */
export async function getQRBranding(
  qrCodeId: string
): Promise<QRBranding | null> {
  const res =
    await api.get<BrandingResponse>(
      `/qrcodes/${qrCodeId}/branding`
    );

  return res.data?.data ?? null;
}

/**
 * PUT /qrcodes/:qrCodeId/branding — save QR Studio
 * design settings.
 */
export async function updateQRBranding(
  qrCodeId: string,
  branding: QRBranding
): Promise<QRBranding> {
  const res =
    await api.put<BrandingResponse>(
      `/qrcodes/${qrCodeId}/branding`,
      branding
    );

  return res.data?.data ?? branding;
}

/**
 * Public scan URL encoded in the QR image.
 * QR image generation stays client-side
 * (react-native-qrcode-svg) — no backend needed.
 */
export function publicQRUrl(
  shortCode: string
): string {
  return `https://tapqr.shop/r/${shortCode}`;
}
