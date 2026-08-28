import { Response } from "express";

import { AuthRequest } from "../auth/auth.types";

import { ResponseHandler } from "../../cores/responses/ResponseHandler";

import { CategoryService } from "./category.service";

export class CategoryController {
  private categoryService =
    new CategoryService();

  /**
   * Create category
   */
  createCategory = async (
    req: AuthRequest,
    res: Response
  ) => {
    const catalogId =
      String(req.params.catalogId);

    const result =
      await this.categoryService.createCategory({
        catalogId,

        ownerId:
          req.user!.id,

        ...req.body,
      });

    return ResponseHandler.created(
      res,
      "Category created successfully.",
      result
    );
  };

  /**
   * Get all categories for catalog
   */
  getCatalogCategories = async (
    req: AuthRequest,
    res: Response
  ) => {
    const catalogId =
      String(req.params.catalogId);

    const result =
      await this.categoryService
        .getCatalogCategories(
          catalogId,
          req.user!.id
        );

    return ResponseHandler.success(
      res,
      "Categories retrieved successfully.",
      result
    );
  };

  /**
   * Get category
   */
  getCategoryById = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.categoryService
        .getCategoryById(
          id,
          req.user!.id
        );

    return ResponseHandler.success(
      res,
      "Category retrieved successfully.",
      result
    );
  };

  /**
   * Update category
   */
  updateCategory = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.categoryService
        .updateCategory({
          id,

          ownerId:
            req.user!.id,

          ...req.body,
        });

    return ResponseHandler.success(
      res,
      "Category updated successfully.",
      result
    );
  };

  /**
   * Delete category
   */
  deleteCategory = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.categoryService
        .deleteCategory(
          id,
          req.user!.id
        );

    return ResponseHandler.success(
      res,
      result.message
    );
  };
}