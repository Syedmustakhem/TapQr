import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";

import { validate } from "../../cores/middleware/validate";

import {
  createCatalogItemSchema,
  updateCatalogItemSchema,
} from "./item.schema";

import {
  CatalogItemController,
} from "./item.controller";

const router = Router();

const controller =
  new CatalogItemController();

/**
 * Create item
 *
 * POST
 * /api/catalog/categories/:categoryId/items
 */
router.post(
  "/categories/:categoryId/items",
  authenticate,
  validate(createCatalogItemSchema),
  controller.createItem
);

/**
 * Get category items
 *
 * GET
 * /api/catalog/categories/:categoryId/items
 */
router.get(
  "/categories/:categoryId/items",
  authenticate,
  controller.getCategoryItems
);

/**
 * Get single item
 *
 * GET
 * /api/catalog/items/:id
 */
router.get(
  "/items/:id",
  authenticate,
  controller.getItem
);

/**
 * Update item
 *
 * PUT
 * /api/catalog/items/:id
 */
router.put(
  "/items/:id",
  authenticate,
  validate(updateCatalogItemSchema),
  controller.updateItem
);

/**
 * Delete item
 *
 * DELETE
 * /api/catalog/items/:id
 */
router.delete(
  "/items/:id",
  authenticate,
  controller.deleteItem
);

export default router;