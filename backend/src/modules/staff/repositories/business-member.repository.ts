import {
  BusinessMemberRole,
  BusinessMemberStatus,
} from "@prisma/client";
import { prisma } from "../../../config/prisma";

export interface CreateBusinessMemberRepositoryInput {
  userId: string;
  businessId: string;
  role: BusinessMemberRole;
  status?: BusinessMemberStatus;
}

export interface UpdateBusinessMemberRepositoryInput {
  role?: BusinessMemberRole;
  status?: BusinessMemberStatus;
}

export class BusinessMemberRepository {
  /**
   * Create a new business member
   */
  async create(
    data: CreateBusinessMemberRepositoryInput
  ) {
    return prisma.businessMember.create({
      data: {
        userId: data.userId,
        businessId: data.businessId,
        role: data.role,
        status: data.status,
      },
    });
  }

  /**
   * Find member by ID
   */
  async findById(id: string) {
    return prisma.businessMember.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Find membership by user and business
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
    });
  }

  /**
   * Get all members of a business
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
        user: true,
      },
      orderBy: {
        joinedAt: "asc",
      },
    });
  }

  /**
   * Get all memberships of a user
   */
  async findByUser(
    userId: string
  ) {
    return prisma.businessMember.findMany({
      where: {
        userId,
        status: {
          not: BusinessMemberStatus.REMOVED,
        },
      },
      include: {
        business: true,
      },
    });
  }

  /**
   * Update member
   */
  async update(
    id: string,
    data: UpdateBusinessMemberRepositoryInput
  ) {
    return prisma.businessMember.update({
      where: {
        id,
      },
      data,
    });
  }

  /**
   * Soft remove member
   */
  async remove(id: string) {
    return prisma.businessMember.update({
      where: {
        id,
      },
      data: {
        status: BusinessMemberStatus.REMOVED,
      },
    });
  }

  /**
   * Suspend member
   */
  async suspend(id: string) {
    return prisma.businessMember.update({
      where: {
        id,
      },
      data: {
        status: BusinessMemberStatus.SUSPENDED,
      },
    });
  }

  /**
   * Activate member
   */
  async activate(id: string) {
    return prisma.businessMember.update({
      where: {
        id,
      },
      data: {
        status: BusinessMemberStatus.ACTIVE,
      },
    });
  }

  /**
   * Count active members
   */
  async countActiveMembers(
    businessId: string
  ) {
    return prisma.businessMember.count({
      where: {
        businessId,
        status: BusinessMemberStatus.ACTIVE,
      },
    });
  }
}