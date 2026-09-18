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