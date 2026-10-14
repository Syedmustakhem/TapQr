// src/api/staffApi.ts
//
// Staff & Access endpoints, mirroring the TapQR web
// dashboard staff page (app/dashboard/staff calls these
// exact paths against https://api.tapqr.shop/api).
//
// Uses the shared authenticated axios instance from
// authApi.ts (Bearer token + 401 refresh interceptors).

import api from "./authApi";

export type MemberRole =
  | "OWNER"
  | "MANAGER"
  | "STAFF";

export type MemberStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "REMOVED";

export type InvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

export type StaffMember = {
  id: string;
  userId: string;
  businessId: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
    isActive?: boolean;
  };
};

export type StaffInvitation = {
  id: string;
  businessId?: string;
  email: string;
  role: MemberRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt?: string;
  acceptedAt?: string | null;
  business?: {
    id: string;
    name?: string;
    slug?: string;
  };
  invitedBy?: {
    id: string;
    fullName?: string | null;
    email?: string | null;
  };
};

export type PaginatedMembers = {
  members: StaffMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PaginatedInvitations = {
  invitations: StaffInvitation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export type MembersQuery = {
  page?: number;
  limit?: number;
  search?: string;
  role?: MemberRole | "";
  status?: MemberStatus | "";
};

export type InvitationsQuery = {
  page?: number;
  limit?: number;
  status?: InvitationStatus | "";
};

const EMPTY_MEMBERS: PaginatedMembers = {
  members: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
};

const EMPTY_INVITATIONS: PaginatedInvitations =
  {
    invitations: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  };

/**
 * GET /staff/businesses/:businessId/members?page=&limit=&search=&role=&status=
 */
export async function getStaffMembers(
  businessId: string,
  query: MembersQuery = {}
): Promise<PaginatedMembers> {
  const res =
    await api.get<Envelope<PaginatedMembers>>(
      `/staff/businesses/${businessId}/members`,
      {
        params: {
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          search: query.search || undefined,
          role: query.role || undefined,
          status:
            query.status || undefined,
        },
      }
    );

  return res.data?.data ?? EMPTY_MEMBERS;
}

/**
 * GET /staff/businesses/:businessId/invitations?page=&limit=&status=
 */
export async function getStaffInvitations(
  businessId: string,
  query: InvitationsQuery = {}
): Promise<PaginatedInvitations> {
  const res =
    await api.get<
      Envelope<PaginatedInvitations>
    >(
      `/staff/businesses/${businessId}/invitations`,
      {
        params: {
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          status:
            query.status || undefined,
        },
      }
    );

  return res.data?.data ?? EMPTY_INVITATIONS;
}

/**
 * POST /staff/businesses/:businessId/invitations — invite a
 * new team member. The web dashboard sends { email, role }.
 */
export async function inviteStaffMember(
  businessId: string,
  input: {
    email: string;
    role: MemberRole;
  }
): Promise<StaffInvitation> {
  const res =
    await api.post<
      Envelope<StaffInvitation>
    >(
      `/staff/businesses/${businessId}/invitations`,
      input
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to send the invitation."
    );
  }

  return res.data.data;
}

/**
 * PATCH /staff/businesses/:businessId/members/:memberId/role —
 * change a member's role. The web dashboard sends { role }
 * (MANAGER or STAFF; OWNER is not assignable from the UI).
 */
export async function updateMemberRole(
  businessId: string,
  memberId: string,
  role: "MANAGER" | "STAFF"
): Promise<StaffMember> {
  const res =
    await api.patch<Envelope<StaffMember>>(
      `/staff/businesses/${businessId}/members/${memberId}/role`,
      { role }
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to update the member's role."
    );
  }

  return res.data.data;
}

/**
 * PATCH /staff/businesses/:businessId/members/:memberId/status —
 * suspend or reactivate a member. The web dashboard sends
 * { status: "SUSPENDED" } to suspend and { status: "ACTIVE" }
 * to reactivate.
 */
export async function updateMemberStatus(
  businessId: string,
  memberId: string,
  status: "ACTIVE" | "SUSPENDED"
): Promise<StaffMember> {
  const res =
    await api.patch<Envelope<StaffMember>>(
      `/staff/businesses/${businessId}/members/${memberId}/status`,
      { status }
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to update the member's status."
    );
  }

  return res.data.data;
}

/**
 * DELETE /staff/businesses/:businessId/members/:memberId —
 * remove a member from the business.
 */
export async function removeMember(
  businessId: string,
  memberId: string
): Promise<void> {
  await api.delete(
    `/staff/businesses/${businessId}/members/${memberId}`
  );
}

/**
 * POST /staff/businesses/:businessId/invitations/:invitationId/resend
 */
export async function resendInvitation(
  businessId: string,
  invitationId: string
): Promise<void> {
  await api.post(
    `/staff/businesses/${businessId}/invitations/${invitationId}/resend`
  );
}

/**
 * POST /staff/businesses/:businessId/invitations/:invitationId/cancel —
 * revoke a pending invitation.
 */
export async function cancelInvitation(
  businessId: string,
  invitationId: string
): Promise<void> {
  await api.post(
    `/staff/businesses/${businessId}/invitations/${invitationId}/cancel`
  );
}
