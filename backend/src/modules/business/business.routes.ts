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
| Authentication
|--------------------------------------------------------------------------
*/

router.use(
  authenticate
);

/*
|--------------------------------------------------------------------------
| Business
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