import {
  BusinessMemberRole,
  BusinessMemberStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "../../../config/prisma";

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
} satisfies Prisma.UserSelect;

const memberInclude = {
  user: {
    select: userSelect,
  },
} satisfies Prisma.BusinessMemberInclude;

export class BusinessMemberRepository {
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
      include: memberInclude,
    });
  }

  async findById(id: string) {
    return prisma.businessMember.findUnique({
      where: { id },
      include: {
        user: {
          select: userSelect,
        },
        business: {
          select: {
            id: true,
            ownerId: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });
  }

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
      include: memberInclude,
    });
  }

  async listByBusiness(
    businessId: string,
    options: {
      page: number;
      limit: number;
      search?: string;
      role?: BusinessMemberRole;
      status?: BusinessMemberStatus;
    }
  ) {
    const where: Prisma.BusinessMemberWhereInput = {
      businessId,

      ...(options.status
        ? { status: options.status }
        : {
            status: {
              not: BusinessMemberStatus.REMOVED,
            },
          }),

      ...(options.role
        ? { role: options.role }
        : {}),

      ...(options.search
        ? {
            user: {
              OR: [
                {
                  fullName: {
                    contains:
                      options.search,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains:
                      options.search,
                    mode: "insensitive",
                  },
                },
                {
                  phone: {
                    contains:
                      options.search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          }
        : {}),
    };

    const skip =
      (options.page - 1) *
      options.limit;

    const [members, total] =
      await prisma.$transaction([
        prisma.businessMember.findMany({
          where,

          include: memberInclude,

          orderBy: [
            {
              role: "asc",
            },
            {
              createdAt: "desc",
            },
          ],

          skip,
          take: options.limit,
        }),

        prisma.businessMember.count({
          where,
        }),
      ]);

    return {
      members,
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
      role?: BusinessMemberRole;
      status?: BusinessMemberStatus;
    }
  ) {
    return prisma.businessMember.update({
      where: { id },
      data,
      include: memberInclude,
    });
  }

  async remove(id: string) {
    return prisma.businessMember.update({
      where: { id },
      data: {
        status:
          BusinessMemberStatus.REMOVED,
      },
      include: memberInclude,
    });
  }
}
