import {
  Request,
  Response,
  NextFunction,
} from "express";
import { AuthRequest } from "../auth/auth.types";
import {
  startTrial,
  getTrialStatus,
} from "./trial.service";
import {
  getOrCreateCode,
  validateCode,
  attributeReferral,
  getReferralStats,
} from "./referral.service";
import type { AttributeReferralInput } from "./growth.validation";

/*
 * ============================================================
 * GROWTH CONTROLLER  (trial + referral)
 * ============================================================
 */

export class GrowthController {
  private readonly service = {
    startTrial,
    getTrialStatus,
    getOrCreateCode,
    validateCode,
    attributeReferral,
    getReferralStats,
  };

  startTrial = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await this.service.startTrial(
          req.user!.id
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getTrialStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await this.service.getTrialStatus(
          req.user!.id
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getReferralCode = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await this.service.getOrCreateCode(
          req.user!.id
        );

      res.status(200).json({
        success: true,
        data: {
          code: result.code,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getReferralStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await this.service.getReferralStats(
          req.user!.id
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /*
   * Public — the signup page calls this to show
   * "You've been invited" UX before the user logs in.
   * Reveals only whether the code exists.
   */
  validateReferralCode = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Express 5 types route params as string | string[]
      // (wildcards can capture arrays). Normalize defensively.
      const raw = req.params.code;
      const code = (
        Array.isArray(raw) ? raw[0] : raw
      ) ?? "";

      const result =
        await this.service.validateCode(
          code
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  attributeReferral = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await this.service.attributeReferral(
          req.user!.id,
          (req.body as AttributeReferralInput)
            .code
        );

      res.status(200).json({
        success: true,
        data: {
          referralId: result.id,
          status: result.status,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
