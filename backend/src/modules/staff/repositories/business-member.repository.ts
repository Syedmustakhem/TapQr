import {
  BusinessMemberRole,
  BusinessMemberStatus,
} from "@prisma/client";
import { prisma } from "../../../../src/config/prisma";

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
  async create(data: CreateBusinessMemberRepositoryInput) {
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
   * Find business member by ID
   */
  async findById(id: string) {
    return prisma.businessMember.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Find a membership by user and business.
   * Used to prevent duplicate memberships.
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
   * Get all members of a business.
   * Includes user details for the frontend.
   */
  async findByBusiness(businessId: string) {
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
        createdAt: "asc",
      },
    });
  }

  /**
   * Update member role or status
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
   * Remove a member from the business.
   * We don't delete the record—we simply mark it as REMOVED.
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
}