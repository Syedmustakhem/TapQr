import { AppError } from "../../cores/errors/AppError";

import {
  CreateVariantDTO,
  UpdateVariantDTO,
} from "./variant.types";

import {
  VariantRepository,
} from "./variant.repository";

import {
  CatalogItemRepository,
} from "./item.repository";

import {
  BusinessRepository,
} from "../business/business.repository";

export class VariantService {
  private variantRepository =
    new VariantRepository();

  private itemRepository =
    new CatalogItemRepository();

  private businessRepository =
    new BusinessRepository();

  /**
   * Create variant
   */
  async createVariant(
    data: CreateVariantDTO,
    ownerId: string
  ) {
    const item =
      await this.itemRepository.findById(
        data.itemId
      );

    if (!item) {
      throw new AppError(
        "Catalog item not found.",
        404
      );
    }

    const business =
      await this.businessRepository.findById(
        item.category.catalog.businessId
      );

    if (!business) {
      throw new AppError(
        "Business not found.",
        404
      );
    }

    if (
      business.ownerId !== ownerId
    ) {
      throw new AppError(
        "You are not authorized to manage this item.",
        403
      );
    }

    return this.variantRepository.create({
      item: {
        connect: {
          id: data.itemId,
        },
      },

      name: data.name,

      price: data.price,

      compareAtPrice:
        data.compareAtPrice,

      sku: data.sku,

      stock: data.stock,

      isAvailable:
        data.isAvailable ?? true,

      sortOrder:
        data.sortOrder ?? 0,
    });
  }

  /**
   * Get item variants
   */
  async getItemVariants(
    itemId: string,
    ownerId: string
  ) {
    const item =
      await this.itemRepository.findById(
        itemId
      );

    if (!item) {
      throw new AppError(
        "Catalog item not found.",
        404
      );
    }

    const business =
      await this.businessRepository.findById(
        item.category.catalog.businessId
      );

    if (!business) {
      throw new AppError(
        "Business not found.",
        404
      );
    }

    if (
      business.ownerId !== ownerId
    ) {
      throw new AppError(
        "You are not authorized to access this item.",
        403
      );
    }

    return this.variantRepository.findByItemId(
      itemId
    );
  }

  /**
   * Get one variant
   */
  async getVariant(
    id: string,
    ownerId: string
  ) {
    const variant =
      await this.variantRepository.findById(
        id
      );

    if (!variant) {
      throw new AppError(
        "Variant not found.",
        404
      );
    }

    const business =
      await this.businessRepository.findById(
        variant.item.category.catalog.businessId
      );

    if (!business) {
      throw new AppError(
        "Business not found.",
        404
      );
    }

    if (
      business.ownerId !== ownerId
    ) {
      throw new AppError(
        "You are not authorized to access this variant.",
        403
      );
    }

    return variant;
  }

  /**
   * Update variant
   */
  async updateVariant(
    data: UpdateVariantDTO,
    ownerId: string
  ) {
    const variant =
      await this.variantRepository.findById(
        data.id
      );

    if (!variant) {
      throw new AppError(
        "Variant not found.",
        404
      );
    }

    const business =
      await this.businessRepository.findById(
        variant.item.category.catalog.businessId
      );

    if (!business) {
      throw new AppError(
        "Business not found.",
        404
      );
    }

    if (
      business.ownerId !== ownerId
    ) {
      throw new AppError(
        "You are not authorized to update this variant.",
        403
      );
    }

    return this.variantRepository.update(
      data.id,
      {
        ...(data.name !== undefined && {
          name: data.name,
        }),

        ...(data.price !== undefined && {
          price: data.price,
        }),

        ...(data.compareAtPrice !==
          undefined && {
          compareAtPrice:
            data.compareAtPrice,
        }),

        ...(data.sku !== undefined && {
          sku: data.sku,
        }),

        ...(data.stock !== undefined && {
          stock: data.stock,
        }),

        ...(data.isAvailable !==
          undefined && {
          isAvailable:
            data.isAvailable,
        }),

        ...(data.sortOrder !==
          undefined && {
          sortOrder:
            data.sortOrder,
        }),
      }
    );
  }

  /**
   * Delete variant
   */
  async deleteVariant(
    id: string,
    ownerId: string
  ) {
    const variant =
      await this.variantRepository.findById(
        id
      );

    if (!variant) {
      throw new AppError(
        "Variant not found.",
        404
      );
    }

    const business =
      await this.businessRepository.findById(
        variant.item.category.catalog.businessId
      );

    if (!business) {
      throw new AppError(
        "Business not found.",
        404
      );
    }

    if (
      business.ownerId !== ownerId
    ) {
      throw new AppError(
        "You are not authorized to delete this variant.",
        403
      );
    }

    await this.variantRepository.delete(
      id
    );

    return {
      message:
        "Variant deleted successfully.",
    };
  }
}