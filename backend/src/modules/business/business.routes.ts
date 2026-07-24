import { Router } from "express";

import { BusinessController } from "./business.controller";
import { authenticate } from "../auth/auth.middleware";

const router = Router();

const businessController = new BusinessController();

router.post(
  "/",
  authenticate,
  businessController.createBusiness
);
router.get(
  "/me",
  authenticate,
  businessController.getMyBusiness
);
router.delete(
  "/me",
  authenticate,
  businessController.deleteBusiness
);
export default router;