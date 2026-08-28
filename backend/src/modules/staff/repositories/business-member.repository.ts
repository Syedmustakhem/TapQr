import {
  BusinessMemberRole,
  BusinessMemberStatus,
} from "@prisma/client";

import { prisma } from "../../../config/prisma";

export class BusinessMemberRepository {
  /**
   * Create a business member.
   */
  async create(data: {
    userId: string;
    businessId: string;
    role: BusinessMemberRole;
    invitedById?: string;
  }) {
    return prisma.businessMember.create({
      data: {
        userId: data.userId,
        businessId: data.businessId,
        role: data.role,
        invitedById: data.invitedById,
        status: BusinessMemberStatus.ACTIVE,
      },

      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }

  /**
   * Find member by ID.
   */
  async findById(id: string) {
    return prisma.businessMember.findUnique({
      where: {
        id,
      },

      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },

        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Find a specific user/business membership.
   *
   * Prisma schema has:
   * @@unique([userId, businessId])
   */
  async findByUserAndBusiness(
    userId: string,
    businessId: string
  ) {
    return prisma.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },

      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }

  /**
   * Get all members belonging to a business.
   */
  async findByBusiness(
    businessId: string
  ) {
    return prisma.businessMember.findMany({
      where: {
        businessId,
        status: {
          not: BusinessMemberStatus.REMOVED,
        },
      },

      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
      },

      orderBy: {
        joinedAt: "desc",
      },
    });
  }

  /**
   * Update member role.
   */
  async update(
    id: string,
    data: {
      role?: BusinessMemberRole;
      status?: BusinessMemberStatus;
    }
  ) {
    return prisma.businessMember.update({
      where: {
        id,
      },

      data,

      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }

  /**
   * Suspend member.
   */
  async suspend(id: string) {
    return prisma.businessMember.update({
      where: {
        id,
      },

      data: {
        status:
          BusinessMemberStatus.SUSPENDED,
      },
    });
  }

  /**
   * Remove member.
   *
   * We don't physically delete the membership.
   * This preserves historical membership information.
   */
  async remove(id: string) {
    return prisma.businessMember.update({
      where: {
        id,
      },

      data: {
        status:
          BusinessMemberStatus.REMOVED,
      },
    });
  }
}