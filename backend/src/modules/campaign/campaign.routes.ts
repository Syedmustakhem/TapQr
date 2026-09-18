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

/*
 * Create campaign
 */
router.post(
  "/business/:businessId/campaigns",
  validate(
    createCampaignSchema
  ),
  controller.create
);

/*
 * Get all campaigns for business
 */
router.get(
  "/business/:businessId/campaigns",
  controller.getMine
);

/*
 * Get campaign QR Codes
 *
 * IMPORTANT:
 * This must come before
 * /business/:businessId/campaigns/:id
 * so "qrcodes" is not treated as an ID.
 */
router.get(
  "/business/:businessId/campaigns/:id/qrcodes",
  controller.getQRCodes
);

/*
 * Get campaign availability
 *
 * Returns whether the campaign is currently
 * active according to status + startsAt + endsAt.
 *
 * IMPORTANT:
 * This must come before the generic :id route.
 */
router.get(
  "/business/:businessId/campaigns/:id/availability",
  controller.getAvailability
);

/*
 * Attach QR Code to campaign
 */
router.post(
  "/business/:businessId/campaigns/:id/qrcodes/:qrCodeId",
  controller.attachQRCode
);

/*
 * Detach QR Code from campaign
 */
router.delete(
  "/business/:businessId/campaigns/:id/qrcodes/:qrCodeId",
  controller.detachQRCode
);

/*
 * Get single campaign
 */
router.get(
  "/business/:businessId/campaigns/:id",
  controller.getById
);

/*
 * Update campaign
 */
router.patch(
  "/business/:businessId/campaigns/:id",
  validate(
    updateCampaignSchema
  ),
  controller.update
);

/*
 * Update campaign status
 */
router.patch(
  "/business/:businessId/campaigns/:id/status",
  validate(
    updateCampaignStatusSchema
  ),
  controller.updateStatus
);

export default router;