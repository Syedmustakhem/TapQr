import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  BusinessService,
} from "./business.service";

import {
  BusinessAuthRequest,
} from "./business.types";

import {
  createBusinessSchema,
  updateBusinessProfileSchema,
  updateBusinessSchema,
} from "./business.validation";

import { assertCanCreateBusiness } from "../billing/entitlements";

export class BusinessController {
  private readonly service =
    new BusinessService();

  create = async (
    req: BusinessAuthRequest,
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
        createBusinessSchema.parse(
          req.body
        );

      await assertCanCreateBusiness(userId);

      const business =
        await this.service.create(
          userId,
          data
        );

      return res.status(201).json({
        success: true,
        message:
          "Business created successfully.",
        data: business,
      });
    } catch (error) {
      next(error);
    }
  };

  getMine = async (
    req: BusinessAuthRequest,
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

      const businesses =
        await this.service.getMyBusinesses(
          userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Businesses retrieved successfully.",
        data: businesses,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (
    req: BusinessAuthRequest,
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

      const business =
        await this.service.getById(
          userId,
          String(req.params.id)
        );

      return res.status(200).json({
        success: true,
        message:
          "Business retrieved successfully.",
        data: business,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: BusinessAuthRequest,
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
        updateBusinessSchema.parse(
          req.body
        );

      const business =
        await this.service.update(
          userId,
          String(req.params.id),
          data
        );

      return res.status(200).json({
        success: true,
        message:
          "Business updated successfully.",
        data: business,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (
    req: BusinessAuthRequest,
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
        updateBusinessProfileSchema.parse(
          req.body
        );

      const profile =
        await this.service.updateProfile(
          userId,
          String(req.params.id),
          data
        );

      return res.status(200).json({
        success: true,
        message:
          "Business profile updated successfully.",
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    req: BusinessAuthRequest,
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

      const result =
        await this.service.delete(
          userId,
          String(req.params.id)
        );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
  getPublicBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const slug = String(
        req.params.slug ??
          ""
      ).trim();

      if (!slug) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Business slug is required.",
            code:
              "BUSINESS_SLUG_REQUIRED",
          });
      }

      const business =
        await this.service.getPublicBySlug(
          slug
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Business retrieved successfully.",
          data: business,
        });
    } catch (error) {
      next(error);
    }
  };
}