import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";

import { validate } from "../../cores/middleware/validate";

import {
  createVariantSchema,
  updateVariantSchema,
} from "./variant.schema";

import {
  VariantController,
} from "./variant.controller";

const router = Router();

const controller =
  new VariantController();

/**
 * Create variant
 *
 * POST
 * /api/catalogs/items/:itemId/variants
 */
router.post(
  "/items/:itemId/variants",
  authenticate,
  validate(createVariantSchema),
  controller.createVariant
);

/**
 * Get variants
 *
 * GET
 * /api/catalogs/items/:itemId/variants
 */
router.get(
  "/items/:itemId/variants",
  authenticate,
  controller.getItemVariants
);

/**
 * Get variant
 *
 * GET
 * /api/catalogs/variants/:id
 */
router.get(
  "/variants/:id",
  authenticate,
  controller.getVariant
);

/**
 * Update variant
 *
 * PUT
 * /api/catalogs/variants/:id
 */
router.put(
  "/variants/:id",
  authenticate,
  validate(updateVariantSchema),
  controller.updateVariant
);

/**
 * Delete variant
 *
 * DELETE
 * /api/catalogs/variants/:id
 */
router.delete(
  "/variants/:id",
  authenticate,
  controller.deleteVariant
);

export default router;