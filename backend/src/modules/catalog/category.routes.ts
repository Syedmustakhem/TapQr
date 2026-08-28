import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";

import { validate } from "../../cores/middleware/validate";

import {
  createCategorySchema,
  updateCategorySchema,
} from "./category.schema";

import {
  CategoryController,
} from "./category.controller";

const router = Router();

const controller =
  new CategoryController();

/**
 * Create category
 *
 * POST
 * /api/catalogs/:catalogId/categories
 */
router.post(
  "/:catalogId/categories",
  authenticate,
  validate(createCategorySchema),
  controller.createCategory
);

/**
 * Get categories for catalog
 *
 * GET
 * /api/catalogs/:catalogId/categories
 */
router.get(
  "/:catalogId/categories",
  authenticate,
  controller.getCatalogCategories
);

/**
 * Get category
 *
 * GET
 * /api/categories/:id
 */
router.get(
  "/categories/:id",
  authenticate,
  controller.getCategoryById
);

/**
 * Update category
 *
 * PUT
 * /api/categories/:id
 */
router.put(
  "/categories/:id",
  authenticate,
  validate(updateCategorySchema),
  controller.updateCategory
);

/**
 * Delete category
 *
 * DELETE
 * /api/categories/:id
 */
router.delete(
  "/categories/:id",
  authenticate,
  controller.deleteCategory
);

export default router;