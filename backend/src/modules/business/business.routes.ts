import { Router } from "express";

import {
  BusinessController,
} from "./business.controller";

import {
  authenticate,
} from "../auth/auth.middleware";

import {
  validate,
} from "../../cores/middleware/validate";

import {
  createBusinessSchema,
  updateBusinessProfileSchema,
  updateBusinessSchema,
} from "./business.validation";

const router =
  Router();

const controller =
  new BusinessController();

/*
|--------------------------------------------------------------------------
| Public routes (NO authentication)
|--------------------------------------------------------------------------
|
| IMPORTANT: these MUST be registered BEFORE router.use(authenticate).
| The public business page (tapqr.shop/<slug>) is server-rendered with no
| login token — if this route sits behind authenticate, the API returns 401
| and the public page crashes with "This page couldn't load".
|
*/
router.get(
  "/public/:slug",
  controller.getPublicBySlug
);

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

router.use(
  authenticate
);

/*
|--------------------------------------------------------------------------
| Business (authenticated)
|--------------------------------------------------------------------------
*/
router.post(
  "/",
  validate(createBusinessSchema),
  controller.create
);

router.get(
  "/",
  controller.getMine
);

router.get(
  "/:id",
  controller.getById
);

router.patch(
  "/:id",
  validate(updateBusinessSchema),
  controller.update
);

router.patch(
  "/:id/profile",
  validate(
    updateBusinessProfileSchema
  ),
  controller.updateProfile
);

router.delete(
  "/:id",
  controller.delete
);

export default router;
