import crypto from "crypto";

import {
  BusinessMemberRole,
} from "@prisma/client";

import { AppError } from "../../../cores/errors/AppError";

import { AuthRepository } from "../../auth/auth.repository";
import { BusinessRepository } from "../../business/business.repository";

import { BusinessMemberRepository } from "../repositories/business-member.repository";
import { BusinessInvitationRepository } from "../business-invitation.repository";

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

  async inviteStaff(data: InviteStaffServiceInput) {
    /**
     * Step 1
     * Find owner's business
     */
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
async acceptInvitation(
  data: AcceptInvitationServiceInput
) {
  // Step 1: Find invitation
  // Step 2: Validate invitation exists
  // Step 3: Validate status is PENDING
  // Step 4: Validate invitation is not expired
}
    /**
     * Step 2
     * Check pending invitation
     */
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

    /**
     * Step 3
     * Check if user already exists
     */
    const existingUser =
      await this.authRepository.findUserByEmail(
        data.email
      );

    /**
     * Step 4
     * If user exists,
     * verify they are not already a member
     */
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

    /**
     * Step 5
     * Generate secure invitation token
     */
    const token = crypto.randomUUID();

    /**
     * Step 6
     * Set invitation expiry (7 days)
     */
    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + 7
    );

    /**
     * Step 7
     * Create invitation
     */
    const invitation =
      await this.businessInvitationRepository.create({
        businessId: business.id,
        invitedById: data.ownerId,
        email: data.email,
        role: data.role,
        token,
        expiresAt,
      });

    /**
     * Future
     * Send email notification here
     */

    return {
      message: "Invitation sent successfully.",
      invitation,
    };
  }
}