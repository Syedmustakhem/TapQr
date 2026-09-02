import { Prisma, ReviewStatus } from "@prisma/client";
import { prisma } from "../../../config/prisma";

const publicReviewSelect = {
  id: true,
  businessId: true,
  qrCodeId: true,
  userId: true,
  reviewerName: true,
  rating: true,
  title: true,
  comment: true,
  status: true,
  isVerified: true,
  verifiedAt: true,
  ownerResponse: true,
  respondedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ReviewSelect;

export class ReviewsRepository {
  async findBusiness(businessId: string) {
    return prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true, ownerId: true, name: true, status: true, deletedAt: true,
        profile: { select: { externalReviewUrl: true } },
      },
    });
  }

  async findQRCode(qrCodeId: string, businessId: string) {
    return prisma.qRCode.findFirst({
      where: { id: qrCodeId, businessId, deletedAt: null },
      select: { id: true, businessId: true, status: true, shortCode: true },
    });
  }

  async findScanEventForVerification(
    scanEventId: string,
    qrCodeId: string,
    businessId: string
  ) {
    const scan = await prisma.scanEvent.findFirst({
      where: {
        id: scanEventId,
        qrCodeId,
      },
      select: {
        id: true,
        qrCodeId: true,
        scannedAt: true,
      },
    });

    if (!scan) return null;

    const qr = await this.findQRCode(qrCodeId, businessId);

    if (!qr) return null;

    return {
      ...scan,
      qrCode: qr,
    };
  }

  async findMemberRole(userId: string, businessId: string) {
    return prisma.businessMember.findUnique({
      where: { userId_businessId: { userId, businessId } },
      select: { userId: true, businessId: true, role: true, status: true },
    });
  }

  async findUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, isActive: true },
    });
  }

  async findExistingUserReview(businessId: string, userId: string) {
    return prisma.review.findFirst({
      where: {
        businessId,
        userId,
        status: { in: [ReviewStatus.PENDING, ReviewStatus.PUBLISHED] },
      },
      select: { id: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    businessId: string;
    qrCodeId?: string | null;
    userId?: string | null;
    reviewerName?: string | null;
    reviewerEmail?: string | null;
    rating: number;
    title?: string | null;
    comment?: string | null;
    isVerified: boolean;
    verifiedAt?: Date | null;
  }) {
    return prisma.review.create({
      data,
      select: { ...publicReviewSelect, reviewerEmail: true, moderationNote: true },
    });
  }

  async findPublishedByBusiness(businessId: string, page: number, limit: number) {
    const where: Prisma.ReviewWhereInput = {
      businessId,
      status: ReviewStatus.PUBLISHED,
    };
    const skip = (page - 1) * limit;

    const [reviews, total] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        select: publicReviewSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findManagedByBusiness(
    businessId: string,
    options: {
      page: number;
      limit: number;
      status?: ReviewStatus;
      rating?: number;
      verified?: boolean;
      search?: string;
    }
  ) {
    const where: Prisma.ReviewWhereInput = {
      businessId,
      ...(options.status ? { status: options.status } : {}),
      ...(options.rating ? { rating: options.rating } : {}),
      ...(options.verified !== undefined ? { isVerified: options.verified } : {}),
      ...(options.search
        ? {
            OR: [
              { reviewerName: { contains: options.search, mode: "insensitive" } },
              { title: { contains: options.search, mode: "insensitive" } },
              { comment: { contains: options.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const skip = (options.page - 1) * options.limit;

    const [reviews, total] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        select: { ...publicReviewSelect, reviewerEmail: true, moderationNote: true },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: options.limit,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async findById(id: string) {
    return prisma.review.findUnique({
      where: { id },
      select: {
        ...publicReviewSelect,
        reviewerEmail: true,
        moderationNote: true,
        business: {
          select: {
            id: true, ownerId: true, name: true, status: true, deletedAt: true,
            profile: { select: { externalReviewUrl: true } },
          },
        },
      },
    });
  }

  async updateStatus(
    id: string,
    data: { status: ReviewStatus; moderationNote?: string | null }
  ) {
    return prisma.review.update({
      where: { id },
      data: {
        status: data.status,
        moderationNote: data.moderationNote ?? null,
        moderatedAt: new Date(),
      },
      select: { ...publicReviewSelect, reviewerEmail: true, moderationNote: true },
    });
  }

  async updateResponse(id: string, response: string) {
    return prisma.review.update({
      where: { id },
      data: { ownerResponse: response.trim(), respondedAt: new Date() },
      select: { ...publicReviewSelect, reviewerEmail: true, moderationNote: true },
    });
  }

  async createReport(data: {
    reviewId: string;
    businessId: string;
    userId?: string | null;
    reason: string;
    details?: string | null;
  }) {
    return prisma.reviewReport.create({
      data,
      select: {
        id: true, reviewId: true, businessId: true, userId: true,
        reason: true, details: true, createdAt: true,
      },
    });
  }

  async hasUserReported(reviewId: string, userId: string) {
    return prisma.reviewReport.findFirst({
      where: { reviewId, userId },
      select: { id: true },
    });
  }

  async getSummary(businessId: string) {
    const [aggregate, distribution, verifiedReviews] =
      await Promise.all([
        prisma.review.aggregate({
          where: { businessId, status: ReviewStatus.PUBLISHED },
          _avg: { rating: true },
          _count: { _all: true },
        }),
        prisma.review.groupBy({
          by: ["rating"],
          where: { businessId, status: ReviewStatus.PUBLISHED },
          _count: { _all: true },
          orderBy: { rating: "desc" },
        }),
        prisma.review.count({
          where: {
            businessId,
            status: ReviewStatus.PUBLISHED,
            isVerified: true,
          },
        }),
      ]);

    return {
      averageRating: aggregate._avg.rating ?? 0,
      totalReviews: aggregate._count._all,
      verifiedReviews,
      distribution: [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count:
          distribution.find((row) => row.rating === rating)?._count._all ?? 0,
      })),
    };
  }

  async getExternalReviewUrl(businessId: string) {
    const business = await this.findBusiness(businessId);
    return business?.profile?.externalReviewUrl ?? null;
  }
}
