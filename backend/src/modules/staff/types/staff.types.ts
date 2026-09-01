import { Request } from "express";
import {
  BusinessMemberRole,
  BusinessMemberStatus,
  InvitationStatus,
} from "@prisma/client";

export interface StaffAuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export interface StaffPaginationQuery {
  page: number;
  limit: number;
  search?: string;
  role?: BusinessMemberRole;
  status?: BusinessMemberStatus;
}

export interface InvitationPaginationQuery {
  page: number;
  limit: number;
  status?: InvitationStatus;
}

export interface InviteStaffInput {
  actorId: string;
  businessId: string;
  email: string;
  role: BusinessMemberRole;
}

export interface AcceptInvitationInput {
  userId: string;
  token: string;
}

export interface UpdateMemberRoleInput {
  actorId: string;
  businessId: string;
  memberId: string;
  role: BusinessMemberRole;
}

export interface UpdateMemberStatusInput {
  actorId: string;
  businessId: string;
  memberId: string;
  status: BusinessMemberStatus;
}

export interface RemoveMemberInput {
  actorId: string;
  businessId: string;
  memberId: string;
}

export interface CancelInvitationInput {
  actorId: string;
  businessId: string;
  invitationId: string;
}

export interface ResendInvitationInput {
  actorId: string;
  businessId: string;
  invitationId: string;
}
