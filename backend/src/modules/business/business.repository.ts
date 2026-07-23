import { prisma } from "../../config/prisma";

export interface CreateBusinessRepositoryInput {
  ownerId: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  logo?: string;
  description?: string;
}

export interface UpdateBusinessRepositoryInput {
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  logo?: string;
  description?: string;
}

export class BusinessRepository {

  async create(data: CreateBusinessRepositoryInput) {
    return prisma.business.create({
      data: {
        ownerId: data.ownerId,
        name: data.name,
        slug: data.slug,
        email: data.email,
        phone: data.phone,
        logo: data.logo,
        description: data.description,
      },
    });
  }

  async findById(id: string) {
    return prisma.business.findUnique({
      where: {
        id,
      },
    });
  }

  async findByOwnerId(ownerId: string) {
    return prisma.business.findFirst({
      where: {
        ownerId,
        deletedAt: null,
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.business.findUnique({
      where: {
        slug,
      },
    });
  }

  async update(
    id: string,
    data: UpdateBusinessRepositoryInput
  ) {
    return prisma.business.update({
      where: {
        id,
      },
      data,
    });
  }

  async softDelete(id: string) {
    return prisma.business.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}