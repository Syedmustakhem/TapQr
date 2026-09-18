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
async findQRCodeById(qrCodeId: string) {
  return prisma.qRCode.findUnique({
    where: {
      id: qrCodeId,
    },
    select: {
      id: true,
      businessId: true,
      name: true,
      shortCode: true,
      status: true,
      campaignId: true,
      campaignName: true,
      deletedAt: true,
    },
  });
}

async findQRCodesByCampaignId(campaignId: string) {
  return prisma.qRCode.findMany({
    where: {
      campaignId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      businessId: true,
      name: true,
      shortCode: true,
      status: true,
      campaignId: true,
      campaignName: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async attachQRCodeToCampaign(
  qrCodeId: string,
  campaignId: string,
  campaignName: string
) {
  return prisma.qRCode.update({
    where: {
      id: qrCodeId,
    },
    data: {
      campaign: {
        connect: {
          id: campaignId,
        },
      },
      campaignName,
    },
    select: {
      id: true,
      businessId: true,
      name: true,
      shortCode: true,
      status: true,
      campaignId: true,
      campaignName: true,
    },
  });
}

async detachQRCodeFromCampaign(
  qrCodeId: string
) {
  return prisma.qRCode.update({
    where: {
      id: qrCodeId,
    },
    data: {
      campaign: {
        disconnect: true,
      },
      campaignName: null,
    },
    select: {
      id: true,
      businessId: true,
      name: true,
      shortCode: true,
      status: true,
      campaignId: true,
      campaignName: true,
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