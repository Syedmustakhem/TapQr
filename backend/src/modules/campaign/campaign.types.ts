import {
  Request,
} from "express";

import {
  CampaignStatus,
} from "@prisma/client";

export interface CampaignAuthRequest
  extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export interface CreateCampaignDTO {
  name: string;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface UpdateCampaignDTO {
  name?: string;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface UpdateCampaignStatusDTO {
  status: CampaignStatus;
}

export interface CampaignCreateData {
  businessId: string;
  name: string;
  description?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
}

export interface CampaignUpdateData {
  name?: string;
  description?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
}

export interface CampaignStatusUpdateData {
  status: CampaignStatus;
}