import {
  BusinessMemberRole,
  InvitationStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "../../../config/prisma";

const invitationInclude = {
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
} satisfies Prisma.BusinessInvitationInclude;

export class BusinessInvitationRepository {
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
      include: invitationInclude,
    });
  }

  async findByToken(
    token: string
  ) {
    return prisma.businessInvitation.findUnique({
      where: { token },
      include: invitationInclude,
    });
  }

  async findById(id: string) {
    return prisma.businessInvitation.findUnique({
      where: { id },
      include: invitationInclude,
    });
  }

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

  async listByBusiness(
    businessId: string,
    options: {
      page: number;
      limit: number;
      status?: InvitationStatus;
    }
  ) {
    const where: Prisma.BusinessInvitationWhereInput =
      {
        businessId,

        ...(options.status
          ? {
              status:
                options.status,
            }
          : {}),
      };

    const skip =
      (options.page - 1) *
      options.limit;

    const [invitations, total] =
      await prisma.$transaction([
        prisma.businessInvitation.findMany(
          {
            where,
            include:
              invitationInclude,
            orderBy: {
              createdAt:
                "desc",
            },
            skip,
            take:
              options.limit,
          }
        ),

        prisma.businessInvitation.count({
          where,
        }),
      ]);

    return {
      invitations,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(
        total / options.limit
      ),
    };
  }

  async update(
    id: string,
    data: {
      status?: InvitationStatus;
      acceptedAt?: Date | null;
      token?: string;
      expiresAt?: Date;
    }
  ) {
    return prisma.businessInvitation.update({
      where: { id },
      data,
      include: invitationInclude,
    });
  }

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
