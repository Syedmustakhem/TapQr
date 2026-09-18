import {
  CampaignStatus,
} from "@prisma/client";

export interface CampaignSummaryDTO {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function mapCampaign(
  campaign: any
): CampaignSummaryDTO {
  return {
    id: campaign.id,
    businessId:
      campaign.businessId,
    name: campaign.name,
    description:
      campaign.description,
    status: campaign.status,
    startsAt:
      campaign.startsAt,
    endsAt:
      campaign.endsAt,
    createdAt:
      campaign.createdAt,
    updatedAt:
      campaign.updatedAt,
  };
}