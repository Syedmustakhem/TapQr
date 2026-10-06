import { Router } from "express";

import { AdminController } from "./admin.controller";

import { authenticate } from "../auth/auth.middleware";
import { requireSuperAdmin } from "./admin.guard";

import { validate } from "../../cores/middleware/validate";

import {
  adminListQuerySchema,
  adminUserActionSchema,
  adminGrantProSchema,
  adminExtendTrialSchema,
  adminPlanUpdateSchema,
  adminFlagUpsertSchema,
  adminBroadcastSchema,
  adminTicketReplySchema,
  adminReviewReportActionSchema,
  adminSupportTicketSchema,
} from "./admin.validation";

const router = Router();
const controller = new AdminController();

/*
 * ============================================================
 * ADMIN ROUTES  ->  mounted at /api/admin
 * ============================================================
 *
 * User-facing ticket creation needs auth only.
 * EVERYTHING else requires SUPER_ADMIN.
 */

router.post(
  "/support/tickets",
  authenticate,
  validate(
    adminSupportTicketSchema,
    "body"
  ),
  controller.createTicket
);

router.use(authenticate);
router.use(requireSuperAdmin);

/* OVERVIEW */
router.get(
  "/overview",
  controller.getOverview
);

/* USERS */
router.get(
  "/users",
  validate(adminListQuerySchema, "query"),
  controller.listUsers
);
router.get(
  "/users/:id",
  controller.getUserDetail
);
router.post(
  "/users/:id/suspend",
  validate(adminUserActionSchema, "body"),
  controller.suspendUser
);
router.post(
  "/users/:id/unsuspend",
  controller.unsuspendUser
);
router.post(
  "/users/:id/grant-pro",
  validate(adminGrantProSchema, "body"),
  controller.grantPro
);
router.post(
  "/users/:id/extend-trial",
  validate(adminExtendTrialSchema, "body"),
  controller.extendTrial
);

/* BUSINESSES */
router.get(
  "/businesses",
  validate(adminListQuerySchema, "query"),
  controller.listBusinesses
);

/* MONEY */
router.get(
  "/subscriptions",
  validate(adminListQuerySchema, "query"),
  controller.listSubscriptions
);
router.get(
  "/payments",
  validate(adminListQuerySchema, "query"),
  controller.listPayments
);

/* TRIALS & REFERRALS */
router.get(
  "/trials",
  validate(adminListQuerySchema, "query"),
  controller.listTrials
);
router.get(
  "/referrals",
  validate(adminListQuerySchema, "query"),
  controller.listReferrals
);
router.get(
  "/fraud-signals",
  controller.fraudSignals
);

/* MODERATION */
router.get(
  "/review-reports",
  validate(adminListQuerySchema, "query"),
  controller.listReviewReports
);
router.post(
  "/review-reports/:reportId/resolve",
  validate(
    adminReviewReportActionSchema,
    "body"
  ),
  controller.resolveReport
);

/* PLANS & FLAGS */
router.get(
  "/plans",
  controller.listPlans
);
router.patch(
  "/plans/:code",
  validate(adminPlanUpdateSchema, "body"),
  controller.updatePlan
);
router.get(
  "/flags",
  controller.listFlags
);
router.post(
  "/flags",
  validate(adminFlagUpsertSchema, "body"),
  controller.upsertFlag
);

/* SUPPORT */
router.get(
  "/support/tickets",
  validate(adminListQuerySchema, "query"),
  controller.listTickets
);
router.get(
  "/support/tickets/:ticketId",
  controller.getTicket
);
router.post(
  "/support/tickets/:ticketId/reply",
  validate(
    adminTicketReplySchema,
    "body"
  ),
  controller.replyTicket
);

/* BROADCAST */
router.post(
  "/broadcast",
  validate(adminBroadcastSchema, "body"),
  controller.broadcast
);

/* AUDIT */
router.get(
  "/audit-log",
  validate(adminListQuerySchema, "query"),
  controller.listAuditLog
);

export default router;
