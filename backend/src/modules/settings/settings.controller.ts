import {
  Response,
  NextFunction,
} from "express";
import { AuthRequest } from "../auth/auth.types";
import {
  getPreferences,
  updatePreferences,
  listApiKeys,
  createApiKey,
  revokeApiKey,
} from "./settings.service";
import type {
  UpdatePreferencesInput,
  CreateApiKeyInput,
} from "./settings.validation";

/*
 * ============================================================
 * SETTINGS CONTROLLER
 * ============================================================
 */

export class SettingsController {
  getPreferences = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await getPreferences(
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

  updatePreferences = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await updatePreferences(
          req.user!.id,
          req.body as UpdatePreferencesInput
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  listApiKeys = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await listApiKeys(
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

  createApiKey = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await createApiKey(
        req.user!.id,
        req.body as CreateApiKeyInput
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  revokeApiKey = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Express 5 types route params as string | string[].
      const raw = req.params.id;
      const id = (
        Array.isArray(raw) ? raw[0] : raw
      ) ?? "";

      const result = await revokeApiKey(
        req.user!.id,
        id
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
