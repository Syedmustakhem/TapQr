import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";

import { validate } from "../../cores/middleware/validate";

import {
  createCatalogSchema,
  updateCatalogSchema,
} from "./catalog.schema";

import {
  CatalogController,
} from "./catalog.controller";

const router = Router();

const controller =
  new CatalogController();

/**
 * Create catalog
 *
 * POST /api/catalogs/business/:businessId
 */
router.post(
  "/business/:businessId",
  authenticate,
  validate(createCatalogSchema),
  controller.createCatalog
);

/**
 * Get all catalogs
 *
 * GET /api/catalogs/business/:businessId
 */
router.get(
  "/business/:businessId",
  authenticate,
  controller.getBusinessCatalogs
);

/**
 * Get catalog
 *
 * GET /api/catalogs/:id
 */
router.get(
  "/:id",
  authenticate,
  controller.getCatalogById
);

/**
 * Update catalog
 *
 * PUT /api/catalogs/:id
 */
router.put(
  "/:id",
  authenticate,
  validate(updateCatalogSchema),
  controller.updateCatalog
);

/**
 * Delete catalog
 *
 * DELETE /api/catalogs/:id
 */
router.delete(
  "/:id",
  authenticate,
  controller.deleteCatalog
);

export default router;