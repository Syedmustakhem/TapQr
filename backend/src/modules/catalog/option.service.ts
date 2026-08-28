import { AppError } from "../../cores/errors/AppError";

import {
  CreateOptionDTO,
  UpdateOptionDTO,
} from "./option.types";

import {
  OptionRepository,
} from "./option.repository";

import {
  OptionGroupRepository,
} from "./option-group.repository";

import {
  BusinessRepository,
} from "../business/business.repository";

export class OptionService {
  private repository =
    new OptionRepository();

  private groupRepository =
    new OptionGroupRepository();

  private businessRepository =
    new BusinessRepository();

  /**
   * Verify ownership through group → item → catalog → business
   */
  private async verifyOwnership(
    groupId: string,
    ownerId: string
  ) {
    const group =
      await this.groupRepository.findById(
        groupId
      );

    if (!group) {
      throw new AppError(
        "Option group not found.",
        404
      );
    }

    const business =
      await this.businessRepository.findById(
        group.item.category.catalog.businessId
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
        "You are not authorized to manage this option group.",
        403
      );
    }

    return group;
  }

  /**
   * Create option
   */
  async createOption(
    data: CreateOptionDTO,
    ownerId: string
  ) {
    await this.verifyOwnership(
      data.groupId,
      ownerId
    );

    return this.repository.create({
      group: {
        connect: {
          id: data.groupId,
        },
      },

      name: data.name,

      price: data.price ?? 0,

      isAvailable:
        data.isAvailable ?? true,

      sortOrder:
        data.sortOrder ?? 0,
    });
  }

  /**
   * Get group options
   */
  async getGroupOptions(
    groupId: string,
    ownerId: string
  ) {
    await this.verifyOwnership(
      groupId,
      ownerId
    );

    return this.repository.findByGroupId(
      groupId
    );
  }

  /**
   * Get option
   */
  async getOption(
    id: string,
    ownerId: string
  ) {
    const option =
      await this.repository.findById(
        id
      );

    if (!option) {
      throw new AppError(
        "Option not found.",
        404
      );
    }

    await this.verifyOwnership(
      option.groupId,
      ownerId
    );

    return option;
  }

  /**
   * Update option
   */
  async updateOption(
    data: UpdateOptionDTO,
    ownerId: string
  ) {
    const option =
      await this.repository.findById(
        data.id
      );

    if (!option) {
      throw new AppError(
        "Option not found.",
        404
      );
    }

    await this.verifyOwnership(
      option.groupId,
      ownerId
    );

    return this.repository.update(
      data.id,
      {
        ...(data.name !== undefined && {
          name: data.name,
        }),

        ...(data.price !== undefined && {
          price: data.price,
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
   * Delete option
   */
  async deleteOption(
    id: string,
    ownerId: string
  ) {
    const option =
      await this.repository.findById(
        id
      );

    if (!option) {
      throw new AppError(
        "Option not found.",
        404
      );
    }

    await this.verifyOwnership(
      option.groupId,
      ownerId
    );

    await this.repository.delete(
      id
    );

    return {
      message:
        "Option deleted successfully.",
    };
  }
}