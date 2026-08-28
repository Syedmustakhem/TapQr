import {
  Response,
} from "express";

import {
  AuthRequest,
} from "../auth/auth.types";

import {
  ResponseHandler,
} from "../../cores/responses/ResponseHandler";

import {
  CatalogService,
} from "./catalog.service";

export class CatalogController {
  private catalogService =
    new CatalogService();

  /**
   * Create catalog
   */
  createCatalog = async (
    req: AuthRequest,
    res: Response
  ) => {
    const businessId =
      String(req.params.businessId);

    const result =
      await this.catalogService.createCatalog({
        businessId,

        ownerId:
          req.user!.id,

        ...req.body,
      });

    return ResponseHandler.created(
      res,
      "Catalog created successfully.",
      result
    );
  };

  /**
   * Get business catalogs
   */
  getBusinessCatalogs = async (
    req: AuthRequest,
    res: Response
  ) => {
    const businessId =
      String(req.params.businessId);

    const result =
      await this.catalogService
        .getBusinessCatalogs(
          businessId,
          req.user!.id
        );

    return ResponseHandler.success(
      res,
      "Catalogs retrieved successfully.",
      result
    );
  };

  /**
   * Get catalog
   */
  getCatalogById = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.catalogService
        .getCatalogById(
          id,
          req.user!.id
        );

    return ResponseHandler.success(
      res,
      "Catalog retrieved successfully.",
      result
    );
  };

  /**
   * Update catalog
   */
  updateCatalog = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.catalogService
        .updateCatalog({
          id,

          ownerId:
            req.user!.id,

          ...req.body,
        });

    return ResponseHandler.success(
      res,
      "Catalog updated successfully.",
      result
    );
  };

  /**
   * Delete catalog
   */
  deleteCatalog = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.catalogService
        .deleteCatalog(
          id,
          req.user!.id
        );

    return ResponseHandler.success(
      res,
      result.message
    );
  };
}