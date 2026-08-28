import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";

import { validate } from "../../cores/middleware/validate";

import {
  createOptionSchema,
  updateOptionSchema,
} from "./option.schema";

import {
  OptionController,
} from "./option.controller";

const router = Router();

const controller =
  new OptionController();

/**
 * Create option
 */
router.post(
  "/option-groups/:groupId/options",
  authenticate,
  validate(createOptionSchema),
  controller.createOption
);

/**
 * Get options
 */
router.get(
  "/option-groups/:groupId/options",
  authenticate,
  controller.getGroupOptions
);

/**
 * Get option
 */
router.get(
  "/options/:id",
  authenticate,
  controller.getOption
);

/**
 * Update option
 */
router.put(
  "/options/:id",
  authenticate,
  validate(updateOptionSchema),
  controller.updateOption
);

/**
 * Delete option
 */
router.delete(
  "/options/:id",
  authenticate,
  controller.deleteOption
);

export default router;