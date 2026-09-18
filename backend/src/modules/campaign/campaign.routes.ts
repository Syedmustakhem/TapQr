import {
  Router,
} from "express";

import {
  CampaignController,
} from "./campaign.controller";

import {
  authenticate,
} from "../auth/auth.middleware";

import {
  validate,
} from "../../cores/middleware/validate";

import {
  createCampaignSchema,
  updateCampaignSchema,
  updateCampaignStatusSchema,
} from "./campaign.validation";

const router =
  Router();

const controller =
  new CampaignController();

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
| Campaign
|--------------------------------------------------------------------------
*/

router.post(
  "/business/:businessId/campaigns",
  validate(
    createCampaignSchema
  ),
  controller.create
);

router.get(
  "/business/:businessId/campaigns",
  controller.getMine
);

router.get(
  "/business/:businessId/campaigns/:id",
  controller.getById
);

router.patch(
  "/business/:businessId/campaigns/:id",
  validate(
    updateCampaignSchema
  ),
  controller.update
);

router.patch(
  "/business/:businessId/campaigns/:id/status",
  validate(
    updateCampaignStatusSchema
  ),
  controller.updateStatus
);

export default router;