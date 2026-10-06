import { prisma } from "../../config/prisma";

/*
 * ============================================================
 * ADMIN REPOSITORY
 * ============================================================
 */

export class AdminRepository {
  /* ---------------- OVERVIEW ---------------- */

  async overviewCounts() {
    const [
      users,
      proUsers,
      businesses,
      activeTrials,
      activeSubscriptions,
      payments,
      scansToday,
      openTickets,
      openReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          proUntil: { gt: new Date() },
        },
      }),
      prisma.business.count(),
      prisma.trial.count({
        where: { status: "ACTIVE" },
      }),
      prisma.subscription.count({
        where: { status: "ACTIVE" },
      }),
      prisma.payment.aggregate({
        where: { status: "captured" },
        _sum: { amountPaise: true },
        _count: true,
      }),
      prisma.scanEvent.count({
        where: {
          scannedAt: {
            gte: new Date(
              new Date().setHours(
                0,
                0,
                0,
                0
              )
            ),
          },
        },
      }),
      prisma.supportTicket.count({
        where: { status: "OPEN" },
      }),
      prisma.reviewReport.count({
        // A report is "open" while the reported review
        // has not been moderated yet. ReviewReport has no
        // status column in the schema, so we track openness
        // on the review itself via moderatedAt.
        where: {
          review: { moderatedAt: null },
        },
      }),
    ]);

    return {
      users,
      proUsers,
      businesses,
      activeTrials,
      activeSubscriptions,
      revenuePaise:
        payments._sum.amountPaise ?? 0,
      paymentCount: payments._count,
      scansToday,
      openTickets,
      openReports,
    };
  }

  async signupsLast30Days() {
    const rows =
      await prisma.$queryRaw<
        Array<{
          day: string;
          count: bigint;
        }>
      >`
        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') AS day,
               COUNT(*) AS count
        FROM "User"
        WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day ASC
      `;

    return rows.map((r) => ({
      day: r.day,
      count: Number(r.count),
    }));
  }

  /* ---------------- USERS ---------------- */

  async listUsers(query: {
    search?: string;
    page: number;
    limit: number;
  }) {
    const where = query.search
      ? {
          OR: [
            {
              fullName: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
            {
              email: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
            {
              phone: {
                contains: query.search,
              },
            },
          ],
        }
      : {};

    const [total, users] =
      await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip:
            (query.page - 1) *
            query.limit,
          take: query.limit,
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            proUntil: true,
            createdAt: true,
            _count: {
              select: {
                businesses: true,
              },
            },
          },
        }),
      ]);

    return { total, users };
  }

  async getUserDetail(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        language: true,
        timezone: true,
        proUntil: true,
        createdAt: true,
        businesses: {
          select: {
            id: true,
            name: true,
          },
        },
        trial: {
          select: {
            status: true,
            endsAt: true,
          },
        },
        subscriptions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
          select: {
            id: true,
            planCode: true,
            status: true,
            currentPeriodEnd: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          select: {
            id: true,
            amountPaise: true,
            status: true,
            createdAt: true,
          },
        },
        proCredits: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          select: {
            days: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async setUserActive(
    userId: string,
    isActive: boolean
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        isActive: true,
      },
    });
  }

  async grantPro(
    userId: string,
    days: number,
    reason: string
  ) {
    const user =
      await prisma.user.findUnique({
        where: { id: userId },
        select: { proUntil: true },
      });

    if (!user) return null;

    const base =
      user.proUntil &&
      user.proUntil > new Date()
        ? user.proUntil
        : new Date();

    const proUntil = new Date(
      base.getTime() +
        days * 24 * 60 * 60 * 1000
    );

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { proUntil },
      }),
      prisma.proCredit.create({
        data: {
          userId,
          days,
          reason,
        },
      }),
    ]);

    return { proUntil };
  }

  /* ---------------- BUSINESSES ---------------- */

  async listBusinesses(query: {
    search?: string;
    page: number;
    limit: number;
  }) {
    const where = query.search
      ? {
          name: {
            contains: query.search,
            mode: "insensitive" as const,
          },
        }
      : {};

    const [total, businesses] =
      await Promise.all([
        prisma.business.count({ where }),
        prisma.business.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip:
            (query.page - 1) *
            query.limit,
          take: query.limit,
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            owner: {
              select: {
                fullName: true,
                email: true,
              },
            },
            _count: {
              select: { qrCodes: true },
            },
          },
        }),
      ]);

    return { total, businesses };
  }

  /* ---------------- MONEY ---------------- */

  async listSubscriptions(query: {
    page: number;
    limit: number;
    status?: string;
  }) {
    const where = query.status
      ? { status: query.status as never }
      : {};

    const [total, subscriptions] =
      await Promise.all([
        prisma.subscription.count({
          where,
        }),
        prisma.subscription.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip:
            (query.page - 1) *
            query.limit,
          take: query.limit,
          select: {
            id: true,
            planCode: true,
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            createdAt: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        }),
      ]);

    return { total, subscriptions };
  }

  async listPayments(query: {
    page: number;
    limit: number;
  }) {
    const [total, payments] =
      await Promise.all([
        prisma.payment.count(),
        prisma.payment.findMany({
          orderBy: { createdAt: "desc" },
          skip:
            (query.page - 1) *
            query.limit,
          take: query.limit,
          select: {
            id: true,
            amountPaise: true,
            currency: true,
            createdAt: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        }),
      ]);

    return { total, payments };
  }

  async revenueByMonth() {
    const rows =
      await prisma.$queryRaw<
        Array<{
          month: string;
          total: bigint;
        }>
      >`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month,
               SUM("amountPaise") AS total
        FROM "Payment"
        WHERE status = 'captured'
          AND "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month ASC
      `;

    return rows.map((r) => ({
      month: r.month,
      totalPaise: Number(r.total ?? 0),
    }));
  }

  /* ---------------- TRIALS & REFERRALS ---------------- */

  async listTrials(query: {
    page: number;
    limit: number;
    status?: string;
  }) {
    const where = query.status
      ? { status: query.status as never }
      : {};

    const [total, trials] =
      await Promise.all([
        prisma.trial.count({ where }),
        prisma.trial.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip:
            (query.page - 1) *
            query.limit,
          take: query.limit,
          select: {
            id: true,
            status: true,
            startsAt: true,
            endsAt: true,
            phone: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        }),
      ]);

    return { total, trials };
  }

  async extendTrial(
    userId: string,
    days: number
  ) {
    const trial =
      await prisma.trial.findUnique({
        where: { userId },
      });

    if (!trial) return null;

    const endsAt = new Date(
      trial.endsAt.getTime() +
        days * 24 * 60 * 60 * 1000
    );

    return prisma.trial.update({
      where: { userId },
      data: { endsAt },
      select: { endsAt: true },
    });
  }

  async listReferrals(query: {
    page: number;
    limit: number;
  }) {
    const [total, referrals] =
      await Promise.all([
        prisma.referral.count(),
        prisma.referral.findMany({
          orderBy: { createdAt: "desc" },
          skip:
            (query.page - 1) *
            query.limit,
          take: query.limit,
          select: {
            id: true,
            status: true,
            createdAt: true,
            referrer: {
              select: {
                fullName: true,
                email: true,
              },
            },
            referee: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        }),
      ]);

    return { total, referrals };
  }

  async duplicatePhoneTrials() {
    const rows =
      await prisma.$queryRaw<
        Array<{
          phone: string;
          count: bigint;
        }>
      >`
        SELECT phone, COUNT(*) AS count
        FROM "Trial"
        WHERE phone IS NOT NULL
        GROUP BY phone
        HAVING COUNT(*) > 1
        ORDER BY count DESC
        LIMIT 50
      `;

    return rows.map((r) => ({
      phone: r.phone,
      count: Number(r.count),
    }));
  }

  /* ---------------- MODERATION ---------------- */

  async listReviewReports(query: {
    page: number;
    limit: number;
  }) {
    const [total, reports] =
      await Promise.all([
        prisma.reviewReport.count({
          where: {
            review: { moderatedAt: null },
          },
        }),
        prisma.reviewReport.findMany({
          where: {
            review: { moderatedAt: null },
          },
          orderBy: { createdAt: "desc" },
          skip:
            (query.page - 1) *
            query.limit,
          take: query.limit,
          include: {
            review: {
              select: {
                id: true,
                rating: true,
                title: true,
                comment: true,
                reviewerName: true,
                status: true,
                business: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        }),
      ]);

    return { total, reports };
  }

  async resolveReport(
    reportId: string,
    action: "dismiss" | "remove_review"
  ) {
    const report =
      await prisma.reviewReport.findUnique({
        where: { id: reportId },
        select: {
          id: true,
          reviewId: true,
        },
      });

    if (!report) return null;

    // ReviewReport has no status column in the schema, so we
    // track moderation on the review itself: moderatedAt /
    // moderationNote / status. The report row is kept as a
    // record but drops out of the open queue.
    if (action === "dismiss") {
      await prisma.review.update({
        where: { id: report.reviewId },
        data: {
          moderatedAt: new Date(),
          moderationNote:
            "Report dismissed by admin — review kept.",
        },
      });
    } else {
      // Non-destructive: hide instead of delete so the action
      // is reversible from the database.
      await prisma.review.update({
        where: { id: report.reviewId },
        data: {
          status: "HIDDEN",
          moderatedAt: new Date(),
          moderationNote:
            "Review hidden by admin (report upheld).",
        },
      });
    }

    return { ok: true };
  }

  /* ---------------- PLANS & FLAGS ---------------- */

  async listPlans() {
    return prisma.plan.findMany({
      orderBy: { pricePaise: "asc" },
    });
  }

  async updatePlan(
    code: string,
    data: {
      name?: string;
      pricePaise?: number;
      maxQrs?: number;
      maxBusinesses?: number;
      maxSeats?: number;
      features?: string[];
      isActive?: boolean;
    }
  ) {
    return prisma.plan.update({
      where: { code },
      data,
    });
  }

  async listFlags() {
    return prisma.featureFlag.findMany({
      orderBy: { key: "asc" },
    });
  }

  async upsertFlag(
    key: string,
    enabled: boolean,
    description?: string
  ) {
    return prisma.featureFlag.upsert({
      where: { key },
      create: {
        key,
        enabled,
        description,
      },
      update: {
        enabled,
        ...(description !== undefined
          ? { description }
          : {}),
      },
    });
  }

  /* ---------------- SUPPORT ---------------- */

  async listTickets(query: {
    page: number;
    limit: number;
    status?: string;
  }) {
    const where = query.status
      ? { status: query.status }
      : {};

    const [total, tickets] =
      await Promise.all([
        prisma.supportTicket.count({
          where,
        }),
        prisma.supportTicket.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip:
            (query.page - 1) *
            query.limit,
          take: query.limit,
          select: {
            id: true,
            subject: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        }),
      ]);

    return { total, tickets };
  }

  async getTicket(ticketId: string) {
    return prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async replyTicket(
    ticketId: string,
    reply: string,
    adminUserId: string,
    close: boolean
  ) {
    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        adminReply: reply,
        repliedAt: new Date(),
        repliedById: adminUserId,
        status: close
          ? "CLOSED"
          : "ANSWERED",
      },
    });
  }

  async createTicket(
    userId: string,
    subject: string,
    message: string
  ) {
    return prisma.supportTicket.create({
      data: {
        userId,
        subject,
        message,
      },
      select: { id: true },
    });
  }

  /* ---------------- BROADCAST SEGMENTS ---------------- */

  async segmentPhones(
    segment: "all" | "pro" | "trial" | "free"
  ): Promise<string[]> {
    const now = new Date();

    const where =
      segment === "pro"
        ? {
            proUntil: { gt: now },
            phone: { not: null },
          }
        : segment === "trial"
          ? {
              trial: {
                status: "ACTIVE" as never,
              },
              phone: { not: null },
            }
          : segment === "free"
            ? {
                OR: [
                  {
                    proUntil: null,
                  },
                  {
                    proUntil: { lte: now },
                  },
                ],
                phone: { not: null },
              }
            : {
                phone: { not: null },
              };

    const users =
      await prisma.user.findMany({
        where: where as never,
        select: { phone: true },
        take: 5000,
      });

    return users
      .map((u) => u.phone)
      .filter(
        (p): p is string => !!p
      );
  }

  async segmentEmails(
    segment: "all" | "pro" | "trial" | "free"
  ): Promise<string[]> {
    const now = new Date();

    const where =
      segment === "pro"
        ? {
            proUntil: { gt: now },
            email: { not: null },
          }
        : segment === "trial"
          ? {
              trial: {
                status: "ACTIVE" as never,
              },
              email: { not: null },
            }
          : segment === "free"
            ? {
                OR: [
                  {
                    proUntil: null,
                  },
                  {
                    proUntil: { lte: now },
                  },
                ],
                email: { not: null },
              }
            : {
                email: { not: null },
              };

    const users =
      await prisma.user.findMany({
        where: where as never,
        select: { email: true },
        take: 5000,
      });

    return users
      .map((u) => u.email)
      .filter(
        (e): e is string => !!e
      );
  }

  /* ---------------- AUDIT ---------------- */

  async logAction(data: {
    adminUserId: string;
    adminEmail: string;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: object;
  }) {
    return prisma.adminAuditLog.create({
      data: {
        adminUserId: data.adminUserId,
        adminEmail: data.adminEmail,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        details:
          data.details as never,
      },
    });
  }

  async listAuditLog(query: {
    page: number;
    limit: number;
  }) {
    const [total, entries] =
      await Promise.all([
        prisma.adminAuditLog.count(),
        prisma.adminAuditLog.findMany({
          orderBy: { createdAt: "desc" },
          skip:
            (query.page - 1) *
            query.limit,
          take: query.limit,
        }),
      ]);

    return { total, entries };
  }
}
