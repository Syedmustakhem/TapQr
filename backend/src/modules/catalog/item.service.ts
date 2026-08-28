import { AppError } from "../../cores/errors/AppError";

import {
  CreateCatalogItemDTO,
  UpdateCatalogItemDTO,
} from "./item.types";

import {
  CatalogItemRepository,
} from "./item.repository";

import {
  CategoryRepository,
} from "./category.repository";

import {
  BusinessRepository,
} from "../business/business.repository";

export class CatalogItemService {
  private itemRepository =
    new CatalogItemRepository();

  private categoryRepository =
    new CategoryRepository();

  private businessRepository =
    new BusinessRepository();

  /**
   * Create catalog item
   */
  async createItem(
    data: CreateCatalogItemDTO,
    ownerId: string
  ) {
    const category =
      await this.categoryRepository.findById(
        data.categoryId
      );

    if (!category) {
      throw new AppError(
        "Category not found.",
        404
      );
    }

    const business =
      await this.businessRepository.findById(
        category.catalog.businessId
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
        "You are not authorized to add items to this catalog.",
        403
      );
    }

    return this.itemRepository.create({
      category: {
        connect: {
          id: data.categoryId,
        },
      },

      name: data.name,

      description: data.description,

      type: data.type as any,

      price: data.price,

      compareAtPrice:
        data.compareAtPrice,

      currency:
        data.currency ?? "INR",

      image: data.image,

      gallery: data.gallery as any,

      sku: data.sku,

      unit: data.unit,

      stock: data.stock,

      durationMinutes:
        data.durationMinutes,

      isAvailable:
        data.isAvailable ?? true,

      isFeatured:
        data.isFeatured ?? false,

      sortOrder:
        data.sortOrder ?? 0,

      metadata: data.metadata as any,
    });
  }

  /**
   * Get category items
   */
  async getCategoryItems(
    categoryId: string,
    ownerId: string
  ) {
    const category =
      await this.categoryRepository.findById(
        categoryId
      );

    if (!category) {
      throw new AppError(
        "Category not found.",
        404
      );
    }

    const business =
      await this.businessRepository.findById(
        category.catalog.businessId
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
        "You are not authorized to access this category.",
        403
      );
    }

    return this.itemRepository.findByCategoryId(
      categoryId
    );
  }

  /**
   * Get single item
   */
  async getItem(
    id: string,
    ownerId: string
  ) {
    const item =
      await this.itemRepository.findById(
        id
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

    return item;
  }

  /**
   * Update item
   */
  async updateItem(
    data: UpdateCatalogItemDTO,
    ownerId: string
  ) {
    const item =
      await this.itemRepository.findById(
        data.id
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
        "You are not authorized to update this item.",
        403
      );
    }

    return this.itemRepository.update(
      data.id,
      {
        ...(data.name !== undefined && {
          name: data.name,
        }),

        ...(data.description !==
          undefined && {
          description:
            data.description,
        }),

        ...(data.type !== undefined && {
          type: data.type as any,
        }),

        ...(data.price !== undefined && {
          price: data.price,
        }),

        ...(data.compareAtPrice !==
          undefined && {
          compareAtPrice:
            data.compareAtPrice,
        }),

        ...(data.currency !==
          undefined && {
          currency: data.currency,
        }),

        ...(data.image !== undefined && {
          image: data.image,
        }),

        ...(data.gallery !== undefined && {
          gallery:
            data.gallery as any,
        }),

        ...(data.sku !== undefined && {
          sku: data.sku,
        }),

        ...(data.unit !== undefined && {
          unit: data.unit,
        }),

        ...(data.stock !== undefined && {
          stock: data.stock,
        }),

        ...(data.durationMinutes !==
          undefined && {
          durationMinutes:
            data.durationMinutes,
        }),

        ...(data.isAvailable !==
          undefined && {
          isAvailable:
            data.isAvailable,
        }),

        ...(data.isFeatured !==
          undefined && {
          isFeatured:
            data.isFeatured,
        }),

        ...(data.sortOrder !==
          undefined && {
          sortOrder:
            data.sortOrder,
        }),

        ...(data.metadata !== undefined && {
          metadata:
            data.metadata as any,
        }),
      }
    );
  }

  /**
   * Soft delete item
   */
  async deleteItem(
    id: string,
    ownerId: string
  ) {
    const item =
      await this.itemRepository.findById(
        id
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
        "You are not authorized to delete this item.",
        403
      );
    }

    await this.itemRepository.softDelete(
      id
    );

    return {
      message:
        "Catalog item deleted successfully.",
    };
  }
}