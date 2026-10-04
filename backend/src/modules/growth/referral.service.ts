import { randomBytes } from "crypto";
import { AppError } from "../../cores/errors/AppError";
import { GrowthRepository } from "./growth.repository";

/*
 * ============================================================
 * REFERRAL SERVICE  —  "Refer & Earn: double-sided rewards"
 * ============================================================
 *
 * Rules (the trustable/secure part):
 *
 *  1. Codes are crypto-random and unguessable — never
 *     sequential, never derived from the user id.
 *  2. Attribution is server-side only: the signup page sends
 *     the code, the backend validates it. The client can
 *     never mint or forge a referral.
 *  3. No self-referral: attributing your own code is
 *     rejected (same user id).
 *  4. One reward per referee: refereeUserId is UNIQUE, so a
 *     referee can only ever earn their referrer one reward.
 *  5. Reward pays out ONLY on the referee's first CAPTURED
 *     payment — not on signup, not on trial start. Fake
 *     accounts earn nothing.
 *  6. Same-phone farming is rejected at payout: if referrer
 *     and referee share one verified phone, no reward.
 *  7. Yearly cap: max 6 rewarded referrals per referrer per
 *     rolling 365 days. Farming beyond that earns nothing.
 *  8. Payout is DOUBLE-SIDED and atomic: the referrer gets
 *     30 days Pro (REFERRAL_REWARD) and the paying referee
 *     gets 45 days Pro bonus (REFEREE_BONUS = 30d + 15d
 *     extra), in ONE transaction. An atomic PENDING ->
 *     REWARDED claim means retried webhooks can never
 *     double-grant either side.
 *  9. Rewards extend proUntil AFTER existing Pro time
 *     (max(now, proUntil) + days) — credits stack, never
 *     overwrite or shorten paid time.
 */

export const REFERRAL_REWARD_DAYS = 30;
export const REFEREE_BONUS_DAYS = 45;
export const MAX_REWARDS_PER_YEAR = 6;

// No 0/O, 1/I/L — codes are read aloud and typed by hand.
const CODE_ALPHABET =
  "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

const repository = new GrowthRepository();

function generateCode(): string {
  const bytes = randomBytes(
    CODE_LENGTH
  );
  let code = "";

  for (let i = 0; i < CODE_LENGTH; i++) {
    code +=
      CODE_ALPHABET[
        bytes[i] % CODE_ALPHABET.length
      ];
  }

  return code;
}

export async function getOrCreateCode(
  userId: string
) {
  const existing =
    await repository.getReferralCodeByUserId(
      userId
    );

  if (existing) {
    return existing;
  }

  // Collision retry: 8 chars over a 31-char alphabet
  // makes collisions ~impossible, but retry anyway.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await repository.createReferralCode(
        userId,
        generateCode()
      );
    } catch (error: any) {
      if (
        error?.code !== "P2002" ||
        attempt === 4
      ) {
        throw error;
      }
    }
  }

  throw new AppError(
    "Could not generate a referral code. Please try again.",
    500,
    "CODE_GENERATION_FAILED"
  );
}

/*
 * Public: lets the signup page show "invited by ..." UX.
 * Reveals nothing except that the code exists.
 */
export async function validateCode(
  rawCode: string
) {
  const code = rawCode
    .trim()
    .toUpperCase();

  const record =
    await repository.getReferralCodeByCode(
      code
    );

  return {
    valid: record !== null,
    code: record ? record.code : null,
  };
}

export async function attributeReferral(
  refereeUserId: string,
  rawCode: string
) {
  const code = rawCode
    .trim()
    .toUpperCase();

  const codeRecord =
    await repository.getReferralCodeByCode(
      code
    );

  if (!codeRecord) {
    throw new AppError(
      "This referral code does not exist.",
      400,
      "INVALID_REFERRAL_CODE"
    );
  }

  if (
    codeRecord.userId === refereeUserId
  ) {
    throw new AppError(
      "You cannot use your own referral code.",
      400,
      "SELF_REFERRAL"
    );
  }

  const existing =
    await repository.getReferralByReferee(
      refereeUserId
    );

  if (existing) {
    // Idempotent: attributing twice is a no-op, not an error.
    return existing;
  }

  // Already a paying customer? They were not acquired by
  // this referral — it can never qualify.
  const [hasSub, payments] =
    await Promise.all([
      repository.hasActiveSubscription(
        refereeUserId
      ),
      repository.countCapturedPayments(
        refereeUserId
      ),
    ]);

  if (hasSub || payments > 0) {
    throw new AppError(
      "Referral rewards apply to new customers only.",
      400,
      "REFERRAL_NOT_ELIGIBLE"
    );
  }

  return repository.createReferral({
    codeId: codeRecord.id,
    referrerUserId: codeRecord.userId,
    refereeUserId,
  });
}

export async function getReferralStats(
  userId: string
) {
  const [
    codeRecord,
    pending,
    qualified,
    rewarded,
    rejected,
    earnedDays,
    proUntil,
  ] = await Promise.all([
    repository.getReferralCodeByUserId(
      userId
    ),
    repository.countReferralsByStatus(
      userId,
      "PENDING"
    ),
    repository.countReferralsByStatus(
      userId,
      "QUALIFIED"
    ),
    repository.countReferralsByStatus(
      userId,
      "REWARDED"
    ),
    repository.countReferralsByStatus(
      userId,
      "REJECTED"
    ),
    repository.sumEarnedDays(userId),
    repository.getUserProUntil(userId),
  ]);

  return {
    code: codeRecord?.code ?? null,
    counts: {
      pending,
      qualified,
      rewarded,
      rejected,
    },
    earnedDays,
    proUntil,
    rewardDays: REFERRAL_REWARD_DAYS,
    refereeBonusDays: REFEREE_BONUS_DAYS,
    maxRewardsPerYear:
      MAX_REWARDS_PER_YEAR,
  };
}

/*
 * Called from the billing webhook after a CAPTURED payment
 * is recorded. This is the ONLY path that pays a reward.
 */
export async function onCapturedPayment(
  refereeUserId: string
): Promise<void> {
  const referral =
    await repository.getReferralByReferee(
      refereeUserId
    );

  if (
    !referral ||
    referral.status !== "PENDING"
  ) {
    return;
  }

  // Rule 5: only the FIRST captured payment qualifies.
  // Anyone who paid before attributing never qualifies.
  const capturedCount =
    await repository.countCapturedPayments(
      refereeUserId
    );

  if (capturedCount !== 1) {
    return;
  }

  const now = new Date();

  // Rule 6: same verified phone on both sides = farming.
  const [referrerPhone, refereePhone] =
    await Promise.all([
      repository.getVerifiedPhone(
        referral.referrerUserId
      ),
      repository.getVerifiedPhone(
        refereeUserId
      ),
    ]);

  if (
    referrerPhone &&
    refereePhone &&
    referrerPhone === refereePhone
  ) {
    await repository.updateReferral(
      referral.id,
      {
        status: "REJECTED",
        note: "SAME_PHONE",
      }
    );
    return;
  }

  // Rule 7: yearly cap.
  const yearAgo = new Date(
    now.getTime() - 365 * 24 * 60 * 60 * 1000
  );

  const rewardedThisYear =
    await repository.countRewardedSince(
      referral.referrerUserId,
      yearAgo
    );

  if (
    rewardedThisYear >= MAX_REWARDS_PER_YEAR
  ) {
    await repository.updateReferral(
      referral.id,
      {
        status: "REJECTED",
        note: "YEARLY_CAP_REACHED",
      }
    );
    return;
  }

  // Rules 8 + 9: ONE atomic transaction claims the referral
  // and grants BOTH sides — 30d to the referrer, 45d bonus to
  // the paying referee. Returns false when another worker
  // already claimed it (webhook retried mid-flight): then
  // there is nothing left to do.
  await repository.grantReferralRewards(
    referral.referrerUserId,
    refereeUserId,
    referral.id,
    REFERRAL_REWARD_DAYS,
    REFEREE_BONUS_DAYS
  );
}
