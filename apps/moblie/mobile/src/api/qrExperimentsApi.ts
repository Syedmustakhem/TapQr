// src/api/qrExperimentsApi.ts
//
// A/B experiment endpoints, mirroring the TapQR web
// dashboard (app/dashboard/qr/experiments,
// /experiments/new, /experiments/[experimentId] call
// these exact paths against https://api.tapqr.shop/api).
//
// Uses the shared authenticated axios instance from
// authApi.ts (Bearer token + 401 refresh interceptors).
//
// NOTE: the web list page fetches the QR dropdown from
// same-origin GET /api/qr-codes/options (a Next.js route,
// not the backend). Mobile uses
// GET /qrcodes/business/:businessId (via qrcodeApi)
// against the API instead.

import api from "./authApi";

import type { QRRuleActionType } from "./qrRulesApi";

export type QRExperimentStatus =
  | "DRAFT"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "ARCHIVED";

export type QRExperimentAllocationType =
  | "PERCENTAGE"
  | "FIXED";

export type QRExperimentVariant = {
  id: string;
  experimentId: string;

  name: string;
  allocation: number;

  actionType: QRRuleActionType;
  actionValue: string;

  participantCount?: number;
  conversionCount?: number;

  createdAt?: string;
  updatedAt?: string;
};

export type QRExperiment = {
  id: string;
  qrCodeId: string;

  name: string;
  description?: string | null;

  status: QRExperimentStatus;
  allocationType: QRExperimentAllocationType;

  startsAt?: string | null;
  endsAt?: string | null;

  participantCount?: number;
  conversionCount?: number;

  createdAt?: string;
  updatedAt?: string;

  variants?: QRExperimentVariant[];

  qrCode?: {
    id: string;
    name?: string;
    shortCode?: string;
  } | null;
};

export type CreateQRExperimentInput = {
  qrCodeId: string;

  name: string;
  description?: string | null;

  allocationType?: QRExperimentAllocationType;

  startsAt?: string | null;
  endsAt?: string | null;
};

export type CreateQRExperimentVariantInput = {
  name: string;
  allocation: number;

  actionType: QRRuleActionType;
  actionValue: string;
};

export type UpdateQRExperimentVariantInput = {
  name?: string;
  allocation?: number;

  actionType?: QRRuleActionType;
  actionValue?: string;
};

type QRExperimentsResponse = {
  success?: boolean;
  message?: string;
  data?: QRExperiment[];
};

type QRExperimentResponse = {
  success?: boolean;
  message?: string;
  data?: QRExperiment;
};

type QRExperimentVariantResponse = {
  success?: boolean;
  message?: string;
  data?: QRExperimentVariant;
};

/**
 * GET /qr-experiments?qrCodeId= — list experiments,
 * optionally filtered to one QR code.
 */
export async function listQRExperiments(
  qrCodeId?: string
): Promise<QRExperiment[]> {
  const query = qrCodeId
    ? `?qrCodeId=${encodeURIComponent(
        qrCodeId
      )}`
    : "";

  const res =
    await api.get<QRExperimentsResponse>(
      `/qr-experiments${query}`
    );

  return res.data?.data ?? [];
}

/**
 * GET /qr-experiments/:id — load one experiment
 * with its variants.
 */
export async function getQRExperiment(
  experimentId: string
): Promise<QRExperiment> {
  const res =
    await api.get<QRExperimentResponse>(
      `/qr-experiments/${encodeURIComponent(
        experimentId
      )}`
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Experiment not found."
    );
  }

  return res.data.data;
}

/**
 * POST /qr-experiments — create the experiment
 * shell. Variants are added afterwards with one
 * POST /qr-experiments/:id/variants call per variant.
 */
export async function createQRExperiment(
  input: CreateQRExperimentInput
): Promise<QRExperiment> {
  const res =
    await api.post<QRExperimentResponse>(
      "/qr-experiments",
      input
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to create experiment."
    );
  }

  return res.data.data;
}

/**
 * POST /qr-experiments/:id/variants — add one
 * variant to an experiment.
 */
export async function createQRExperimentVariant(
  experimentId: string,
  input: CreateQRExperimentVariantInput
): Promise<QRExperimentVariant> {
  const res =
    await api.post<QRExperimentVariantResponse>(
      `/qr-experiments/${encodeURIComponent(
        experimentId
      )}/variants`,
      input
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to add variant."
    );
  }

  return res.data.data;
}

/**
 * PATCH /qr-experiments/:experimentId/variants/:variantId
 * — update one variant inline.
 */
export async function updateQRExperimentVariant(
  experimentId: string,
  variantId: string,
  input: UpdateQRExperimentVariantInput
): Promise<QRExperimentVariant> {
  const res =
    await api.patch<QRExperimentVariantResponse>(
      `/qr-experiments/${encodeURIComponent(
        experimentId
      )}/variants/${encodeURIComponent(
        variantId
      )}`,
      input
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to update variant."
    );
  }

  return res.data.data;
}

/**
 * DELETE /qr-experiments/:experimentId/variants/:variantId
 * — delete one variant.
 */
export async function deleteQRExperimentVariant(
  experimentId: string,
  variantId: string
): Promise<void> {
  await api.delete(
    `/qr-experiments/${encodeURIComponent(
      experimentId
    )}/variants/${encodeURIComponent(
      variantId
    )}`
  );
}

/**
 * POST /qr-experiments/:id/start — start traffic
 * allocation.
 */
export async function startQRExperiment(
  experimentId: string
): Promise<QRExperiment> {
  const res =
    await api.post<QRExperimentResponse>(
      `/qr-experiments/${encodeURIComponent(
        experimentId
      )}/start`
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to start experiment."
    );
  }

  return res.data.data;
}

/**
 * POST /qr-experiments/:id/pause — pause traffic
 * allocation.
 */
export async function pauseQRExperiment(
  experimentId: string
): Promise<QRExperiment> {
  const res =
    await api.post<QRExperimentResponse>(
      `/qr-experiments/${encodeURIComponent(
        experimentId
      )}/pause`
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to pause experiment."
    );
  }

  return res.data.data;
}

/**
 * POST /qr-experiments/:id/complete — mark the
 * experiment complete.
 */
export async function completeQRExperiment(
  experimentId: string
): Promise<QRExperiment> {
  const res =
    await api.post<QRExperimentResponse>(
      `/qr-experiments/${encodeURIComponent(
        experimentId
      )}/complete`
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to complete experiment."
    );
  }

  return res.data.data;
}

/**
 * DELETE /qr-experiments/:id — archive/delete an
 * experiment (the web list page's "Archive" menu
 * action).
 */
export async function deleteQRExperiment(
  experimentId: string
): Promise<void> {
  await api.delete(
    `/qr-experiments/${encodeURIComponent(
      experimentId
    )}`
  );
}
