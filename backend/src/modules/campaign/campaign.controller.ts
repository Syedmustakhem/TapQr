import {
  Response,
  NextFunction,
} from "express";

import {
  CampaignService,
} from "./campaign.service";

import {
  CampaignAuthRequest,
} from "./campaign.types";

import {
  createCampaignSchema,
  updateCampaignSchema,
  updateCampaignStatusSchema,
} from "./campaign.validation";

export class CampaignController {
  private readonly service =
    new CampaignService();

  /*
  |--------------------------------------------------------------------------
  | Create Campaign
  |--------------------------------------------------------------------------
  */

  create = async (
    req: CampaignAuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
          code: "UNAUTHORIZED",
        });
      }

      const data =
        createCampaignSchema.parse(
          req.body
        );

      const campaign =
        await this.service.create(
          userId,
          String(req.params.businessId),
          data
        );

      return res.status(201).json({
        success: true,
        message:
          "Campaign created successfully.",
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Get Campaigns
  |--------------------------------------------------------------------------
  */

  getMine = async (
    req: CampaignAuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
          code: "UNAUTHORIZED",
        });
      }

      const campaigns =
        await this.service.getByBusinessId(
          userId,
          String(req.params.businessId)
        );

      return res.status(200).json({
        success: true,
        message:
          "Campaigns retrieved successfully.",
        data: campaigns,
      });
    } catch (error) {
      next(error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Get Single Campaign
  |--------------------------------------------------------------------------
  */

  getById = async (
    req: CampaignAuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
          code: "UNAUTHORIZED",
        });
      }

      const campaign =
        await this.service.getById(
          userId,
          String(req.params.businessId),
          String(req.params.id)
        );

      return res.status(200).json({
        success: true,
        message:
          "Campaign retrieved successfully.",
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Get Campaign Availability
  |--------------------------------------------------------------------------
  */

  getAvailability = async (
    req: CampaignAuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
          code: "UNAUTHORIZED",
        });
      }

      const availability =
        await this.service.getAvailability(
          userId,
          String(req.params.businessId),
          String(req.params.id)
        );

      return res.status(200).json({
        success: true,
        message:
          "Campaign availability retrieved successfully.",
        data: availability,
      });
    } catch (error) {
      next(error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Get Campaign QR Codes
  |--------------------------------------------------------------------------
  */

  getQRCodes = async (
    req: CampaignAuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
          code: "UNAUTHORIZED",
        });
      }

      const qrCodes =
        await this.service.getQRCodes(
          userId,
          String(req.params.businessId),
          String(req.params.id)
        );

      return res.status(200).json({
        success: true,
        message:
          "Campaign QR Codes retrieved successfully.",
        data: qrCodes,
      });
    } catch (error) {
      next(error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Attach QR Code
  |--------------------------------------------------------------------------
  */

  attachQRCode = async (
    req: CampaignAuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
          code: "UNAUTHORIZED",
        });
      }

      const qrCode =
        await this.service.attachQRCode(
          userId,
          String(req.params.businessId),
          String(req.params.id),
          String(req.params.qrCodeId)
        );

      return res.status(200).json({
        success: true,
        message:
          "QR Code assigned to campaign successfully.",
        data: qrCode,
      });
    } catch (error) {
      next(error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Detach QR Code
  |--------------------------------------------------------------------------
  */

  detachQRCode = async (
    req: CampaignAuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
          code: "UNAUTHORIZED",
        });
      }

      const qrCode =
        await this.service.detachQRCode(
          userId,
          String(req.params.businessId),
          String(req.params.id),
          String(req.params.qrCodeId)
        );

      return res.status(200).json({
        success: true,
        message:
          "QR Code removed from campaign successfully.",
        data: qrCode,
      });
    } catch (error) {
      next(error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Update Campaign
  |--------------------------------------------------------------------------
  */

  update = async (
    req: CampaignAuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
          code: "UNAUTHORIZED",
        });
      }

      const data =
        updateCampaignSchema.parse(
          req.body
        );

      const campaign =
        await this.service.update(
          userId,
          String(req.params.businessId),
          String(req.params.id),
          data
        );

      return res.status(200).json({
        success: true,
        message:
          "Campaign updated successfully.",
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Update Campaign Status
  |--------------------------------------------------------------------------
  */

  updateStatus = async (
    req: CampaignAuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
          code: "UNAUTHORIZED",
        });
      }

      const data =
        updateCampaignStatusSchema.parse(
          req.body
        );

      const campaign =
        await this.service.updateStatus(
          userId,
          String(req.params.businessId),
          String(req.params.id),
          data
        );

      return res.status(200).json({
        success: true,
        message:
          "Campaign status updated successfully.",
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  };
}