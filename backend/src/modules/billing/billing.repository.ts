import { prisma } from "../../config/prisma";

/*
 * ============================================================
 * BILLING REPOSITORY
 * ============================================================
 */

export class BillingRepository {
  async getPlan(code: string) {
    return prisma.plan.findUnique({
      where: { code },
    });
  }

  async getActiveSubscription(
    userId: string
  ) {
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getLatestSubscription(
    userId: string
  ) {
    return prisma.subscription.findFirst({
      where: { userId },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findSubscriptionByRazorpayId(
    razorpaySubscriptionId: string
  ) {
    return prisma.subscription.findUnique({
      where: { razorpaySubscriptionId },
      include: {
        plan: true,
      },
    });
  }

  async createSubscription(data: {
    userId: string;
    planCode: string;
    razorpaySubscriptionId: string;
    razorpayCustomerId?: string | null;
  }) {
    return prisma.subscription.create({
      data: {
        userId: data.userId,
        planCode: data.planCode,
        status: "PENDING",
        razorpaySubscriptionId:
          data.razorpaySubscriptionId,
        razorpayCustomerId:
          data.razorpayCustomerId ?? null,
      },
    });
  }

  async updateSubscriptionStatus(
    id: string,
    data: {
      status?:
        | "ACTIVE"
        | "PAST_DUE"
        | "HALTED"
        | "CANCELLED"
        | "EXPIRED";
      planCode?: string;
      currentPeriodStart?: Date | null;
      currentPeriodEnd?: Date | null;
      cancelAtPeriodEnd?: boolean;
    }
  ) {
    return prisma.subscription.update({
      where: { id },
      data: {
        ...(data.status !==
          undefined && {
          status: data.status,
        }),
        ...(data.planCode !==
          undefined && {
          planCode: data.planCode,
        }),
        ...(data.currentPeriodStart !==
          undefined && {
          currentPeriodStart:
            data.currentPeriodStart,
        }),
        ...(data.currentPeriodEnd !==
          undefined && {
          currentPeriodEnd:
            data.currentPeriodEnd,
        }),
        ...(data.cancelAtPeriodEnd !==
          undefined && {
          cancelAtPeriodEnd:
            data.cancelAtPeriodEnd,
        }),
      },
    });
  }

  async recordPayment(data: {
    userId: string;
    subscriptionId?: string | null;
    razorpayPaymentId?: string | null;
    razorpayOrderId?: string | null;
    amountPaise: number;
    currency?: string;
    status: string;
  }) {
    return prisma.payment.upsert({
      where: {
        razorpayPaymentId:
          data.razorpayPaymentId ?? "",
      },
      update: {
        status: data.status,
      },
      create: {
        userId: data.userId,
        subscriptionId:
          data.subscriptionId ?? null,
        razorpayPaymentId:
          data.razorpayPaymentId ?? null,
        razorpayOrderId:
          data.razorpayOrderId ?? null,
        amountPaise: data.amountPaise,
        currency: data.currency ?? "INR",
        status: data.status,
      },
    });
  }

  async getPayments(
    userId: string,
    limit = 20
  ) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getUserProUntil(
    userId: string
  ): Promise<Date | null> {
    const user = await prisma.user.findUnique(
      {
        where: { id: userId },
        select: { proUntil: true },
      }
    );

    return user?.proUntil ?? null;
  }

  async countQRCodes(userId: string) {
    return prisma.qRCode.count({
      where: {
        business: {
          ownerId: userId,
        },
        deletedAt: null,
      },
    });
  }

  async countBusinesses(userId: string) {
    return prisma.business.count({
      where: {
        ownerId: userId,
        deletedAt: null,
      },
    });
  }
}
