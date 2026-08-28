import {
  InvitationStatus,
  BusinessMemberRole,
} from "@prisma/client";

import { prisma } from "../../../config/prisma";

export class BusinessInvitationRepository {
  /**
   * Create a staff invitation.
   */
  async create(data: {
    businessId: string;
    invitedById: string;
    email: string;
    role: BusinessMemberRole;
    token: string;
    expiresAt: Date;
  }) {
    return prisma.businessInvitation.create({
      data: {
        businessId: data.businessId,
        invitedById: data.invitedById,
        email: data.email,
        role: data.role,
        token: data.token,
        expiresAt: data.expiresAt,
        status: InvitationStatus.PENDING,
      },

      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },

        invitedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find invitation by secure token.
   */
  async findByToken(
    token: string
  ) {
    return prisma.businessInvitation.findUnique({
      where: {
        token,
      },

      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Find pending invitation for a business/email pair.
   */
  async findPendingByBusinessAndEmail(
    businessId: string,
    email: string
  ) {
    return prisma.businessInvitation.findFirst({
      where: {
        businessId,

        email: email
          .trim()
          .toLowerCase(),

        status:
          InvitationStatus.PENDING,

        expiresAt: {
          gt: new Date(),
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Update invitation.
   */
  async update(
    id: string,
    data: {
      status?: InvitationStatus;
      acceptedAt?: Date | null;
    }
  ) {
    return prisma.businessInvitation.update({
      where: {
        id,
      },

      data,
    });
  }

  /**
   * Expire all old pending invitations.
   *
   * Useful for cleanup jobs later.
   */
  async expireOldInvitations() {
    return prisma.businessInvitation.updateMany({
      where: {
        status:
          InvitationStatus.PENDING,

        expiresAt: {
          lt: new Date(),
        },
      },

      data: {
        status:
          InvitationStatus.EXPIRED,
      },
    });
  }
}