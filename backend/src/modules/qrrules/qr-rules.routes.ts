import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../cores/middleware/validate";

import {
  createQRRuleSchema,
  updateQRRuleSchema,
  qrRuleIdSchema,
  qrCodeRuleParamSchema,
  rollbackQRRuleSchema,
  simulateQRRuleSchema,
  qrRuleMatchesQuerySchema,
} from "./qr-rules.validation";

import { QRRulesController } from "./qr-rules.controller";

const router = Router();

const controller = new QRRulesController();

/**
 * ============================================================
 * AUTHENTICATION
 * ============================================================
 *
 * All QR Rule management endpoints require authentication.
 */
router.use(authenticate);

/**
 * ============================================================
 * CREATE RULE
 * ============================================================
 *
 * POST /api/qrrules
 */
router.post(
  "/",
  validate(createQRRuleSchema),
  controller.create
);

/**
 * ============================================================
 * SIMULATE RULE
 * ============================================================
 *
 * POST /api/qrrules/simulate
 *
 * IMPORTANT:
 * Keep this route BEFORE /:id so "simulate"
 * is not interpreted as a rule ID.
 */
router.post(
  "/simulate",
  validate(simulateQRRuleSchema),
  controller.simulate
);

/**
 * ============================================================
 * RULE MATCH ANALYTICS
 * ============================================================
 *
 * GET /api/qrrules/qr/:qrCodeId/matches
 *
 * IMPORTANT:
 * Keep this BEFORE /qr/:qrCodeId.
 */
router.get(
  "/qr/:qrCodeId/matches",
  validate(qrRuleMatchesQuerySchema),
  controller.listMatches
);

/**
 * ============================================================
 * LIST RULES FOR QR CODE
 * ============================================================
 *
 * GET /api/qrrules/qr/:qrCodeId
 */
router.get(
  "/qr/:qrCodeId",
  validate(qrCodeRuleParamSchema),
  controller.list
);

/**
 * ============================================================
 * GET SINGLE RULE
 * ============================================================
 *
 * GET /api/qrrules/:id
 */
router.get(
  "/:id",
  validate(qrRuleIdSchema),
  controller.getById
);

/**
 * ============================================================
 * UPDATE RULE
 * ============================================================
 *
 * PATCH /api/qrrules/:id
 */
router.patch(
  "/:id",
  validate(updateQRRuleSchema),
  controller.update
);

/**
 * ============================================================
 * DELETE / ARCHIVE RULE
 * ============================================================
 *
 * DELETE /api/qrrules/:id
 */
router.delete(
  "/:id",
  validate(qrRuleIdSchema),
  controller.delete
);

/**
 * ============================================================
 * ACTIVATE RULE
 * ============================================================
 *
 * POST /api/qrrules/:id/activate
 */
router.post(
  "/:id/activate",
  validate(qrRuleIdSchema),
  controller.activate
);

/**
 * ============================================================
 * PAUSE RULE
 * ============================================================
 *
 * POST /api/qrrules/:id/pause
 */
router.post(
  "/:id/pause",
  validate(qrRuleIdSchema),
  controller.pause
);

/**
 * ============================================================
 * PUBLISH RULE
 * ============================================================
 *
 * POST /api/qrrules/:id/publish
 */
router.post(
  "/:id/publish",
  validate(qrRuleIdSchema),
  controller.publish
);

/**
 * ============================================================
 * ROLLBACK RULE
 * ============================================================
 *
 * POST /api/qrrules/:id/rollback
 */
router.post(
  "/:id/rollback",
  validate(rollbackQRRuleSchema),
  controller.rollback
);

export default router;