// src/api/reviewsApi.ts
//
// Review management endpoints, mirroring the TapQR web
// dashboard (app/dashboard/reviews calls these exact
// paths against https://api.tapqr.shop/api).
//
// Uses the shared authenticated axios instance from
// authApi.ts (Bearer token + 401 refresh interceptors).

import api from "./authApi";

export type ReviewStatus =
  | "PENDING"
  | "PUBLISHED"
  | "HIDDEN"
  | "REJECTED";

export type Review = {
  id: string;
  businessId: string;
  qrCodeId?: string | null;
  userId?: string | null;
  reviewerName?: string | null;
  reviewerEmail?: string | null;
  isPrivateFeedback?: boolean;
  rating: number;
  title?: string | null;
  comment?: string | null;
  status: ReviewStatus;
  isVerified: boolean;
  verifiedAt?: string | null;
  ownerResponse?: string | null;
  respondedAt?: string | null;
  moderationNote?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type ReviewSummary = {
  averageRating: number;
  totalReviews: number;
  verifiedReviews: number;
  distribution: Array<{
    rating: number;
    count: number;
  }>;
};

export type PaginatedReviews = {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ReviewListParams = {
  page?: number;
  limit?: number;
  /** "ALL" is the client-side default — never sent. */
  status?: string;
  /** 1–5 as a string. */
  rating?: string;
  /** "true" | "false". */
  verified?: string;
  search?: string;
};

type ReviewsResponse = {
  success?: boolean;
  message?: string;
  data?: PaginatedReviews;
};

type SummaryResponse = {
  success?: boolean;
  message?: string;
  data?: ReviewSummary;
};

/**
 * GET /reviews/businesses/:businessId/manage?page=&limit=&status=&rating=&verified=&search=
 * — paginated, filterable review list. The summary is a
 * separate call (getReviewSummary).
 */
export async function getReviews(
  businessId: string,
  params?: ReviewListParams
): Promise<PaginatedReviews> {
  const res =
    await api.get<ReviewsResponse>(
      `/reviews/businesses/${encodeURIComponent(
        businessId
      )}/manage`,
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          ...(params?.status &&
          params.status !== "ALL"
            ? { status: params.status }
            : {}),
          ...(params?.rating &&
          params.rating !== "ALL"
            ? { rating: params.rating }
            : {}),
          ...(params?.verified &&
          params.verified !== "ALL"
            ? { verified: params.verified }
            : {}),
          ...(params?.search?.trim()
            ? {
                search:
                  params.search.trim(),
              }
            : {}),
        },
      }
    );

  return (
    res.data?.data ?? {
      reviews: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    }
  );
}

/**
 * GET /reviews/businesses/:businessId/summary —
 * average rating, totals, verified count and the
 * per-star distribution (published reviews only).
 */
export async function getReviewSummary(
  businessId: string
): Promise<ReviewSummary | null> {
  const res =
    await api.get<SummaryResponse>(
      `/reviews/businesses/${encodeURIComponent(
        businessId
      )}/summary`
    );

  return res.data?.data ?? null;
}

/**
 * PATCH /reviews/:reviewId/status — moderate a review
 * (publish / hide / reject). Body: { status }.
 */
export async function setReviewStatus(
  reviewId: string,
  status: ReviewStatus
): Promise<void> {
  await api.patch(
    `/reviews/${encodeURIComponent(
      reviewId
    )}/status`,
    { status }
  );
}

/**
 * PATCH /reviews/:reviewId/response — save the business
 * owner's public response to a review.
 * Body: { response }.
 */
export async function respondToReview(
  reviewId: string,
  response: string
): Promise<void> {
  await api.patch(
    `/reviews/${encodeURIComponent(
      reviewId
    )}/response`,
    { response }
  );
}
