import { NextFunction, Request, Response } from "express";

import { AuthRequest } from "../auth/auth.types";
import { ResponseHandler } from "../../cores/responses/ResponseHandler";
import { QRExperimentsService } from "./qr-experiments.service";

export class QRExperimentsController {
  private readonly service = new QRExperimentsService();

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.create(req.user!.id, req.body);
      return ResponseHandler.created(res, "Experiment created successfully.", result);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.list(
        req.user!.id,
        typeof req.query.qrCodeId === "string"
          ? req.query.qrCodeId
          : undefined
      );
      return ResponseHandler.success(res, "Experiments retrieved successfully.", result);
    } catch (error) {
      next(error);
    }
  };

  get = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.get(req.user!.id, String(req.params.id));
      return ResponseHandler.success(res, "Experiment retrieved successfully.", result);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.update(
        req.user!.id,
        String(req.params.id),
        req.body
      );
      return ResponseHandler.success(res, "Experiment updated successfully.", result);
    } catch (error) {
      next(error);
    }
  };

  archive = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.archive(req.user!.id, String(req.params.id));
      return ResponseHandler.success(res, "Experiment archived successfully.", result);
    } catch (error) {
      next(error);
    }
  };

  start = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.start(req.user!.id, String(req.params.id));
      return ResponseHandler.success(res, "Experiment started successfully.", result);
    } catch (error) {
      next(error);
    }
  };

  pause = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.pause(req.user!.id, String(req.params.id));
      return ResponseHandler.success(res, "Experiment paused successfully.", result);
    } catch (error) {
      next(error);
    }
  };

  complete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.complete(req.user!.id, String(req.params.id));
      return ResponseHandler.success(res, "Experiment completed successfully.", result);
    } catch (error) {
      next(error);
    }
  };

  createVariant = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createVariant(
        req.user!.id,
        String(req.params.id),
        req.body
      );
      return ResponseHandler.created(res, "Variant created successfully.", result);
    } catch (error) {
      next(error);
    }
  };

  updateVariant = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.updateVariant(
        req.user!.id,
        String(req.params.id),
        String(req.params.variantId),
        req.body
      );
      return ResponseHandler.success(res, "Variant updated successfully.", result);
    } catch (error) {
      next(error);
    }
  };

  deleteVariant = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.deleteVariant(
        req.user!.id,
        String(req.params.id),
        String(req.params.variantId)
      );
      return ResponseHandler.success(res, "Variant deleted successfully.", result);
    } catch (error) {
      next(error);
    }
  };

  createConversion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createConversion(
        req.user?.id ?? null,
        req.body
      );
      return ResponseHandler.created(res, "Conversion recorded successfully.", result);
    } catch (error) {
      next(error);
    }
  };
}
