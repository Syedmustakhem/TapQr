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
  CatalogItemService,
} from "./item.service";

export class CatalogItemController {
  private service =
    new CatalogItemService();

  /**
   * Create item
   */
  createItem = async (
    req: AuthRequest,
    res: Response
  ) => {
    const result =
      await this.service.createItem(
        req.body,
        req.user!.id
      );

    return ResponseHandler.created(
      res,
      "Catalog item created successfully.",
      result
    );
  };

  /**
   * Get category items
   */
  getCategoryItems = async (
    req: AuthRequest,
    res: Response
  ) => {
    const categoryId =
      String(req.params.categoryId);

    const result =
      await this.service.getCategoryItems(
        categoryId,
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "Catalog items retrieved successfully.",
      result
    );
  };

  /**
   * Get item
   */
  getItem = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.service.getItem(
        id,
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "Catalog item retrieved successfully.",
      result
    );
  };

  /**
   * Update item
   */
  updateItem = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.service.updateItem(
        {
          id,
          ...req.body,
        },
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "Catalog item updated successfully.",
      result
    );
  };

  /**
   * Delete item
   */
  deleteItem = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.service.deleteItem(
        id,
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      result.message
    );
  };
}