// src/api/settingsApi.ts
//
// Account + preference endpoints, mirroring the TapQR web
// dashboard settings page (app/dashboard/settings calls
// these exact paths against https://api.tapqr.shop/api).
//
// Uses the shared authenticated axios instance from
// authApi.ts (Bearer token + 401 refresh interceptors).

import api, {
  getMe,
} from "./authApi";

export type AuthUser = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  role?: string;
};

type MeResponse = {
  success?: boolean;
  message?: string;
  data?: AuthUser;
  user?: AuthUser;
};

/**
 * GET /auth/me — the authenticated user's profile.
 * (authApi.getMe returns the raw response envelope.)
 */
export async function fetchMe(): Promise<AuthUser | null> {
  const envelope =
    (await getMe()) as MeResponse;

  return (
    envelope?.data ?? envelope?.user ?? null
  );
}

/**
 * PATCH /auth/me — update name / phone.
 * Web sends { fullName, phone? }.
 */
export async function updateMe(input: {
  fullName?: string;
  phone?: string;
}): Promise<AuthUser | null> {
  const res =
    await api.patch<MeResponse>(
      "/auth/me",
      input
    );

  return (
    res.data?.data ??
    res.data?.user ??
    null
  );
}

export type PreferencesData = {
  language: string;
  timezone: string;
};

type PreferencesResponse = {
  success?: boolean;
  message?: string;
  data?: PreferencesData;
};

/**
 * GET /settings/preferences
 */
export async function getPreferences(): Promise<PreferencesData | null> {
  const res =
    await api.get<PreferencesResponse>(
      "/settings/preferences"
    );

  return res.data?.data ?? null;
}

/**
 * PATCH /settings/preferences
 */
export async function updatePreferences(
  input: Partial<PreferencesData>
): Promise<PreferencesData | null> {
  const res =
    await api.patch<PreferencesResponse>(
      "/settings/preferences",
      input
    );

  return res.data?.data ?? null;
}
