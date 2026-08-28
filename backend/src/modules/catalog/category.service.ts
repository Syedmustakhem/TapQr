import { AppError } from "../../cores/errors/AppError";

import { BusinessRepository } from "../business/business.repository";

import { CatalogRepository } from "./catalog.repository";

import { CategoryRepository } from "./category.repository";

import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from "./category.types";

export class CategoryService {
  private categoryRepository =
    new CategoryRepository();

  private catalogRepository =
    new CatalogRepository();

  private businessRepository =
    new BusinessRepository();

  /**
   * Verify that the authenticated user
   * owns the business.
   */
  private async verifyBusinessOwnership(
    businessId: string,
    ownerId: string
  ) {
    const business =
      await this.businessRepository.findById(
        businessId
      );

    if (!business) {
      throw new AppError(
        "Business not found.",
        404
      );
    }

    if (business.ownerId !== ownerId) {
      throw new AppError(
        "You are not authorized to manage this business.",
        403
      );
    }

    return business;
  }

  /**
   * Get catalog and verify ownership.
   */
  private async getAuthorizedCatalog(
    catalogId: string,
    ownerId: string
  ) {
    const catalog =
      await this.catalogRepository.findById(
        catalogId
      );

    if (!catalog) {
      throw new AppError(
        "Catalog not found.",
        404
      );
    }

    await this.verifyBusinessOwnership(
      catalog.businessId,
      ownerId
    );

    return catalog;
  }

  /**
   * Create category.
   */
  async createCategory(
    data: CreateCategoryDTO
  ) {
    await this.getAuthorizedCatalog(
      data.catalogId,
      data.ownerId
    );

    return this.categoryRepository.create({
      catalog: {
        connect: {
          id: data.catalogId,
        },
      },

      name: data.name,

      description:
        data.description,

      image: data.image,

      isActive: true,

      sortOrder: 0,
    });
  }

  /**
   * Get all categories for a catalog.
   */
  async getCatalogCategories(
    catalogId: string,
    ownerId: string
  ) {
    await this.getAuthorizedCatalog(
      catalogId,
      ownerId
    );

    return this.categoryRepository
      .findByCatalogId(
        catalogId
      );
  }

  /**
   * Get one category.
   */
  async getCategoryById(
    id: string,
    ownerId: string
  ) {
    const category =
      await this.categoryRepository.findById(
        id
      );

    if (!category) {
      throw new AppError(
        "Category not found.",
        404
      );
    }

    await this.verifyBusinessOwnership(
      category.catalog.businessId,
      ownerId
    );

    return category;
  }

  /**
   * Update category.
   */
  async updateCategory(
    data: UpdateCategoryDTO
  ) {
    const category =
      await this.categoryRepository.findById(
        data.id
      );

    if (!category) {
      throw new AppError(
        "Category not found.",
        404
      );
    }

    await this.verifyBusinessOwnership(
      category.catalog.businessId,
      data.ownerId
    );

    return this.categoryRepository.update(
      data.id,
      {
        ...(data.name !== undefined && {
          name: data.name,
        }),

        ...(data.description !== undefined && {
          description:
            data.description,
        }),

        ...(data.image !== undefined && {
          image: data.image,
        }),

        ...(data.isActive !== undefined && {
          isActive:
            data.isActive,
        }),

        ...(data.sortOrder !== undefined && {
          sortOrder:
            data.sortOrder,
        }),
      }
    );
  }

  /**
   * Soft delete category.
   */
  async deleteCategory(
    id: string,
    ownerId: string
  ) {
    const category =
      await this.categoryRepository.findById(
        id
      );

    if (!category) {
      throw new AppError(
        "Category not found.",
        404
      );
    }

    await this.verifyBusinessOwnership(
      category.catalog.businessId,
      ownerId
    );

    await this.categoryRepository.softDelete(
      id
    );

    return {
      message:
        "Category deleted successfully.",
    };
  }
}