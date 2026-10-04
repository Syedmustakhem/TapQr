import { AppError } from "../../cores/errors/AppError";
import { BillingRepository } from "./billing.repository";

/*
 * ============================================================
 * ENTITLEMENTS
 * ============================================================
 *
 * Single place that answers "what is this user allowed to do?"
 * Every gated endpoint calls one of these helpers.
 *
 * Denials throw AppError(403, "UPGRADE_REQUIRED") so the
 * frontend can render a paywall instead of a dead-end error.
 */

const repository = new BillingRepository();

export interface EffectivePlan {
  code: string;
  name: string;
  maxQrs: number;
  maxBusinesses: number;
  maxSeats: number;
  features: string[];
}

const FREE_PLAN: EffectivePlan = {
  code: "FREE",
  name: "Free",
  maxQrs: 1,
  maxBusinesses: 1,
  maxSeats: 1,
  features: [],
};

function toEffectivePlan(
  plan: {
    code: string;
    name: string;
    maxQrs: number;
    maxBusinesses: number;
    maxSeats: number;
    features: unknown;
  } | null
): EffectivePlan {
  if (!plan) {
    return FREE_PLAN;
  }

  return {
    code: plan.code,
    name: plan.name,
    maxQrs: plan.maxQrs,
    maxBusinesses: plan.maxBusinesses,
    maxSeats: plan.maxSeats,
    features: Array.isArray(plan.features)
      ? (plan.features as string[])
      : [],
  };
}

/*
 * The user's current plan.
 * No ACTIVE subscription  ->  FREE.
 * (Extend here later: trials, grandfathering, org overrides.)
 */
export async function getEffectivePlan(
  userId: string
): Promise<EffectivePlan> {
  const subscription =
    await repository.getActiveSubscription(
      userId
    );

  return toEffectivePlan(
    subscription?.plan ?? null
  );
}

export function hasFeature(
  plan: EffectivePlan,
  feature: string
): boolean {
  return plan.features.includes(feature);
}

function upgradeError(
  featureLabel: string
): AppError {
  return new AppError(
    `${featureLabel} requires a Pro plan. Upgrade to unlock it.`,
    403,
    "UPGRADE_REQUIRED"
  );
}

export async function assertCanCreateQR(
  userId: string
): Promise<void> {
  const plan = await getEffectivePlan(
    userId
  );

  const count =
    await repository.countQRCodes(userId);

  if (count >= plan.maxQrs) {
    throw new AppError(
      `Your ${plan.name} plan allows up to ${plan.maxQrs} QR code(s). Upgrade for more.`,
      403,
      "UPGRADE_REQUIRED"
    );
  }
}

export async function assertCanCreateBusiness(
  userId: string
): Promise<void> {
  const plan = await getEffectivePlan(
    userId
  );

  const count =
    await repository.countBusinesses(
      userId
    );

  if (count >= plan.maxBusinesses) {
    throw new AppError(
      `Your ${plan.name} plan allows up to ${plan.maxBusinesses} business(es). Upgrade for more.`,
      403,
      "UPGRADE_REQUIRED"
    );
  }
}

/*
 * Smart Rules are a Pro feature (Phase 2 gating).
 * Included here so the hook point is ready.
 */
export async function assertCanUseSmartRules(
  userId: string
): Promise<void> {
  const plan = await getEffectivePlan(
    userId
  );

  if (!hasFeature(plan, "smart_rules")) {
    throw upgradeError("Smart Rules");
  }
}

export async function assertCanUseReviewFunnel(
  userId: string
) {
  const plan = await getEffectivePlan(
    userId
  );

  if (!hasFeature(plan, "review_funnel")) {
    throw upgradeError("Review Funnel");
  }
}
export async function assertCanUseSpecialsBanner(
  userId: string
): Promise<void> {
  const plan = await getEffectivePlan(
    userId
  );

  if (!hasFeature(plan, "specials_banner")) {
    throw upgradeError(
      "Today's Specials Banner"
    );
  }
}
export async function assertCanUseLoyaltyCard(
  userId: string
): Promise<void> {
  const plan = await getEffectivePlan(
    userId
  );

  if (!hasFeature(plan, "loyalty_card")) {
    throw upgradeError(
      "Digital Loyalty Card"
    );
  }
}
export async function assertCanUseBranding(
  userId: string
): Promise<void> {
  const plan = await getEffectivePlan(
    userId
  );

  if (!hasFeature(plan, "branding")) {
    throw upgradeError("Custom branding");
  }
}
export async function assertCanUseAppointmentBooking(
  userId: string
): Promise<void> {
  const plan = await getEffectivePlan(
    userId
  );

  if (!hasFeature(plan, "appointment_booking")) {
    throw upgradeError(
      "Appointment Booking"
    );
  }
}
export async function assertCanUseWhatsAppOrdering(
  userId: string
): Promise<void> {
  const plan = await getEffectivePlan(
    userId
  );

  if (!hasFeature(plan, "whatsapp_ordering")) {
    throw upgradeError(
      "WhatsApp Ordering"
    );
  }
}
