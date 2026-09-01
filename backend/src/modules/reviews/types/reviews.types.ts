import { Request } from "express";
import { ReviewStatus } from "@prisma/client";

export interface ReviewAuthRequest extends Request {
  user?: { id: string; role: string };
}

export interface CreateReviewInput {
  businessId: string;
  qrCodeId?: string | null;
  userId?: string | null;
  reviewerName?: string | null;
  reviewerEmail?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
}

export interface ReviewListQuery {
  page: number;
  limit: number;
  status?: ReviewStatus;
  rating?: number;
  verified?: boolean;
  search?: string;
}

export interface ReviewStatusInput {
  actorId: string;
  reviewId: string;
  status: ReviewStatus;
  moderationNote?: string | null;
}

export interface ReviewResponseInput {
  actorId: string;
  reviewId: string;
  response: string;
}

export interface ReportReviewInput {
  reviewId: string;
  userId?: string | null;
  reason: string;
  details?: string | null;
}
