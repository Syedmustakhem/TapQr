import crypto from "crypto";

import {
  BusinessMemberRole,
  InvitationStatus,
  BusinessMemberStatus,
} from "@prisma/client";

import { prisma } from "../../../config/prisma";

import { AppError } from "../../../cores/errors/AppError";

import { AuthRepository } from "../../auth/auth.repository";
import { BusinessRepository } from "../../business/business.repository";

import { BusinessMemberRepository } from "../repositories/business-member.repository";
import { BusinessInvitationRepository } from "../repositories/business-invitation.repository";

export interface InviteStaffServiceInput {
  ownerId: string;
  email: string;
  role: BusinessMemberRole;
}

export interface AcceptInvitationServiceInput {
  userId: string;
  token: string;
}

export class StaffService {
  private authRepository =
    new AuthRepository();

  private businessRepository =
    new BusinessRepository();

  private businessMemberRepository =
    new BusinessMemberRepository();

  private businessInvitationRepository =
    new BusinessInvitationRepository();

  /**
   * Invite staff/member.
   */
  async inviteStaff(
    data: InviteStaffServiceInput
  ) {
    const email =
      data.email
        .trim()
        .toLowerCase();

    /**
     * Only OWNER can currently invite.
     *
     * We can later extend this to MANAGER
     * through granular permissions.
     */
    const business =
      await this.businessRepository.findPrimaryByOwnerId(
        data.ownerId
      );

    if (!business) {
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
        "Your business is not active.",
        403,
        "BUSINESS_NOT_ACTIVE"
      );
    }

    /**
     * Prevent inviting OWNER as staff.
     */
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

    /**
     * Check existing pending invitation.
     */
    const existingInvitation =
      await this.businessInvitationRepository.findPendingByBusinessAndEmail(
        business.id,
        email
      );

    if (existingInvitation) {
      throw new AppError(
        "An invitation has already been sent to this email.",
        409,
        "INVITATION_EXISTS"
      );
    }

    /**
     * Check whether the email belongs to
     * an existing account.
     */
    const existingUser =
      await this.authRepository.findUserByEmail(
        email
      );

    if (existingUser) {
      const existingMember =
        await this.businessMemberRepository.findByUserAndBusiness(
          existingUser.id,
          business.id
        );

      if (existingMember) {
        if (
          existingMember.status ===
          BusinessMemberStatus.REMOVED
        ) {
          /**
           * A removed member can be re-added
           * through a fresh invitation.
           */
        } else {
          throw new AppError(
            "This user is already a member of your business.",
            409,
            "MEMBER_EXISTS"
          );
        }
      }
    }

    /**
     * Generate cryptographically secure invitation token.
     */
    const token =
      crypto
        .randomBytes(32)
        .toString("hex");

    /**
     * Invitation valid for 7 days.
     */
    const expiresAt =
      new Date();

    expiresAt.setDate(
      expiresAt.getDate() + 7
    );

    const invitation =
      await this.businessInvitationRepository.create({
        businessId:
          business.id,

        invitedById:
          data.ownerId,

        email,

        role:
          data.role,

        token,

        expiresAt,
      });

    /**
     * IMPORTANT:
     *
     * Email delivery is intentionally not hard-coded here.
     *
     * When your invitation email provider is ready,
     * call it here.
     */
    return {
      message:
        "Invitation created successfully.",

      invitation: {
        id:
          invitation.id,

        email:
          invitation.email,

        role:
          invitation.role,

        status:
          invitation.status,

        expiresAt:
          invitation.expiresAt,
      },
    };
  }

  /**
   * Accept staff invitation.
   */
  async acceptInvitation(
    data: AcceptInvitationServiceInput
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

    const invitation =
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

    /**
     * Normalize both emails before comparison.
     */
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

    /**
     * Prevent duplicate membership.
     */
    const existingMember =
      await this.businessMemberRepository.findByUserAndBusiness(
        user.id,
        invitation.businessId
      );

    if (
      existingMember &&
      existingMember.status !==
        BusinessMemberStatus.REMOVED
    ) {
      throw new AppError(
        "You are already a member of this business.",
        409,
        "MEMBER_EXISTS"
      );
    }

    /**
     * Transaction:
     *
     * 1. Create/reactivate membership
     * 2. Mark invitation accepted
     */
    await prisma.$transaction(
      async (tx) => {
        if (
          existingMember &&
          existingMember.status ===
            BusinessMemberStatus.REMOVED
        ) {
          await tx.businessMember.update({
            where: {
              id:
                existingMember.id,
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
          });
        } else {
          await tx.businessMember.create({
            data: {
              userId:
                user.id,

              businessId:
                invitation.businessId,

              role:
                invitation.role,

              status:
                BusinessMemberStatus.ACTIVE,

              invitedById:
                invitation.invitedById,
            },
          });
        }

        await tx.businessInvitation.update({
          where: {
            id:
              invitation.id,
          },

          data: {
            status:
              InvitationStatus.ACCEPTED,

            acceptedAt:
              new Date(),
          },
        });
      }
    );

    return {
      message:
        "Invitation accepted successfully.",
    };
  }

  /**
   * Get members for owner's primary business.
   */
  async getMembers(
    ownerId: string
  ) {
    const business =
      await this.businessRepository.findPrimaryByOwnerId(
        ownerId
      );

    if (!business) {
      throw new AppError(
        "Business not found.",
        404,
        "BUSINESS_NOT_FOUND"
      );
    }

    return this.businessMemberRepository.findByBusiness(
      business.id
    );
  }

  /**
   * Update member role.
   */
  async updateMemberRole(
    ownerId: string,
    memberId: string,
    role: BusinessMemberRole
  ) {
    if (
      role ===
      BusinessMemberRole.OWNER
    ) {
      throw new AppError(
        "OWNER role cannot be assigned through this endpoint.",
        400,
        "INVALID_MEMBER_ROLE"
      );
    }

    const business =
      await this.businessRepository.findPrimaryByOwnerId(
        ownerId
      );

    if (!business) {
      throw new AppError(
        "Business not found.",
        404,
        "BUSINESS_NOT_FOUND"
      );
    }

    const member =
      await this.businessMemberRepository.findById(
        memberId
      );

    if (!member) {
      throw new AppError(
        "Member not found.",
        404,
        "MEMBER_NOT_FOUND"
      );
    }

    if (
      member.businessId !==
      business.id
    ) {
      throw new AppError(
        "Member does not belong to your business.",
        403,
        "MEMBER_ACCESS_DENIED"
      );
    }

    return this.businessMemberRepository.update(
      member.id,
      {
        role,
      }
    );
  }

  /**
   * Remove member from business.
   *
   * Soft-removes membership instead of deleting
   * the database row.
   */
  async removeMember(
    ownerId: string,
    memberId: string
  ) {
    const business =
      await this.businessRepository.findPrimaryByOwnerId(
        ownerId
      );

    if (!business) {
      throw new AppError(
        "Business not found.",
        404,
        "BUSINESS_NOT_FOUND"
      );
    }

    const member =
      await this.businessMemberRepository.findById(
        memberId
      );

    if (!member) {
      throw new AppError(
        "Member not found.",
        404,
        "MEMBER_NOT_FOUND"
      );
    }

    if (
      member.businessId !==
      business.id
    ) {
      throw new AppError(
        "Member does not belong to your business.",
        403,
        "MEMBER_ACCESS_DENIED"
      );
    }

    if (
      member.role ===
      BusinessMemberRole.OWNER
    ) {
      throw new AppError(
        "The business owner cannot be removed.",
        400,
        "OWNER_CANNOT_BE_REMOVED"
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