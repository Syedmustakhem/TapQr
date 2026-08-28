import { Router } from "express";

import {
  BusinessController,
} from "./business.controller";

import {
  authenticate,
} from "../auth/auth.middleware";

const router =
  Router();

const controller =
  new BusinessController();

router.use(
  authenticate
);

router.post(
  "/",
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
  controller.update
);

router.patch(
  "/:id/profile",
  controller.updateProfile
);

router.delete(
  "/:id",
  controller.delete
);

export default router;