import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";

import { validate } from "../../cores/middleware/validate";

import {
  createOptionGroupSchema,
  updateOptionGroupSchema,
} from "./option-group.schema";

import {
  OptionGroupController,
} from "./option-group.controller";

const router = Router();

const controller =
  new OptionGroupController();

/**
 * Create option group
 */
router.post(
  "/items/:itemId/option-groups",
  authenticate,
  validate(createOptionGroupSchema),
  controller.createOptionGroup
);

/**
 * Get option groups
 */
router.get(
  "/items/:itemId/option-groups",
  authenticate,
  controller.getItemOptionGroups
);

/**
 * Get option group
 */
router.get(
  "/option-groups/:id",
  authenticate,
  controller.getOptionGroup
);

/**
 * Update option group
 */
router.put(
  "/option-groups/:id",
  authenticate,
  validate(updateOptionGroupSchema),
  controller.updateOptionGroup
);

/**
 * Delete option group
 */
router.delete(
  "/option-groups/:id",
  authenticate,
  controller.deleteOptionGroup
);

export default router;