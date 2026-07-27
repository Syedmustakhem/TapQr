import crypto from "crypto";
import { prisma } from "../../../config/prisma";

import {
  BusinessMemberRole,
  InvitationStatus,
} from "@prisma/client";

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
  private authRepository = new AuthRepository();

  private businessRepository = new BusinessRepository();

  private businessMemberRepository =
    new BusinessMemberRepository();

  private businessInvitationRepository =
    new BusinessInvitationRepository();

  async inviteStaff(
    data: InviteStaffServiceInput
  ) {
    const business =
      await this.businessRepository.findByOwnerId(
        data.ownerId
      );

    if (!business) {
      throw new AppError(
        "Business not found.",
        404
      );
    }

    const existingInvitation =
      await this.businessInvitationRepository.findPendingByBusinessAndEmail(
        business.id,
        data.email
      );

    if (existingInvitation) {
      throw new AppError(
        "Invitation already sent.",
        409
      );
    }

    const existingUser =
      await this.authRepository.findUserByEmail(
        data.email
      );

    if (existingUser) {
      const existingMember =
        await this.businessMemberRepository.findByUserAndBusiness(
          existingUser.id,
          business.id
        );

      if (existingMember) {
        throw new AppError(
          "User is already a business member.",
          409
        );
      }
    }

    const token =
      crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + 7
    );

    const invitation =
      await this.businessInvitationRepository.create({
        businessId: business.id,
        invitedById: data.ownerId,
        email: data.email.toLowerCase().trim(),
        role: data.role,
        token,
        expiresAt,
      });

    return {
      message: "Invitation sent successfully.",
      invitation,
    };
  }

  async acceptInvitation(
    data: AcceptInvitationServiceInput
  ) {

    const invitation =
      await this.businessInvitationRepository.findByToken(
        data.token
      );

    if (!invitation) {
      throw new AppError(
        "Invitation not found.",
        404
      );
    }

    if (
      invitation.status !==
      InvitationStatus.PENDING
    ) {
      throw new AppError(
        "Invitation is no longer valid.",
        409
      );
    }

    if (
      invitation.expiresAt < new Date()
    ) {
      throw new AppError(
        "Invitation has expired.",
        409
      );
    }

    const user =
      await this.authRepository.findUserById(
        data.userId
      );

    if (!user) {
      throw new AppError(
        "User not found.",
        404
      );
    }

    if (
      user.email !== invitation.email
    ) {
      throw new AppError(
        "This invitation does not belong to your account.",
        403
      );
    }

    const existingMember =
      await this.businessMemberRepository.findByUserAndBusiness(
        user.id,
        invitation.businessId
      );

    if (existingMember) {
      throw new AppError(
        "User is already a business member.",
        409
      );
    }

    await prisma.$transaction(
      async (tx) => {        await tx.businessMember.create({
          data: {
            userId: user.id,
            businessId: invitation.businessId,
            role: invitation.role,
          },
        });

        await tx.businessInvitation.update({
          where: {
            id: invitation.id,
          },
          data: {
            status: InvitationStatus.ACCEPTED,
            acceptedAt: new Date(),
          },
        });
      }
    );

    return {
      message: "Invitation accepted successfully.",
    };
  }

  async getMembers(ownerId: string) {
    const business =
      await this.businessRepository.findByOwnerId(
        ownerId
      );

    if (!business) {
      throw new AppError(
        "Business not found.",
        404
      );
    }

    return this.businessMemberRepository.findByBusiness(
      business.id
    );
  }

  async updateMemberRole(
    ownerId: string,
    memberId: string,
    role: BusinessMemberRole
  ) {
    const business =
      await this.businessRepository.findByOwnerId(
        ownerId
      );

    if (!business) {
      throw new AppError(
        "Business not found.",
        404
      );
    }

    const member =
      await this.businessMemberRepository.findById(
        memberId
      );

    if (!member) {
      throw new AppError(
        "Member not found.",
        404
      );
    }

    if (member.businessId !== business.id) {
      throw new AppError(
        "Member does not belong to your business.",
        403
      );
    }

    return this.businessMemberRepository.update(
      member.id,
      {
        role,
      }
    );
  }

  async removeMember(
    ownerId: string,
    memberId: string
  ) {
    const business =
      await this.businessRepository.findByOwnerId(
        ownerId
      );

    if (!business) {
      throw new AppError(
        "Business not found.",
        404
      );
    }

    const member =
      await this.businessMemberRepository.findById(
        memberId
      );

    if (!member) {
      throw new AppError(
        "Member not found.",
        404
      );
    }

    if (member.businessId !== business.id) {
      throw new AppError(
        "Member does not belong to your business.",
        403
      );
    }

    await this.businessMemberRepository.remove(
      member.id
    );

    return {
      message: "Member removed successfully.",
    };
  }
}