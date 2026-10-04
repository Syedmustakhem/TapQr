import { AppError } from "../../cores/errors/AppError";
import { GrowthRepository } from "./growth.repository";

/*
 * ============================================================
 * TRIAL SERVICE
 * ============================================================
 *
 * 15-day Pro trial. No card required.
 *
 * Anti-abuse (all server-side, never trust the client):
 *  1. Trial requires an OTP-verified phone (AuthProvider
 *     PHONE + isVerified). Email-only accounts cannot claim.
 *  2. One trial per user (userId unique).
 *  3. One trial per verified phone — a second account with
 *     the same phone is rejected at claim time.
 *  4. Paid subscribers cannot claim a trial (they are
 *     already Pro; nothing to try).
 *
 * Gating needs no cron: the trial sets User.proUntil, and
 * entitlements.ts treats proUntil > now as Pro. When the
 * timestamp passes, access drops back to Free automatically.
 */

export const TRIAL_DAYS = 15;

const repository = new GrowthRepository();

function daysLeftUntil(endsAt: Date): number {
  const ms =
    endsAt.getTime() - Date.now();

  return Math.max(
    0,
    Math.ceil(ms / (24 * 60 * 60 * 1000))
  );
}

export async function startTrial(
  userId: string
) {
  if (
    await repository.hasActiveSubscription(
      userId
    )
  ) {
    throw new AppError(
      "You are already on a Pro plan — no trial needed.",
      400,
      "ALREADY_PRO"
    );
  }

  const existing =
    await repository.getTrialByUserId(
      userId
    );

  if (existing) {
    throw new AppError(
      "You have already used your free trial.",
      400,
      "TRIAL_ALREADY_CLAIMED"
    );
  }

  const phone =
    await repository.getVerifiedPhone(
      userId
    );

  if (!phone) {
    throw new AppError(
      "Verify your phone number with OTP to start the free trial.",
      400,
      "PHONE_VERIFICATION_REQUIRED"
    );
  }

  const phoneTrial =
    await repository.getTrialByPhone(
      phone
    );

  if (phoneTrial) {
    throw new AppError(
      "This phone number has already claimed a free trial.",
      400,
      "TRIAL_ALREADY_CLAIMED"
    );
  }

  const endsAt = new Date(
    Date.now() +
      TRIAL_DAYS * 24 * 60 * 60 * 1000
  );

  const trial =
    await repository.createTrial({
      userId,
      phone,
      endsAt,
    });

  // Ledger row + proUntil extension, atomically.
  await repository.grantProDays(
    userId,
    TRIAL_DAYS,
    "TRIAL"
  );

  return {
    status: trial.status,
    startsAt: trial.startsAt,
    endsAt: trial.endsAt,
    daysLeft: TRIAL_DAYS,
  };
}

export async function getTrialStatus(
  userId: string
) {
  const [
    trial,
    hasPaidSubscription,
    proUntil,
    phone,
  ] = await Promise.all([
    repository.getTrialByUserId(userId),
    repository.hasActiveSubscription(
      userId
    ),
    repository.getUserProUntil(userId),
    repository.getVerifiedPhone(userId),
  ]);

  // Lazy expiry: no cron needed. The first status read
  // after the deadline flips the row to EXPIRED.
  let status = trial?.status ?? null;

  if (
    trial &&
    trial.status === "ACTIVE" &&
    trial.endsAt.getTime() <= Date.now()
  ) {
    await repository.updateTrial(
      trial.id,
      { status: "EXPIRED" }
    );
    status = "EXPIRED";
  }

  const eligibleForTrial =
    !hasPaidSubscription &&
    !trial &&
    phone !== null;

  return {
    hasTrial: trial !== null,
    status,
    startsAt: trial?.startsAt ?? null,
    endsAt: trial?.endsAt ?? null,
    daysLeft:
      trial && status === "ACTIVE"
        ? daysLeftUntil(trial.endsAt)
        : 0,
    phoneVerified: phone !== null,
    eligibleForTrial,
    hasPaidSubscription,
    proUntil,
  };
}

/*
 * Called from the billing webhook when a subscription turns
 * ACTIVE. A trial that converts is marked CONVERTED so
 * trial analytics stay honest (claimed vs converted).
 */
export async function markTrialConverted(
  userId: string
): Promise<void> {
  const trial =
    await repository.getTrialByUserId(
      userId
    );

  if (
    trial &&
    trial.status === "ACTIVE"
  ) {
    await repository.updateTrial(
      trial.id,
      {
        status: "CONVERTED",
        convertedAt: new Date(),
      }
    );
  }
}
