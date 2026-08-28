import { AppError } from "../../cores/errors/AppError";

import {
  CreateOptionGroupDTO,
  UpdateOptionGroupDTO,
} from "./option-group.types";

import {
  OptionGroupRepository,
} from "./option-group.repository";

import {
  CatalogItemRepository,
} from "./item.repository";

import {
  BusinessRepository,
} from "../business/business.repository";

export class OptionGroupService {
  private repository =
    new OptionGroupRepository();

  private itemRepository =
    new CatalogItemRepository();

  private businessRepository =
    new BusinessRepository();

  /**
   * Verify item ownership
   */
  private async verifyOwnership(
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
        "You are not authorized to manage this item.",
        403
      );
    }

    return item;
  }

  /**
   * Create option group
   */
  async createOptionGroup(
    data: CreateOptionGroupDTO,
    ownerId: string
  ) {
    await this.verifyOwnership(
      data.itemId,
      ownerId
    );

    return this.repository.create({
      item: {
        connect: {
          id: data.itemId,
        },
      },

      name: data.name,

      required:
        data.required ?? false,

      minSelect:
        data.minSelect ?? 0,

      maxSelect:
        data.maxSelect ?? 1,

      sortOrder:
        data.sortOrder ?? 0,
    });
  }

  /**
   * Get item option groups
   */
  async getItemOptionGroups(
    itemId: string,
    ownerId: string
  ) {
    await this.verifyOwnership(
      itemId,
      ownerId
    );

    return this.repository.findByItemId(
      itemId
    );
  }

  /**
   * Get option group
   */
  async getOptionGroup(
    id: string,
    ownerId: string
  ) {
    const group =
      await this.repository.findById(
        id
      );

    if (!group) {
      throw new AppError(
        "Option group not found.",
        404
      );
    }

    await this.verifyOwnership(
      group.itemId,
      ownerId
    );

    return group;
  }

  /**
   * Update option group
   */
  async updateOptionGroup(
    data: UpdateOptionGroupDTO,
    ownerId: string
  ) {
    const group =
      await this.repository.findById(
        data.id
      );

    if (!group) {
      throw new AppError(
        "Option group not found.",
        404
      );
    }

    await this.verifyOwnership(
      group.itemId,
      ownerId
    );

    return this.repository.update(
      data.id,
      {
        ...(data.name !== undefined && {
          name: data.name,
        }),

        ...(data.required !==
          undefined && {
          required:
            data.required,
        }),

        ...(data.minSelect !==
          undefined && {
          minSelect:
            data.minSelect,
        }),

        ...(data.maxSelect !==
          undefined && {
          maxSelect:
            data.maxSelect,
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
   * Delete option group
   */
  async deleteOptionGroup(
    id: string,
    ownerId: string
  ) {
    const group =
      await this.repository.findById(
        id
      );

    if (!group) {
      throw new AppError(
        "Option group not found.",
        404
      );
    }

    await this.verifyOwnership(
      group.itemId,
      ownerId
    );

    await this.repository.delete(
      id
    );

    return {
      message:
        "Option group deleted successfully.",
    };
  }
}