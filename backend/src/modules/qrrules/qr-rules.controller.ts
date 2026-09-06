import {
  NextFunction,
  Request,
  Response,
} from "express";

import { AuthRequest } from "../auth/auth.types";

import { ResponseHandler } from "../../cores/responses/ResponseHandler";

import { QRRulesService } from "./qr-rules.service";

import {
  QRRuleMatchStatus,
} from "@prisma/client";

export class QRRulesController {
  private readonly service =
    new QRRulesService();

  /**
   * POST /api/qrrules
   */
  create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result =
        await this.service.createRule(
          req.user!.id,
          req.body
        );

      return ResponseHandler.created(
        res,
        "QR rule created successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/qrrules/simulate
   */
  simulate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result =
        await this.service.simulateRule(
          req.user!.id,
          req.body
        );

      return ResponseHandler.success(
        res,
        "QR rule simulation completed successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/qrrules/qr/:qrCodeId/matches
   */
  listMatches = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result =
        await this.service.listRuleMatches(
          req.user!.id,
          {
            qrCodeId: String(
              req.params.qrCodeId
            ),

            ruleId:
              typeof req.query.ruleId === "string"
                ? req.query.ruleId
                : undefined,

            status:
              typeof req.query.status === "string"
                ? (req.query.status as QRRuleMatchStatus)
                : undefined,

            from:
              typeof req.query.from === "string"
                ? new Date(req.query.from)
                : undefined,

            to:
              typeof req.query.to === "string"
                ? new Date(req.query.to)
                : undefined,

            limit:
              typeof req.query.limit === "string"
                ? Number(req.query.limit)
                : undefined,

            offset:
              typeof req.query.offset === "string"
                ? Number(req.query.offset)
                : undefined,
          }
        );

      return ResponseHandler.success(
        res,
        "QR rule matches retrieved successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/qrrules/qr/:qrCodeId
   */
  list = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result =
        await this.service.listRules(
          req.user!.id,
          String(req.params.qrCodeId)
        );

      return ResponseHandler.success(
        res,
        "QR rules retrieved successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/qrrules/:id
   */
  getById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result =
        await this.service.getRule(
          req.user!.id,
          String(req.params.id)
        );

      return ResponseHandler.success(
        res,
        "QR rule retrieved successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/qrrules/:id
   */
  update = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result =
        await this.service.updateRule(
          req.user!.id,
          String(req.params.id),
          req.body
        );

      return ResponseHandler.success(
        res,
        "QR rule updated successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/qrrules/:id
   */
  delete = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result =
        await this.service.deleteRule(
          req.user!.id,
          String(req.params.id)
        );

      return ResponseHandler.success(
        res,
        "QR rule archived successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/qrrules/:id/activate
   */
  activate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result =
        await this.service.activateRule(
          req.user!.id,
          String(req.params.id)
        );

      return ResponseHandler.success(
        res,
        "QR rule activated successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/qrrules/:id/pause
   */
  pause = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result =
        await this.service.pauseRule(
          req.user!.id,
          String(req.params.id)
        );

      return ResponseHandler.success(
        res,
        "QR rule paused successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/qrrules/:id/publish
   */
  publish = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result =
        await this.service.publishRule(
          req.user!.id,
          String(req.params.id)
        );

      return ResponseHandler.success(
        res,
        "QR rule published successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/qrrules/:id/rollback
   */
  rollback = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result =
        await this.service.rollbackRule(
          req.user!.id,
          String(req.params.id),
          req.body
        );

      return ResponseHandler.success(
        res,
        "QR rule rolled back successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };
}