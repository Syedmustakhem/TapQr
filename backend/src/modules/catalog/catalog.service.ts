import { AppError } from "../../cores/errors/AppError";

import { CatalogRepository } from "./catalog.repository";

import {
  CreateCatalogDTO,
  UpdateCatalogDTO,
} from "./catalog.types";

import { BusinessRepository } from "../business/business.repository";

export class CatalogService {
  private catalogRepository =
    new CatalogRepository();

  private businessRepository =
    new BusinessRepository();

  /**
   * Verify that the user owns the business.
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
   * Create catalog
   */
  async createCatalog(
    data: CreateCatalogDTO
  ) {
    await this.verifyBusinessOwnership(
      data.businessId,
      data.ownerId
    );

    return this.catalogRepository.create({
      business: {
        connect: {
          id: data.businessId,
        },
      },

      name: data.name,

      description:
        data.description,

      type: data.type,

      isActive: true,

      sortOrder: 0,
    });
  }

  /**
   * Get all catalogs of a business
   */
  async getBusinessCatalogs(
    businessId: string,
    ownerId: string
  ) {
    await this.verifyBusinessOwnership(
      businessId,
      ownerId
    );

    return this.catalogRepository
      .findByBusinessId(
        businessId
      );
  }

  /**
   * Get one catalog
   */
  async getCatalogById(
    id: string,
    ownerId: string
  ) {
    const catalog =
      await this.catalogRepository.findById(
        id
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
   * Update catalog
   */
  async updateCatalog(
    data: UpdateCatalogDTO
  ) {
    const catalog =
      await this.catalogRepository.findById(
        data.id
      );

    if (!catalog) {
      throw new AppError(
        "Catalog not found.",
        404
      );
    }

    await this.verifyBusinessOwnership(
      catalog.businessId,
      data.ownerId
    );

    return this.catalogRepository.update(
      data.id,
      {
        ...(data.name !== undefined && {
          name: data.name,
        }),

        ...(data.description !== undefined && {
          description: data.description,
        }),

        ...(data.type !== undefined && {
          type: data.type,
        }),

        ...(data.isActive !== undefined && {
          isActive: data.isActive,
        }),

        ...(data.sortOrder !== undefined && {
          sortOrder: data.sortOrder,
        }),
      }
    );
  }

  /**
   * Delete catalog
   */
  async deleteCatalog(
    id: string,
    ownerId: string
  ) {
    const catalog =
      await this.catalogRepository.findById(
        id
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

    await this.catalogRepository.delete(
      id
    );

    return {
      message:
        "Catalog deleted successfully.",
    };
  }
}