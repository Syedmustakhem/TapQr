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

  /**
   * Valid campaign lifecycle transitions.
   *
   * DRAFT
   *   -> ACTIVE
   *   -> ARCHIVED
   *
   * ACTIVE
   *   -> PAUSED
   *   -> COMPLETED
   *   -> ARCHIVED
   *
   * PAUSED
   *   -> ACTIVE
   *   -> ARCHIVED
   *
   * COMPLETED
   *   -> ARCHIVED
   *
   * ARCHIVED
   *   -> terminal state
   */
  private validateStatusTransition(
    currentStatus: CampaignStatus,
    nextStatus: CampaignStatus
  ) {
    if (currentStatus === nextStatus) {
      return;
    }

    const allowedTransitions: Record<
      CampaignStatus,
      CampaignStatus[]
    > = {
      [CampaignStatus.DRAFT]: [
        CampaignStatus.ACTIVE,
        CampaignStatus.ARCHIVED,
      ],

      [CampaignStatus.ACTIVE]: [
        CampaignStatus.PAUSED,
        CampaignStatus.COMPLETED,
        CampaignStatus.ARCHIVED,
      ],

      [CampaignStatus.PAUSED]: [
        CampaignStatus.ACTIVE,
        CampaignStatus.ARCHIVED,
      ],

      [CampaignStatus.COMPLETED]: [
        CampaignStatus.ARCHIVED,
      ],

      [CampaignStatus.ARCHIVED]: [],
    };

    const allowed =
      allowedTransitions[currentStatus] ?? [];

    if (!allowed.includes(nextStatus)) {
      throw new AppError(
        `Invalid campaign status transition: ${currentStatus} -> ${nextStatus}`,
        400,
        "INVALID_CAMPAIGN_STATUS_TRANSITION"
      );
    }
  }

  /**
   * Validates the campaign's configured schedule.
   */
  private validateActivationSchedule(
    campaign: {
      startsAt: Date | null;
      endsAt: Date | null;
    }
  ) {
    if (
      campaign.startsAt &&
      campaign.endsAt &&
      campaign.endsAt < campaign.startsAt
    ) {
      throw new AppError(
        "Campaign end time cannot be before start time.",
        400,
        "INVALID_CAMPAIGN_SCHEDULE"
      );
    }
  }

  /**
   * Determines whether an ACTIVE campaign
   * is currently inside its configured time window.
   *
   * Rules:
   *
   * ACTIVE + no dates
   *   -> active
   *
   * ACTIVE + before startsAt
   *   -> not active
   *
   * ACTIVE + between dates
   *   -> active
   *
   * ACTIVE + after endsAt
   *   -> not active
   *
   * Any other status
   *   -> not active
   */
  private isCampaignCurrentlyActive(
    campaign: {
      status: CampaignStatus;
      startsAt: Date | null;
      endsAt: Date | null;
    },
    now: Date = new Date()
  ): boolean {
    if (
      campaign.status !==
      CampaignStatus.ACTIVE
    ) {
      return false;
    }

    if (
      campaign.startsAt &&
      now < campaign.startsAt
    ) {
      return false;
    }

    if (
      campaign.endsAt &&
      now > campaign.endsAt
    ) {
      return false;
    }

    return true;
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

    this.validateActivationSchedule({
      startsAt,
      endsAt,
    });

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

  /**
   * Returns the current availability/lifecycle
   * state of a campaign.
   */
  async getAvailability(
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

    const now = new Date();

    const currentlyActive =
      this.isCampaignCurrentlyActive(
        campaign,
        now
      );

    let reason:
      | "DRAFT"
      | "PAUSED"
      | "COMPLETED"
      | "ARCHIVED"
      | "NOT_STARTED"
      | "ENDED"
      | "ACTIVE" = "ACTIVE";

    if (
      campaign.status ===
      CampaignStatus.DRAFT
    ) {
      reason = "DRAFT";
    } else if (
      campaign.status ===
      CampaignStatus.PAUSED
    ) {
      reason = "PAUSED";
    } else if (
      campaign.status ===
      CampaignStatus.COMPLETED
    ) {
      reason = "COMPLETED";
    } else if (
      campaign.status ===
      CampaignStatus.ARCHIVED
    ) {
      reason = "ARCHIVED";
    } else if (
      campaign.startsAt &&
      now < campaign.startsAt
    ) {
      reason = "NOT_STARTED";
    } else if (
      campaign.endsAt &&
      now > campaign.endsAt
    ) {
      reason = "ENDED";
    }

    return {
      campaignId: campaign.id,
      status: campaign.status,
      currentlyActive,
      reason,
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
      checkedAt: now,
    };
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

  async getQRCodes(
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

    return this.repository.findQRCodesByCampaignId(
      campaignId
    );
  }

  async attachQRCode(
    ownerId: string,
    businessId: string,
    campaignId: string,
    qrCodeId: string
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

    const qrCode =
      await this.repository.findQRCodeById(
        qrCodeId
      );

    if (
      !qrCode ||
      qrCode.deletedAt
    ) {
      throw new AppError(
        "QR Code not found.",
        404,
        "QR_NOT_FOUND"
      );
    }

    if (
      qrCode.businessId !==
      businessId
    ) {
      throw new AppError(
        "QR Code does not belong to this business.",
        400,
        "QR_BUSINESS_MISMATCH"
      );
    }

    return this.repository.attachQRCodeToCampaign(
      qrCodeId,
      campaignId,
      campaign.name
    );
  }

  async detachQRCode(
    ownerId: string,
    businessId: string,
    campaignId: string,
    qrCodeId: string
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

    const qrCode =
      await this.repository.findQRCodeById(
        qrCodeId
      );

    if (
      !qrCode ||
      qrCode.deletedAt
    ) {
      throw new AppError(
        "QR Code not found.",
        404,
        "QR_NOT_FOUND"
      );
    }

    if (
      qrCode.businessId !==
      businessId
    ) {
      throw new AppError(
        "QR Code does not belong to this business.",
        400,
        "QR_BUSINESS_MISMATCH"
      );
    }

    if (
      qrCode.campaignId !==
      campaignId
    ) {
      throw new AppError(
        "QR Code is not assigned to this campaign.",
        400,
        "QR_CAMPAIGN_MISMATCH"
      );
    }

    return this.repository.detachQRCodeFromCampaign(
      qrCodeId
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

    /*
     * Validate the final schedule,
     * including existing values that
     * were not changed.
     */
    this.validateActivationSchedule({
      startsAt:
        updateData.startsAt !== undefined
          ? updateData.startsAt
          : campaign.startsAt,

      endsAt:
        updateData.endsAt !== undefined
          ? updateData.endsAt
          : campaign.endsAt,
    });

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

    /*
     * Validate lifecycle transition.
     */
    this.validateStatusTransition(
      campaign.status,
      data.status
    );

    /*
     * Validate schedule when activating.
     */
    if (
      data.status ===
      CampaignStatus.ACTIVE
    ) {
      this.validateActivationSchedule(
        campaign
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