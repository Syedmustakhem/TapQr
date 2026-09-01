import { Router } from "express";
import { ReviewsController } from "../controllers/reviews.controller";
import { authenticate } from "../../auth/auth.middleware";
import { validate } from "../../../cores/middleware/validate";
import { authLimiter } from "../../../cores/middleware/rateLimiter";
import {
  createReviewSchema,
  updateReviewStatusSchema,
  reviewResponseSchema,
  reportReviewSchema,
} from "../validations/reviews.validation";

const router = Router();
const controller = new ReviewsController();

/* Public */
router.post(
  "/businesses/:businessId",
  authLimiter,
  validate(createReviewSchema),
  controller.createReview
);

router.get(
  "/businesses/:businessId",
  controller.listPublicReviews
);

router.get(
  "/businesses/:businessId/summary",
  controller.getPublicSummary
);

router.get(
  "/businesses/:businessId/external-url",
  controller.getExternalReviewUrl
);

/* Authenticated customer */
router.post(
  "/businesses/:businessId/authenticated",
  authenticate,
  authLimiter,
  validate(createReviewSchema),
  controller.createAuthenticatedReview
);

router.post(
  "/:reviewId/report",
  authenticate,
  authLimiter,
  validate(reportReviewSchema),
  controller.reportReview
);

/* Business management */
router.get(
  "/businesses/:businessId/manage",
  authenticate,
  controller.listManagedReviews
);

router.patch(
  "/:reviewId/status",
  authenticate,
  validate(updateReviewStatusSchema),
  controller.updateStatus
);

router.patch(
  "/:reviewId/response",
  authenticate,
  validate(reviewResponseSchema),
  controller.respond
);

export default router;
