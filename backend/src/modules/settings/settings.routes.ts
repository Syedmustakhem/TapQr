import { Router } from "express";

import { SettingsController } from "./settings.controller";

import { authenticate } from "../auth/auth.middleware";

import { validate } from "../../cores/middleware/validate";

import {
  updatePreferencesSchema,
  createApiKeySchema,
} from "./settings.validation";

const router = Router();

const controller =
  new SettingsController();

/*
 * ============================================================
 * SETTINGS ROUTES  ->  mounted at /api/settings
 * ============================================================
 *
 * All routes require authentication.
 */

router.use(authenticate);

router.get(
  "/preferences",
  controller.getPreferences
);

router.patch(
  "/preferences",
  validate(updatePreferencesSchema, "body"),
  controller.updatePreferences
);

router.get(
  "/api-keys",
  controller.listApiKeys
);

router.post(
  "/api-keys",
  validate(createApiKeySchema, "body"),
  controller.createApiKey
);

router.delete(
  "/api-keys/:id",
  controller.revokeApiKey
);

export default router;
