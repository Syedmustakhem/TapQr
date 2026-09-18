import {
  CampaignStatus,
} from "@prisma/client";

import {
  CampaignRepository,
} from "./campaign.repository";

import {
  BusinessRepository,
} from "../business/business.repository";

import {
  AppError,
} from "../../cores/errors/AppError";

import {
  CreateCampaignDTO,
  UpdateCampaignDTO,
  UpdateCampaignStatusDTO,
} from "./campaign.types";

import {
  mapCampaign,
} from "./campaign.mapper";

export class CampaignService {
  private readonly repository =
    new CampaignRepository();

  private readonly businessRepository =
    new BusinessRepository();

  private async getOwnedBusiness(
    ownerId: string,
    businessId: string
  ) {
    const business =
      await this.businessRepository.findById(
        businessId
      );

    if (
      !business ||
      business.deletedAt
    ) {
      throw new AppError(
        "Business not found.",
        404,
        "BUSINESS_NOT_FOUND"
      );
    }

    if (
      business.ownerId !==
      ownerId
    ) {
      throw new AppError(
        "You do not have access to this business.",
        403,
        "BUSINESS_ACCESS_DENIED"
      );
    }

    return business;
  }

  async create(
    ownerId: string,
    businessId: string,
    data: CreateCampaignDTO
  ) {
    await this.getOwnedBusiness(
      ownerId,
      businessId
    );

    const startsAt =
      data.startsAt
        ? new Date(data.startsAt)
        : null;

    const endsAt =
      data.endsAt
        ? new Date(data.endsAt)
        : null;

    const campaign =
      await this.repository.create({
        businessId,
        name: data.name.trim(),
        description:
          data.description
            ?.trim() ?? null,
        startsAt,
        endsAt,
      });

    return mapCampaign(
      campaign
    );
  }

  async getById(
    ownerId: string,
    businessId: string,
    campaignId: string
  ) {
    await this.getOwnedBusiness(
      ownerId,
      businessId
    );

    const campaign =
      await this.repository.findById(
        campaignId
      );

    if (
      !campaign ||
      campaign.businessId !==
        businessId
    ) {
      throw new AppError(
        "Campaign not found.",
        404,
        "CAMPAIGN_NOT_FOUND"
      );
    }

    return mapCampaign(
      campaign
    );
  }

  async getByBusinessId(
    ownerId: string,
    businessId: string
  ) {
    await this.getOwnedBusiness(
      ownerId,
      businessId
    );

    const campaigns =
      await this.repository.findByBusinessId(
        businessId
      );

    return campaigns.map(
      mapCampaign
    );
  }

  async update(
    ownerId: string,
    businessId: string,
    campaignId: string,
    data: UpdateCampaignDTO
  ) {
    await this.getOwnedBusiness(
      ownerId,
      businessId
    );

    const campaign =
      await this.repository.findById(
        campaignId
      );

    if (
      !campaign ||
      campaign.businessId !==
        businessId
    ) {
      throw new AppError(
        "Campaign not found.",
        404,
        "CAMPAIGN_NOT_FOUND"
      );
    }

    const updateData: {
      name?: string;
      description?: string | null;
      startsAt?: Date | null;
      endsAt?: Date | null;
    } = {};

    if (
      data.name !== undefined
    ) {
      updateData.name =
        data.name.trim();
    }

    if (
      data.description !==
      undefined
    ) {
      updateData.description =
        data.description === null
          ? null
          : data.description.trim();
    }

    if (
      data.startsAt !==
      undefined
    ) {
      updateData.startsAt =
        data.startsAt === null
          ? null
          : new Date(data.startsAt);
    }

    if (
      data.endsAt !==
      undefined
    ) {
      updateData.endsAt =
        data.endsAt === null
          ? null
          : new Date(data.endsAt);
    }

    const updated =
      await this.repository.update(
        campaignId,
        updateData
      );

    return mapCampaign(
      updated
    );
  }

  async updateStatus(
    ownerId: string,
    businessId: string,
    campaignId: string,
    data: UpdateCampaignStatusDTO
  ) {
    await this.getOwnedBusiness(
      ownerId,
      businessId
    );

    const campaign =
      await this.repository.findById(
        campaignId
      );

    if (
      !campaign ||
      campaign.businessId !==
        businessId
    ) {
      throw new AppError(
        "Campaign not found.",
        404,
        "CAMPAIGN_NOT_FOUND"
      );
    }

    const updated =
      await this.repository.updateStatus(
        campaignId,
        {
          status:
            data.status,
        }
      );

    return mapCampaign(
      updated
    );
  }
}