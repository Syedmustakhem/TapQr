import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export class BusinessRepository {
  async findById(id: string) {
    return prisma.business.findUnique({
      where: { id },
      include: {
        profile: true,

        qrCodes: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: "desc",
          },
        },

        catalogs: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },

        members: {
          where: {
            status: "ACTIVE",
          },
        },
      },
    });
  }

  /**
   * Returns all active businesses owned by a user.
   *
   * Used by business management/dashboard flows.
   */
  async findByOwnerId(ownerId: string) {
    return prisma.business.findMany({
      where: {
        ownerId,
        deletedAt: null,
      },

      include: {
        profile: true,

        qrCodes: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Returns the owner's primary/oldest active business.
   *
   * StaffService expects a single business rather than
   * an array of businesses.
   *
   * We intentionally keep findByOwnerId() returning an
   * array so multi-business support remains possible.
   */
  async findPrimaryByOwnerId(ownerId: string) {
    return prisma.business.findFirst({
      where: {
        ownerId,
        deletedAt: null,
      },

      include: {
        profile: true,

        qrCodes: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },

      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.business.findUnique({
      where: { slug },
    });
  }

  async create(
    tx: Prisma.TransactionClient,
    data: {
      ownerId: string;
      name: string;
      slug: string;
      email?: string;
      phone?: string;
      description?: string;
      logo?: string;
    }
  ) {
    return tx.business.create({
      data: {
        ownerId: data.ownerId,
        name: data.name,
        slug: data.slug,
        email: data.email,
        phone: data.phone,
        description: data.description,
        logo: data.logo,
      },
    });
  }

  async createProfile(
    tx: Prisma.TransactionClient,
    businessId: string,
    data?: {
      email?: string;
      phone?: string;
    }
  ) {
    return tx.businessProfile.create({
      data: {
        businessId,
        email: data?.email,
        phone: data?.phone,
      },
    });
  }

  async createWithProfile(data: {
    ownerId: string;
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    description?: string;
    logo?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const business = await this.create(tx, data);

      await this.createProfile(tx, business.id, {
        email: data.email,
        phone: data.phone,
      });

      return business;
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      email?: string | null;
      phone?: string | null;
      description?: string | null;
      logo?: string | null;
    }
  ) {
    return prisma.business.update({
      where: { id },
      data,

      include: {
        profile: true,
      },
    });
  }

  /**
   * Create/update business profile.
   *
   * businessId is the unique relation key.
   *
   * IMPORTANT:
   * We use the Business relation during CREATE instead of
   * passing businessId directly together with relation data.
   */
  async updateProfile(
    businessId: string,
    data: Prisma.BusinessProfileUpdateInput
  ) {
    /**
     * BusinessProfileUpdateInput can contain Prisma nested
     * relation operations such as `business`.
     *
     * We must not blindly spread that into the CREATE branch,
     * because the create input expects the relation in the
     * correct Prisma shape.
     *
     * Build the create object explicitly from supported
     * profile fields.
     */

    const profileData: Prisma.BusinessProfileCreateInput = {
      business: {
        connect: {
          id: businessId,
        },
      },

      ...(data.id !== undefined
        ? {
            id:
              typeof data.id === "string"
                ? data.id
                : undefined,
          }
        : {}),

      ...(data.tagline !== undefined
        ? {
            tagline:
              typeof data.tagline === "string"
                ? data.tagline
                : data.tagline === null
                  ? null
                  : undefined,
          }
        : {}),

      ...(data.description !== undefined
        ? {
            description:
              typeof data.description === "string"
                ? data.description
                : data.description === null
                  ? null
                  : undefined,
          }
        : {}),

      ...(data.website !== undefined
        ? {
            website:
              typeof data.website === "string"
                ? data.website
                : data.website === null
                  ? null
                  : undefined,
          }
        : {}),

      ...(data.email !== undefined
        ? {
            email:
              typeof data.email === "string"
                ? data.email
                : data.email === null
                  ? null
                  : undefined,
          }
        : {}),

      ...(data.phone !== undefined
        ? {
            phone:
              typeof data.phone === "string"
                ? data.phone
                : data.phone === null
                  ? null
                  : undefined,
          }
        : {}),

      ...(data.whatsapp !== undefined
        ? {
            whatsapp:
              typeof data.whatsapp === "string"
                ? data.whatsapp
                : data.whatsapp === null
                  ? null
                  : undefined,
          }
        : {}),

      ...(data.addressLine1 !== undefined
        ? {
            addressLine1:
              typeof data.addressLine1 === "string"
                ? data.addressLine1
                : data.addressLine1 === null
                  ? null
                  : undefined,
          }
        : {}),

      ...(data.addressLine2 !== undefined
        ? {
            addressLine2:
              typeof data.addressLine2 === "string"
                ? data.addressLine2
                : data.addressLine2 === null
                  ? null
                  : undefined,
          }
        : {}),

      ...(data.city !== undefined
        ? {
            city:
              typeof data.city === "string"
                ? data.city
                : data.city === null
                  ? null
                  : undefined,
          }
        : {}),

      ...(data.state !== undefined
        ? {
            state:
              typeof data.state === "string"
                ? data.state
                : data.state === null
                  ? null
                  : undefined,
          }
        : {}),

      ...(data.postalCode !== undefined
        ? {
            postalCode:
              typeof data.postalCode === "string"
                ? data.postalCode
                : data.postalCode === null
                  ? null
                  : undefined,
          }
        : {}),

      ...(data.country !== undefined
        ? {
            country:
              typeof data.country === "string"
                ? data.country
                : data.country === null
                  ? null
                  : undefined,
          }
        : {}),

      ...(data.latitude !== undefined
        ? {
            latitude:
              data.latitude === null
                ? null
                : data.latitude instanceof Prisma.Decimal
                  ? data.latitude
                  : undefined,
          }
        : {}),

      ...(data.longitude !== undefined
        ? {
            longitude:
              data.longitude === null
                ? null
                : data.longitude instanceof Prisma.Decimal
                  ? data.longitude
                  : undefined,
          }
        : {}),

      ...(data.openingHours !== undefined
        ? {
            openingHours:
              data.openingHours === null
                ? Prisma.JsonNull
                : (data.openingHours as Prisma.InputJsonValue),
          }
        : {}),

      ...(data.socialLinks !== undefined
        ? {
            socialLinks:
              data.socialLinks === null
                ? Prisma.JsonNull
                : (data.socialLinks as Prisma.InputJsonValue),
          }
        : {}),

      ...(data.coverImage !== undefined
        ? {
            coverImage:
              typeof data.coverImage === "string"
                ? data.coverImage
                : data.coverImage === null
                  ? null
                  : undefined,
          }
        : {}),
    };

    return prisma.businessProfile.upsert({
  where: {
    businessId,
  },

  create: profileData,

  update: profileData,
});
  }

  async softDelete(id: string) {
    return prisma.business.update({
      where: { id },

      data: {
        deletedAt: new Date(),
        status: "INACTIVE",
      },
    });
  }

  async countOwnerBusinesses(ownerId: string) {
    return prisma.business.count({
      where: {
        ownerId,
        deletedAt: null,
      },
    });
  }
}