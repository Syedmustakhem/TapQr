import {
  Prisma,
  CampaignStatus,
} from "@prisma/client";

import {
  prisma,
} from "../../config/prisma";

import {
  CampaignCreateData,
  CampaignStatusUpdateData,
  CampaignUpdateData,
} from "./campaign.types";

export class CampaignRepository {
  async create(
    data: CampaignCreateData
  ) {
    return prisma.campaign.create({
      data: {
        businessId:
          data.businessId,

        name:
          data.name,

        description:
          data.description ??
          undefined,

        startsAt:
          data.startsAt ??
          undefined,

        endsAt:
          data.endsAt ??
          undefined,
      },
    });
  }

  async findById(
    id: string
  ) {
    return prisma.campaign.findUnique({
      where: {
        id,
      },
    });
  }

  async findByBusinessId(
    businessId: string
  ) {
    return prisma.campaign.findMany({
      where: {
        businessId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async update(
    id: string,
    data: CampaignUpdateData
  ) {
    const updateData:
      Prisma.CampaignUpdateInput =
      {};

    if (
      data.name !== undefined
    ) {
      updateData.name =
        data.name;
    }

    if (
      data.description !== undefined
    ) {
      updateData.description =
        data.description;
    }

    if (
      data.startsAt !== undefined
    ) {
      updateData.startsAt =
        data.startsAt;
    }

    if (
      data.endsAt !== undefined
    ) {
      updateData.endsAt =
        data.endsAt;
    }

    return prisma.campaign.update({
      where: {
        id,
      },
      data: updateData,
    });
  }

  async updateStatus(
    id: string,
    data: CampaignStatusUpdateData
  ) {
    return prisma.campaign.update({
      where: {
        id,
      },
      data: {
        status:
          data.status,
      },
    });
  }
}