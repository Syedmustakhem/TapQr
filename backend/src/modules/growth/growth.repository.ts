import { prisma } from "../../config/prisma";

/*
 * ============================================================
 * GROWTH REPOSITORY  (trial + referral)
 * ============================================================
 *
 * Thin Prisma wrappers. All anti-abuse RULES live in the
 * services — this file only reads and writes.
 */

export class GrowthRepository {
  /*
   * The user's OTP-verified phone number, or null.
   * A phone counts as verified only when an AuthProvider row
   * with provider=PHONE and isVerified=true exists.
   * Never trust User.phone alone — it may be unverified.
   */
  async getVerifiedPhone(
    userId: string
  ): Promise<string | null> {
    const user =
      await prisma.user.findUnique({
        where: { id: userId },
        select: {
          phone: true,
          authProviders: {
            where: {
              provider: "PHONE",
              isVerified: true,
            },
            select: { id: true },
            take: 1,
          },
        },
      });

    if (
      !user?.phone ||
      user.authProviders.length === 0
    ) {
      return null;
    }

    return user.phone;
  }

  async hasActiveSubscription(
    userId: string
  ): Promise<boolean> {
    const sub =
      await prisma.subscription.findFirst({
        where: {
          userId,
          status: "ACTIVE",
        },
        select: { id: true },
      });

    return sub !== null;
  }

  async countCapturedPayments(
    userId: string
  ): Promise<number> {
    return prisma.payment.count({
      where: {
        userId,
        status: "captured",
      },
    });
  }

  async getUserProUntil(
    userId: string
  ): Promise<Date | null> {
    const user =
      await prisma.user.findUnique({
        where: { id: userId },
        select: { proUntil: true },
      });

    return user?.proUntil ?? null;
  }

  /* ---------------- Trial ---------------- */

  async getTrialByUserId(userId: string) {
    return prisma.trial.findUnique({
      where: { userId },
    });
  }

  async getTrialByPhone(phone: string) {
    return prisma.trial.findFirst({
      where: { phone },
      orderBy: { createdAt: "asc" },
    });
  }

  async createTrial(data: {
    userId: string;
    phone: string;
    endsAt: Date;
  }) {
    return prisma.trial.create({
      data: {
        userId: data.userId,
        phone: data.phone,
        endsAt: data.endsAt,
        status: "ACTIVE",
      },
    });
  }

  async updateTrial(
    id: string,
    data: {
      status?:
        | "ACTIVE"
        | "EXPIRED"
        | "CONVERTED";
      convertedAt?: Date | null;
    }
  ) {
    return prisma.trial.update({
      where: { id },
      data,
    });
  }

  /* ---------------- Referral codes ---------------- */

  async getReferralCodeByUserId(
    userId: string
  ) {
    return prisma.referralCode.findUnique({
      where: { userId },
    });
  }

  async getReferralCodeByCode(
    code: string
  ) {
    return prisma.referralCode.findUnique({
      where: { code },
    });
  }

  async createReferralCode(
    userId: string,
    code: string
  ) {
    return prisma.referralCode.create({
      data: { userId, code },
    });
  }

  /* ---------------- Referrals ---------------- */

  async getReferralByReferee(
    refereeUserId: string
  ) {
    return prisma.referral.findUnique({
      where: { refereeUserId },
    });
  }

  async createReferral(data: {
    codeId: string;
    referrerUserId: string;
    refereeUserId: string;
  }) {
    return prisma.referral.create({
      data: {
        codeId: data.codeId,
        referrerUserId:
          data.referrerUserId,
        refereeUserId: data.refereeUserId,
        status: "PENDING",
      },
    });
  }

  async updateReferral(
    id: string,
    data: {
      status:
        | "PENDING"
        | "QUALIFIED"
        | "REWARDED"
        | "REJECTED";
      note?: string | null;
      qualifiedAt?: Date | null;
      rewardedAt?: Date | null;
    }
  ) {
    return prisma.referral.update({
      where: { id },
      data,
    });
  }

  async countReferralsByStatus(
    referrerUserId: string,
    status:
      | "PENDING"
      | "QUALIFIED"
      | "REWARDED"
      | "REJECTED"
  ): Promise<number> {
    return prisma.referral.count({
      where: { referrerUserId, status },
    });
  }

  async countRewardedSince(
    referrerUserId: string,
    since: Date
  ): Promise<number> {
    return prisma.referral.count({
      where: {
        referrerUserId,
        status: "REWARDED",
        rewardedAt: { gte: since },
      },
    });
  }

  async sumEarnedDays(
    userId: string
  ): Promise<number> {
    const result =
      await prisma.proCredit.aggregate({
        where: {
          userId,
          reason: "REFERRAL_REWARD",
        },
        _sum: { days: true },
      });

    return result._sum.days ?? 0;
  }

  /*
   * Grant Pro days, idempotently.
   *
   * The ProCredit row is the audit ledger; referralId is
   * UNIQUE so a retried webhook can never double-grant.
   * proUntil becomes max(now, proUntil) + days — credits
   * stack AFTER any existing Pro time instead of
   * overwriting it.
   */
  async grantProDays(
    userId: string,
    days: number,
    reason: string,
    referralId?: string | null
  ): Promise<Date> {
    return prisma.$transaction(
      async (tx) => {
        await tx.proCredit.create({
          data: {
            userId,
            days,
            reason,
            referralId: referralId ?? null,
          },
        });

        const user =
          await tx.user.findUnique({
            where: { id: userId },
            select: { proUntil: true },
          });

        const now = new Date();
        const base =
          user?.proUntil &&
          user.proUntil.getTime() >
            now.getTime()
            ? user.proUntil
            : now;

        const next = new Date(
          base.getTime() +
            days * 24 * 60 * 60 * 1000
        );

        await tx.user.update({
          where: { id: userId },
          data: { proUntil: next },
        });

        return next;
      }
    );
  }

  /*
   * Double-sided referral payout, in ONE atomic transaction.
   *
   *  1. Claims the referral with an atomic PENDING -> REWARDED
   *     transition. Returns false when another worker already
   *     claimed it (webhook retried mid-flight) — the caller
   *     then does nothing. Exactly one payout per referral,
   *     ever. No intermediate state, no double-grant.
   *  2. Grants referrerDays to the referrer (reason
   *     REFERRAL_REWARD, referralId set as the ledger anchor)
   *     and refereeDays to the referee (reason
   *     REFEREE_BONUS).
   *  3. Both credits stack AFTER existing Pro time
   *     (max(now, proUntil) + days) — never overwriting or
   *     shortening paid time.
   */
  async grantReferralRewards(
    referrerUserId: string,
    refereeUserId: string,
    referralId: string,
    referrerDays: number,
    refereeDays: number
  ): Promise<boolean> {
    const now = new Date();

    return prisma.$transaction(
      async (tx) => {
        const claimed =
          await tx.referral.updateMany({
            where: {
              id: referralId,
              status: "PENDING",
            },
            data: {
              status: "REWARDED",
              qualifiedAt: now,
              rewardedAt: now,
            },
          });

        if (claimed.count === 0) {
          return false;
        }

        const grants = [
          {
            userId: referrerUserId,
            days: referrerDays,
            reason: "REFERRAL_REWARD",
            refId: referralId as
              | string
              | null,
          },
          {
            userId: refereeUserId,
            days: refereeDays,
            reason: "REFEREE_BONUS",
            refId: null as
              | string
              | null,
          },
        ];

        for (const grant of grants) {
          await tx.proCredit.create({
            data: {
              userId: grant.userId,
              days: grant.days,
              reason: grant.reason,
              referralId: grant.refId,
            },
          });

          const user =
            await tx.user.findUnique({
              where: {
                id: grant.userId,
              },
              select: {
                proUntil: true,
              },
            });

          const base =
            user?.proUntil &&
            user.proUntil.getTime() >
              now.getTime()
              ? user.proUntil
              : now;

          await tx.user.update({
            where: {
              id: grant.userId,
            },
            data: {
              proUntil: new Date(
                base.getTime() +
                  grant.days *
                    24 *
                    60 *
                    60 *
                    1000
              ),
            },
          });
        }

        return true;
      }
    );
  }
}
