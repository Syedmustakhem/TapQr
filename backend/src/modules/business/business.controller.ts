import {
  NextFunction,
  Response,
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

import { AppError } from "../../cores/errors/AppError";

import {
  ResponseHandler,
} from "../../cores/responses/ResponseHandler";

export class BusinessController {
  private readonly service =
    new BusinessService();

  /**
   * Get authenticated user ID.
   *
   * Authentication is normally guaranteed by the
   * authenticate middleware, but we still fail safely
   * if the request reaches the controller without a user.
   */
  private getUserId(
    req: BusinessAuthRequest
  ): string {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(
        "Authentication required.",
        401,
        "UNAUTHORIZED"
      );
    }

    return userId;
  }

  /**
   * Validate and return business ID.
   *
   * Business IDs in the current Prisma schema are UUIDs.
   */
  private getBusinessId(
    req: BusinessAuthRequest
  ): string {
    const businessId =
      String(req.params.id ?? "").trim();

    if (!businessId) {
      throw new AppError(
        "Business ID is required.",
        400,
        "BUSINESS_ID_REQUIRED"
      );
    }

    return businessId;
  }

  /**
   * Create business.
   */
  create = async (
    req: BusinessAuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        this.getUserId(req);

      const data =
        createBusinessSchema.parse(
          req.body
        );

      const business =
        await this.service.create(
          userId,
          data
        );

      return ResponseHandler.created(
        res,
        "Business created successfully.",
        business
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all businesses owned by the
   * authenticated user.
   */
  getMine = async (
    req: BusinessAuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        this.getUserId(req);

      const businesses =
        await this.service.getMyBusinesses(
          userId
        );

      return ResponseHandler.success(
        res,
        "Businesses retrieved successfully.",
        businesses
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single business.
   */
  getById = async (
    req: BusinessAuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        this.getUserId(req);

      const businessId =
        this.getBusinessId(req);

      const business =
        await this.service.getById(
          userId,
          businessId
        );

      return ResponseHandler.success(
        res,
        "Business retrieved successfully.",
        business
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update business core information.
   */
  update = async (
    req: BusinessAuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        this.getUserId(req);

      const businessId =
        this.getBusinessId(req);

      const data =
        updateBusinessSchema.parse(
          req.body
        );

      const business =
        await this.service.update(
          userId,
          businessId,
          data
        );

      return ResponseHandler.success(
        res,
        "Business updated successfully.",
        business
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update public/business profile information.
   */
  updateProfile = async (
    req: BusinessAuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        this.getUserId(req);

      const businessId =
        this.getBusinessId(req);

      const data =
        updateBusinessProfileSchema.parse(
          req.body
        );

      const profile =
        await this.service.updateProfile(
          userId,
          businessId,
          data
        );

      return ResponseHandler.success(
        res,
        "Business profile updated successfully.",
        profile
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Soft-delete / deactivate business.
   */
  delete = async (
    req: BusinessAuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        this.getUserId(req);

      const businessId =
        this.getBusinessId(req);

      const result =
        await this.service.delete(
          userId,
          businessId
        );

      return ResponseHandler.success(
        res,
        result.message ??
          "Business deactivated successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  };
}