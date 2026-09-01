import {
  BusinessMemberRole,
  BusinessMemberStatus,
  ReviewStatus,
} from "@prisma/client";
import { AppError } from "../../../cores/errors/AppError";
import { ReviewsRepository } from "../repositories/reviews.repository";
import {
  CreateReviewInput,
  ReportReviewInput,
  ReviewListQuery,
  ReviewResponseInput,
  ReviewStatusInput,
} from "../types/reviews.types";

export class ReviewsService {
  private readonly repository = new ReviewsRepository();

  private async getActiveBusiness(businessId: string) {
    const business = await this.repository.findBusiness(businessId);
    if (!business || business.deletedAt) {
      throw new AppError("Business not found.", 404, "BUSINESS_NOT_FOUND");
    }
    if (business.status !== "ACTIVE") {
      throw new AppError("This business is not active.", 403, "BUSINESS_NOT_ACTIVE");
    }
    return business;
  }

  private async assertManagerOrOwner(actorId: string, businessId: string) {
    const business = await this.getActiveBusiness(businessId);
    if (business.ownerId === actorId) return business;

    const membership = await this.repository.findMemberRole(actorId, businessId);
    if (!membership || membership.status !== BusinessMemberStatus.ACTIVE) {
      throw new AppError("You do not have access to this business.", 403, "BUSINESS_ACCESS_DENIED");
    }
    if (
      membership.role !== BusinessMemberRole.OWNER &&
      membership.role !== BusinessMemberRole.MANAGER
    ) {
      throw new AppError("You do not have permission to manage reviews.", 403, "REVIEW_MANAGEMENT_FORBIDDEN");
    }
    return business;
  }

  async createReview(data: CreateReviewInput) {
    await this.getActiveBusiness(data.businessId);

    if (data.userId) {
      const user = await this.repository.findUser(data.userId);
      if (!user || !user.isActive) {
        throw new AppError("User account is not available.", 404, "USER_NOT_FOUND");
      }
      const existing = await this.repository.findExistingUserReview(data.businessId, data.userId);
      if (existing) {
        throw new AppError("You have already submitted a review for this business.", 409, "REVIEW_ALREADY_EXISTS");
      }
    }

    if (data.qrCodeId) {
      const qr = await this.repository.findQRCode(data.qrCodeId, data.businessId);
      if (!qr) throw new AppError("QR Code not found for this business.", 404, "QR_NOT_FOUND");
    }

    const review = await this.repository.create({
      businessId: data.businessId,
      qrCodeId: data.qrCodeId ?? null,
      userId: data.userId ?? null,
      reviewerName: data.reviewerName ?? null,
      reviewerEmail: data.reviewerEmail ?? null,
      rating: data.rating,
      title: data.title ?? null,
      comment: data.comment ?? null,
    });

    return {
      review,
      moderation: { status: ReviewStatus.PENDING, verified: false },
    };
  }

  async listPublicReviews(businessId: string, page: number, limit: number) {
    await this.getActiveBusiness(businessId);
    return this.repository.findPublishedByBusiness(businessId, page, limit);
  }

  async getPublicSummary(businessId: string) {
    await this.getActiveBusiness(businessId);
    return this.repository.getSummary(businessId);
  }

  async getExternalReviewUrl(businessId: string) {
    await this.getActiveBusiness(businessId);
    return this.repository.getExternalReviewUrl(businessId);
  }

  async listManagedReviews(actorId: string, businessId: string, query: ReviewListQuery) {
    await this.assertManagerOrOwner(actorId, businessId);
    return this.repository.findManagedByBusiness(businessId, query);
  }

  async updateStatus(data: ReviewStatusInput) {
    const review = await this.repository.findById(data.reviewId);
    if (!review || review.business.deletedAt) {
      throw new AppError("Review not found.", 404, "REVIEW_NOT_FOUND");
    }
    await this.assertManagerOrOwner(data.actorId, review.businessId);

    if (review.status === ReviewStatus.REJECTED && data.status === ReviewStatus.PUBLISHED) {
      throw new AppError(
        "Rejected reviews must return to PENDING before publication.",
        409,
        "REVIEW_MODERATION_STATE_INVALID"
      );
    }
    return this.repository.updateStatus(data.reviewId, {
      status: data.status,
      moderationNote: data.moderationNote ?? null,
    });
  }

  async respondToReview(data: ReviewResponseInput) {
    const review = await this.repository.findById(data.reviewId);
    if (!review || review.business.deletedAt) {
      throw new AppError("Review not found.", 404, "REVIEW_NOT_FOUND");
    }
    await this.assertManagerOrOwner(data.actorId, review.businessId);
    if (review.status !== ReviewStatus.PUBLISHED) {
      throw new AppError("Only published reviews can receive a public response.", 409, "REVIEW_NOT_PUBLISHED");
    }
    return this.repository.updateResponse(data.reviewId, data.response);
  }

  async reportReview(data: ReportReviewInput) {
    const review = await this.repository.findById(data.reviewId);
    if (!review || review.business.deletedAt) {
      throw new AppError("Review not found.", 404, "REVIEW_NOT_FOUND");
    }
    if (review.status !== ReviewStatus.PUBLISHED) {
      throw new AppError("Only published reviews can be reported.", 409, "REVIEW_NOT_REPORTABLE");
    }
    if (data.userId) {
      const existing = await this.repository.hasUserReported(data.reviewId, data.userId);
      if (existing) {
        throw new AppError("You have already reported this review.", 409, "REPORT_ALREADY_EXISTS");
      }
    }
    return this.repository.createReport({
      reviewId: data.reviewId,
      businessId: review.businessId,
      userId: data.userId ?? null,
      reason: data.reason,
      details: data.details ?? null,
    });
  }
}
