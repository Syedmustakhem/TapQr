import crypto from "crypto";

import {
  BusinessMemberRole,
  BusinessMemberStatus,
  InvitationStatus,
} from "@prisma/client";

import { prisma } from "../../../config/prisma";

import { AppError } from "../../../cores/errors/AppError";

import { AuthRepository } from "../../auth/auth.repository";
import { BusinessRepository } from "../../business/business.repository";

import { BusinessMemberRepository } from "../repositories/business-member.repository";
import { BusinessInvitationRepository } from "../repositories/business-invitation.repository";

import {
  InvitationPaginationQuery,
  InviteStaffInput,
  AcceptInvitationInput,
  StaffPaginationQuery,
  UpdateMemberRoleInput,
  UpdateMemberStatusInput,
  RemoveMemberInput,
  CancelInvitationInput,
  ResendInvitationInput,
} from "../types/staff.types";

type ActorRole =
  | "OWNER"
  | "MANAGER"
  | "STAFF";

const INVITATION_TTL_DAYS = 7;

function normalizeEmail(
  email: string
) {
  return email.trim().toLowerCase();
}

function createRawInvitationToken() {
  return crypto
    .randomBytes(32)
    .toString("hex");
}

/*
 * New invitations store a deterministic HMAC digest instead of the
 * raw token. The raw token should be delivered only through email.
 *
 * Existing plaintext invitation tokens remain readable because the
 * repository still supports direct lookup; new records are hashed.
 */
function hashInvitationToken(
  token: string
) {
  const secret =
    process.env
      .INVITATION_TOKEN_SECRET ||
    process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError(
      "Invitation token security is not configured.",
      500,
      "INVITATION_TOKEN_SECRET_MISSING"
    );
  }

  return crypto
    .createHmac(
      "sha256",
      secret
    )
    .update(token)
    .digest("hex");
}

function invitationExpiry() {
  const date = new Date();

  date.setUTCDate(
    date.getUTCDate() +
      INVITATION_TTL_DAYS
  );

  return date;
}

export class StaffService {
  private readonly authRepository =
    new AuthRepository();

  private readonly businessRepository =
    new BusinessRepository();

  private readonly businessMemberRepository =
    new BusinessMemberRepository();

  private readonly businessInvitationRepository =
    new BusinessInvitationRepository();

  /*
  |--------------------------------------------------------------------------
  | ACCESS CONTROL
  |--------------------------------------------------------------------------
  */

  private async getBusiness(
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
      business.status !== "ACTIVE"
    ) {
      throw new AppError(
        "This business is not active.",
        403,
        "BUSINESS_NOT_ACTIVE"
      );
    }

    return business;
  }

  private async getActorRole(
    userId: string,
    businessId: string
  ): Promise<ActorRole> {
    const business =
      await this.getBusiness(
        businessId
      );

    if (
      business.ownerId === userId
    ) {
      return BusinessMemberRole.OWNER;
    }

    const member =
      await this.businessMemberRepository.findByUserAndBusiness(
        userId,
        businessId
      );

    if (
      !member ||
      member.status !==
        BusinessMemberStatus.ACTIVE
    ) {
      throw new AppError(
        "You do not have access to this business.",
        403,
        "BUSINESS_ACCESS_DENIED"
      );
    }

    return member.role as ActorRole;
  }

  private assertCanManageTeam(
    actorRole: ActorRole
  ) {
    if (
      actorRole !==
        BusinessMemberRole.OWNER &&
      actorRole !==
        BusinessMemberRole.MANAGER
    ) {
      throw new AppError(
        "You do not have permission to manage team members.",
        403,
        "STAFF_MANAGEMENT_FORBIDDEN"
      );
    }
  }

  private assertCanManageTarget(
    actorRole: ActorRole,
    targetRole: BusinessMemberRole
  ) {
    if (
      targetRole ===
      BusinessMemberRole.OWNER
    ) {
      throw new AppError(
        "The business owner cannot be modified through staff management.",
        403,
        "OWNER_IMMUTABLE"
      );
    }

    if (
      actorRole ===
        BusinessMemberRole.MANAGER &&
      targetRole ===
        BusinessMemberRole.MANAGER
    ) {
      throw new AppError(
        "Managers cannot manage other managers.",
        403,
        "MANAGER_SCOPE_FORBIDDEN"
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | INVITATIONS
  |--------------------------------------------------------------------------
  */

  async inviteStaff(
    data: InviteStaffInput
  ) {
    const actorRole =
      await this.getActorRole(
        data.actorId,
        data.businessId
      );

    this.assertCanManageTeam(
      actorRole
    );

    if (
      data.role ===
      BusinessMemberRole.OWNER
    ) {
      throw new AppError(
        "OWNER cannot be assigned through a staff invitation.",
        400,
        "INVALID_MEMBER_ROLE"
      );
    }

    if (
      actorRole ===
        BusinessMemberRole.MANAGER &&
      data.role ===
        BusinessMemberRole.MANAGER
    ) {
      throw new AppError(
        "Managers can invite staff only.",
        403,
        "MANAGER_INVITE_SCOPE_FORBIDDEN"
      );
    }

    const email =
      normalizeEmail(
        data.email
      );

    const actor =
      await this.authRepository.findUserById(
        data.actorId
      );

    if (
      actor?.email &&
      normalizeEmail(actor.email) ===
        email
    ) {
      throw new AppError(
        "You cannot invite your own account.",
        400,
        "SELF_INVITATION"
      );
    }

    const existingInvitation =
      await this.businessInvitationRepository.findPendingByBusinessAndEmail(
        data.businessId,
        email
      );

    if (existingInvitation) {
      throw new AppError(
        "A pending invitation already exists for this email.",
        409,
        "INVITATION_EXISTS"
      );
    }

    const existingUser =
      await this.authRepository.findUserByEmail(
        email
      );

    if (existingUser) {
      const existingMember =
        await this.businessMemberRepository.findByUserAndBusiness(
          existingUser.id,
          data.businessId
        );

      if (
        existingMember &&
        existingMember.status !==
          BusinessMemberStatus.REMOVED
      ) {
        throw new AppError(
          "This user is already a member of your business.",
          409,
          "MEMBER_EXISTS"
        );
      }
    }

    const rawToken =
      createRawInvitationToken();

    const expiresAt =
      invitationExpiry();

    const invitation =
      await this.businessInvitationRepository.create(
        {
          businessId:
            data.businessId,
          invitedById:
            data.actorId,
          email,
          role: data.role,
          token:
            hashInvitationToken(
              rawToken
            ),
          expiresAt,
        }
      );

    /*
     * The raw token is deliberately not returned in production.
     * Your email provider should receive the raw token here:
     *
     *   /staff/invitations/<rawToken>/accept
     *
     * For local development only, return it as developmentToken.
     */
    const developmentToken =
      process.env.NODE_ENV !==
      "production"
        ? rawToken
        : undefined;

    return {
      message:
        "Invitation created successfully.",

      invitation: {
        id: invitation.id,
        businessId:
          invitation.businessId,
        email:
          invitation.email,
        role:
          invitation.role,
        status:
          invitation.status,
        expiresAt:
          invitation.expiresAt,
      },

      ...(developmentToken && {
        developmentToken,
      }),
    };
  }

  async listInvitations(
    actorId: string,
    businessId: string,
    query: InvitationPaginationQuery
  ) {
    const actorRole =
      await this.getActorRole(
        actorId,
        businessId
      );

    this.assertCanManageTeam(
      actorRole
    );

    await this.businessInvitationRepository.expireOldInvitations();

    return this.businessInvitationRepository.listByBusiness(
      businessId,
      query
    );
  }

  async cancelInvitation(
    data: CancelInvitationInput
  ) {
    const actorRole =
      await this.getActorRole(
        data.actorId,
        data.businessId
      );

    this.assertCanManageTeam(
      actorRole
    );

    const invitation =
      await this.businessInvitationRepository.findById(
        data.invitationId
      );

    if (
      !invitation ||
      invitation.business.id !==
        data.businessId
    ) {
      throw new AppError(
        "Invitation not found.",
        404,
        "INVITATION_NOT_FOUND"
      );
    }

    if (
      actorRole ===
        BusinessMemberRole.MANAGER &&
      invitation.role ===
        BusinessMemberRole.MANAGER
    ) {
      throw new AppError(
        "Managers cannot manage manager invitations.",
        403,
        "MANAGER_INVITATION_SCOPE_FORBIDDEN"
      );
    }

    if (
      invitation.status !==
      InvitationStatus.PENDING
    ) {
      throw new AppError(
        "Only pending invitations can be revoked.",
        409,
        "INVITATION_NOT_PENDING"
      );
    }

    const updated =
      await this.businessInvitationRepository.update(
        invitation.id,
        {
          status:
            InvitationStatus.REJECTED,
        }
      );

    return {
      message:
        "Invitation revoked successfully.",
      invitation: {
        id: updated.id,
        status:
          updated.status,
      },
    };
  }

  async resendInvitation(
    data: ResendInvitationInput
  ) {
    const actorRole =
      await this.getActorRole(
        data.actorId,
        data.businessId
      );

    this.assertCanManageTeam(
      actorRole
    );

    const oldInvitation =
      await this.businessInvitationRepository.findById(
        data.invitationId
      );

    if (
      !oldInvitation ||
      oldInvitation.business.id !==
        data.businessId
    ) {
      throw new AppError(
        "Invitation not found.",
        404,
        "INVITATION_NOT_FOUND"
      );
    }

    if (
      actorRole ===
        BusinessMemberRole.MANAGER &&
      oldInvitation.role ===
        BusinessMemberRole.MANAGER
    ) {
      throw new AppError(
        "Managers cannot manage manager invitations.",
        403,
        "MANAGER_INVITATION_SCOPE_FORBIDDEN"
      );
    }

    if (
      oldInvitation.status !==
        InvitationStatus.PENDING &&
      oldInvitation.status !==
        InvitationStatus.EXPIRED
    ) {
      throw new AppError(
        "Only pending or expired invitations can be resent.",
        409,
        "INVITATION_NOT_RESENDABLE"
      );
    }

    await this.businessInvitationRepository.update(
      oldInvitation.id,
      {
        status:
          InvitationStatus.REJECTED,
      }
    );

    return this.inviteStaff({
      actorId:
        data.actorId,
      businessId:
        data.businessId,
      email:
        oldInvitation.email,
      role:
        oldInvitation.role,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | ACCEPT INVITATION
  |--------------------------------------------------------------------------
  */

  async acceptInvitation(
    data: AcceptInvitationInput
  ) {
    const token =
      data.token.trim();

    if (!token) {
      throw new AppError(
        "Invitation token is required.",
        400,
        "TOKEN_REQUIRED"
      );
    }

    /*
     * New records use an HMAC digest.
     * A plaintext fallback keeps already-issued legacy invitations
     * valid during the migration period.
     */
    const hashedToken =
      hashInvitationToken(
        token
      );

    const invitation =
      await this.businessInvitationRepository.findByToken(
        hashedToken
      ) ??
      await this.businessInvitationRepository.findByToken(
        token
      );

    if (!invitation) {
      throw new AppError(
        "Invitation not found.",
        404,
        "INVITATION_NOT_FOUND"
      );
    }

    if (
      invitation.status !==
      InvitationStatus.PENDING
    ) {
      throw new AppError(
        "Invitation is no longer valid.",
        409,
        "INVITATION_NOT_VALID"
      );
    }

    if (
      invitation.expiresAt <=
      new Date()
    ) {
      await this.businessInvitationRepository.update(
        invitation.id,
        {
          status:
            InvitationStatus.EXPIRED,
        }
      );

      throw new AppError(
        "Invitation has expired.",
        409,
        "INVITATION_EXPIRED"
      );
    }

    const user =
      await this.authRepository.findUserById(
        data.userId
      );

    if (!user) {
      throw new AppError(
        "User not found.",
        404,
        "USER_NOT_FOUND"
      );
    }

    const userEmail =
      user.email
        ?.trim()
        .toLowerCase();

    const invitationEmail =
      invitation.email
        .trim()
        .toLowerCase();

    if (
      !userEmail ||
      userEmail !==
        invitationEmail
    ) {
      throw new AppError(
        "This invitation does not belong to your account.",
        403,
        "INVITATION_ACCOUNT_MISMATCH"
      );
    }

    const business =
      await this.getBusiness(
        invitation.business.id
      );

    let existingMember =
      await this.businessMemberRepository.findByUserAndBusiness(
        user.id,
        business.id
      );

    try {
      await prisma.$transaction(
        async (tx) => {
          /*
           * Atomically consume only a still-pending invitation.
           * This prevents the same invitation from being accepted twice.
           */
          const consumed =
            await tx.businessInvitation.updateMany(
              {
                where: {
                  id:
                    invitation.id,
                  status:
                    InvitationStatus.PENDING,
                  expiresAt: {
                    gt: new Date(),
                  },
                },
                data: {
                  status:
                    InvitationStatus.ACCEPTED,
                  acceptedAt:
                    new Date(),
                },
              }
            );

          if (
            consumed.count !== 1
          ) {
            throw new AppError(
              "Invitation is no longer valid.",
              409,
              "INVITATION_CONSUMED"
            );
          }

          if (
            existingMember &&
            existingMember.status ===
              BusinessMemberStatus.REMOVED
          ) {
            existingMember =
              await this.businessMemberRepository.findByUserAndBusiness(
                user.id,
                business.id
              );

            await tx.businessMember.update(
              {
                where: {
                  id:
                    existingMember!.id,
                },
                data: {
                  role:
                    invitation.role,
                  status:
                    BusinessMemberStatus.ACTIVE,
                  invitedById:
                    invitation.invitedById,
                  joinedAt:
                    new Date(),
                },
              }
            );
          } else if (
            existingMember
          ) {
            throw new AppError(
              "You are already a member of this business.",
              409,
              "MEMBER_EXISTS"
            );
          } else {
            await tx.businessMember.create(
              {
                data: {
                  userId:
                    user.id,
                  businessId:
                    business.id,
                  role:
                    invitation.role,
                  status:
                    BusinessMemberStatus.ACTIVE,
                  invitedById:
                    invitation.invitedById,
                },
              }
            );
          }
        }
      );
    } catch (error: any) {
      if (
        error?.code === "P2002"
      ) {
        throw new AppError(
          "You are already a member of this business.",
          409,
          "MEMBER_EXISTS"
        );
      }

      throw error;
    }

    return {
      message:
        "Invitation accepted successfully.",
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
      },
      role:
        invitation.role,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | MEMBERS
  |--------------------------------------------------------------------------
  */

  async getMembers(
    actorId: string,
    businessId: string,
    query: StaffPaginationQuery
  ) {
    await this.getActorRole(
      actorId,
      businessId
    );

    return this.businessMemberRepository.listByBusiness(
      businessId,
      query
    );
  }

  async updateMemberRole(
    data: UpdateMemberRoleInput
  ) {
    const actorRole =
      await this.getActorRole(
        data.actorId,
        data.businessId
      );

    this.assertCanManageTeam(
      actorRole
    );

    const member =
      await this.businessMemberRepository.findById(
        data.memberId
      );

    if (
      !member ||
      member.business.id !==
        data.businessId
    ) {
      throw new AppError(
        "Member not found.",
        404,
        "MEMBER_NOT_FOUND"
      );
    }

    if (
      member.status ===
      BusinessMemberStatus.REMOVED
    ) {
      throw new AppError(
        "Removed members cannot be modified.",
        409,
        "MEMBER_REMOVED"
      );
    }

    this.assertCanManageTarget(
      actorRole,
      member.role
    );

    if (
      actorRole ===
        BusinessMemberRole.MANAGER &&
      data.role ===
        BusinessMemberRole.MANAGER
    ) {
      throw new AppError(
        "Managers cannot promote members to manager.",
        403,
        "MANAGER_ROLE_FORBIDDEN"
      );
    }

    if (
      member.user.id ===
      data.actorId
    ) {
      throw new AppError(
        "You cannot change your own role.",
        403,
        "SELF_ROLE_CHANGE_FORBIDDEN"
      );
    }

    return this.businessMemberRepository.update(
      member.id,
      {
        role: data.role,
      }
    );
  }

  async updateMemberStatus(
    data: UpdateMemberStatusInput
  ) {
    const actorRole =
      await this.getActorRole(
        data.actorId,
        data.businessId
      );

    this.assertCanManageTeam(
      actorRole
    );

    const member =
      await this.businessMemberRepository.findById(
        data.memberId
      );

    if (
      !member ||
      member.business.id !==
        data.businessId
    ) {
      throw new AppError(
        "Member not found.",
        404,
        "MEMBER_NOT_FOUND"
      );
    }

    this.assertCanManageTarget(
      actorRole,
      member.role
    );

    if (
      member.user.id ===
      data.actorId
    ) {
      throw new AppError(
        "You cannot change your own access status.",
        403,
        "SELF_STATUS_CHANGE_FORBIDDEN"
      );
    }

    if (
      member.status ===
      BusinessMemberStatus.REMOVED
    ) {
      throw new AppError(
        "Removed members cannot be modified.",
        409,
        "MEMBER_REMOVED"
      );
    }

    return this.businessMemberRepository.update(
      member.id,
      {
        status:
          data.status,
      }
    );
  }

  async removeMember(
    data: RemoveMemberInput
  ) {
    const actorRole =
      await this.getActorRole(
        data.actorId,
        data.businessId
      );

    this.assertCanManageTeam(
      actorRole
    );

    const member =
      await this.businessMemberRepository.findById(
        data.memberId
      );

    if (
      !member ||
      member.business.id !==
        data.businessId
    ) {
      throw new AppError(
        "Member not found.",
        404,
        "MEMBER_NOT_FOUND"
      );
    }

    this.assertCanManageTarget(
      actorRole,
      member.role
    );

    if (
      member.user.id ===
      data.actorId
    ) {
      throw new AppError(
        "You cannot remove yourself from the business.",
        403,
        "SELF_REMOVAL_FORBIDDEN"
      );
    }

    if (
      member.status ===
      BusinessMemberStatus.REMOVED
    ) {
      throw new AppError(
        "Member is already removed.",
        409,
        "MEMBER_ALREADY_REMOVED"
      );
    }

    await this.businessMemberRepository.remove(
      member.id
    );

    return {
      message:
        "Member removed successfully.",
    };
  }
}
