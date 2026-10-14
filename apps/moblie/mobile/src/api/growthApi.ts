// src/api/growthApi.ts
//
// Growth / referral endpoints, mirroring the TapQR web
// dashboard (components/billing/ReferralWidget calls
// these exact paths against https://api.tapqr.shop/api).
//
// Uses the shared authenticated axios instance from
// authApi.ts (Bearer token + 401 refresh interceptors).

import api from "./authApi";

export type ReferralStatsData = {
  code: string | null;
  counts: {
    pending: number;
    qualified: number;
    rewarded: number;
    rejected: number;
  };
  earnedDays: number;
  proUntil: string | null;
  rewardDays: number;
  refereeBonusDays: number;
  maxRewardsPerYear: number;
};

type ReferralStatsResponse = {
  success?: boolean;
  message?: string;
  data?: ReferralStatsData;
};

/**
 * GET /growth/referral/stats — the user's referral
 * code plus live reward stats (earnedDays, proUntil,
 * rewardDays, referral counts).
 */
export async function getReferralStats(): Promise<ReferralStatsData> {
  const res =
    await api.get<ReferralStatsResponse>(
      "/growth/referral/stats"
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to load referral stats."
    );
  }

  return res.data.data;
}

type ReferralCodeResponse = {
  success?: boolean;
  message?: string;
  data?: { code: string };
};

/**
 * POST /growth/referral/code — get or create the
 * user's referral code.
 */
export async function getOrCreateReferralCode(): Promise<string> {
  const res =
    await api.post<ReferralCodeResponse>(
      "/growth/referral/code"
    );

  if (!res.data?.data?.code) {
    throw new Error(
      res.data?.message ??
        "Unable to generate a referral code."
    );
  }

  return res.data.data.code;
}

/**
 * Single source of truth for referral links.
 * Matches the web dashboard's buildReferralLink —
 * invites point at the login page with the ref param.
 */
export function buildReferralLink(
  code: string
): string {
  return `https://tapqr.shop/login?ref=${encodeURIComponent(
    code
  )}`;
}
