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
 */

router.use(authenticate);

/**
 * ============================================================
 * CREATE RULE
 * ============================================================
 *
 * POST /api/qr-rules
 *
 * Body:
 * {
 *   qrCodeId,
 *   name,
 *   ...
 * }
 */

router.post(
  "/",
  validate(
    createQRRuleSchema,
    "body"
  ),
  controller.create
);

/**
 * ============================================================
 * SIMULATE RULE
 * ============================================================
 *
 * POST /api/qr-rules/simulate
 */

router.post(
  "/simulate",
  validate(
    simulateQRRuleSchema,
    "body"
  ),
  controller.simulate
);

/**
 * ============================================================
 * LIST RULE MATCHES
 * ============================================================
 *
 * GET /api/qr-rules/qr/:qrCodeId/matches
 *
 * URL params:
 *   qrCodeId
 *
 * Query:
 *   ruleId
 *   status
 *   from
 *   to
 *   limit
 *   offset
 *
 * We validate params and query separately.
 */

router.get(
  "/qr/:qrCodeId/matches",

  validate(
    qrCodeRuleParamSchema,
    "params"
  ),

  validate(
    qrRuleMatchesQuerySchema,
    "query"
  ),

  controller.listMatches
);

/**
 * ============================================================
 * LIST RULES FOR QR CODE
 * ============================================================
 *
 * GET /api/qr-rules/qr/:qrCodeId
 *
 * qrCodeId comes from req.params.
 */

router.get(
  "/qr/:qrCodeId",

  validate(
    qrCodeRuleParamSchema,
    "params"
  ),

  controller.list
);

/**
 * ============================================================
 * GET SINGLE RULE
 * ============================================================
 *
 * GET /api/qr-rules/:id
 */

router.get(
  "/:id",

  validate(
    qrRuleIdSchema,
    "params"
  ),

  controller.getById
);

/**
 * ============================================================
 * UPDATE RULE
 * ============================================================
 *
 * PATCH /api/qr-rules/:id
 *
 * id       → params
 * rule data → body
 */

router.patch(
  "/:id",

  validate(
    qrRuleIdSchema,
    "params"
  ),

  validate(
    updateQRRuleSchema,
    "body"
  ),

  controller.update
);

/**
 * ============================================================
 * DELETE RULE
 * ============================================================
 *
 * DELETE /api/qr-rules/:id
 */

router.delete(
  "/:id",

  validate(
    qrRuleIdSchema,
    "params"
  ),

  controller.delete
);

/**
 * ============================================================
 * ACTIVATE RULE
 * ============================================================
 *
 * POST /api/qr-rules/:id/activate
 */

router.post(
  "/:id/activate",

  validate(
    qrRuleIdSchema,
    "params"
  ),

  controller.activate
);

/**
 * ============================================================
 * PAUSE RULE
 * ============================================================
 *
 * POST /api/qr-rules/:id/pause
 */

router.post(
  "/:id/pause",

  validate(
    qrRuleIdSchema,
    "params"
  ),

  controller.pause
);

/**
 * ============================================================
 * PUBLISH RULE
 * ============================================================
 *
 * POST /api/qr-rules/:id/publish
 */

router.post(
  "/:id/publish",

  validate(
    qrRuleIdSchema,
    "params"
  ),

  controller.publish
);

/**
 * ============================================================
 * ROLLBACK RULE
 * ============================================================
 *
 * POST /api/qr-rules/:id/rollback
 *
 * id      → params
 * version → body
 */

router.post(
  "/:id/rollback",

  validate(
    qrRuleIdSchema,
    "params"
  ),

  validate(
    rollbackQRRuleSchema,
    "body"
  ),

  controller.rollback
);

export default router;