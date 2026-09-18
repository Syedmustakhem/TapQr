/**
 * Campaign DTOs
 *
 * DTOs define the API/service contract.
 * Database models must not be exposed directly
 * through the API contract.
 */

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
  status:
    | "DRAFT"
    | "ACTIVE"
    | "PAUSED"
    | "COMPLETED"
    | "ARCHIVED";
}

export interface CampaignSummaryDTO {
  id: string;
  businessId: string;

  name: string;
  description: string | null;

  status: string;

  startsAt: Date | null;
  endsAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}