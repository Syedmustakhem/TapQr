// src/api/businessApi.ts
//
// Business endpoints, mirroring the TapQR web dashboard
// (app/dashboard and app/dashboard/business call these
// exact paths against https://api.tapqr.shop/api).
//
// Uses the shared authenticated axios instance from
// authApi.ts (Bearer token + 401 refresh interceptors).

import api from "./authApi";

export type Business = {
  id: string;
  name: string;
  slug?: string | null;
  email?: string | null;
  phone?: string | null;
  logo?: string | null;
  description?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

type BusinessesResponse = {
  success?: boolean;
  message?: string;
  data?: Business[];
};

type BusinessResponse = {
  success?: boolean;
  message?: string;
  data?: Business;
};

export type CreateBusinessInput = {
  name: string;
  email?: string;
  phone?: string;
  logo?: string;
  description?: string;
};

export type UpdateBusinessInput = Partial<{
  name: string;
  legalName: string | null;
  displayName: string | null;
  businessType: string | null;
  industry: string | null;
  category: string | null;
  subcategory: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  whatsapp: string | null;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  country: string;
  timezone: string;
  currency: string;
  language: string;
}>;

export type UpdateBusinessProfileInput =
  Record<string, unknown>;

/**
 * GET /businesses — list the user's businesses.
 */
export async function getBusinesses(): Promise<
  Business[]
> {
  const res =
    await api.get<BusinessesResponse>(
      "/businesses"
    );

  return res.data?.data ?? [];
}

/**
 * POST /businesses — create a business.
 * Web sends { name, email?, phone?, logo?, description? }.
 */
export async function createBusiness(
  input: CreateBusinessInput
): Promise<Business> {
  const res =
    await api.post<BusinessResponse>(
      "/businesses",
      input
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to create business."
    );
  }

  return res.data.data;
}

/**
 * PATCH /businesses/:id — update business-level fields
 * (name, category, phone, ...).
 */
export async function updateBusiness(
  id: string,
  input: UpdateBusinessInput
): Promise<Business> {
  const res =
    await api.patch<BusinessResponse>(
      `/businesses/${id}`,
      input
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to update business."
    );
  }

  return res.data.data;
}

/**
 * PATCH /businesses/:id/profile — update the public
 * business profile (addressLine1, tagline, ...).
 */
export async function updateBusinessProfile(
  id: string,
  input: UpdateBusinessProfileInput
): Promise<void> {
  await api.patch(
    `/businesses/${id}/profile`,
    input
  );
}

/**
 * DELETE /businesses/:id — deactivate a business.
 */
export async function deleteBusiness(
  id: string
): Promise<void> {
  await api.delete(
    `/businesses/${id}`
  );
}
