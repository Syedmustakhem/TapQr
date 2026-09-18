import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export interface BusinessCreateData {
  ownerId: string;
  name: string;
  slug: string;

  legalName?: string;
  displayName?: string;

  businessType?: string;
  industry?: string;
  category?: string;
  subcategory?: string;

  email?: string;
  phone?: string;
  website?: string;
  whatsapp?: string;

  logo?: string;
  coverImage?: string;

  description?: string;

  timezone?: string;
  currency?: string;
  language?: string;
  country?: string;
}

export interface BusinessUpdateData {
  name?: string | null;

  legalName?: string | null;
  displayName?: string | null;

  businessType?: string | null;
  industry?: string | null;
  category?: string | null;
  subcategory?: string | null;

  email?: string | null;
  phone?: string | null;
  website?: string | null;
  whatsapp?: string | null;

  logo?: string | null;
  coverImage?: string | null;

  description?: string | null;

  timezone?: string | null;
  currency?: string | null;
  language?: string | null;
  country?: string | null;

  isVerified?: boolean;
  isPublished?: boolean;
  onboardingCompleted?: boolean;
}

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
    data: BusinessCreateData
  ) {
    return tx.business.create({
      data: {
        ownerId: data.ownerId,
        name: data.name,
        slug: data.slug,

        legalName: data.legalName,
        displayName: data.displayName,

        businessType: data.businessType,
        industry: data.industry,
        category: data.category,
        subcategory: data.subcategory,

        email: data.email,
        phone: data.phone,
        website: data.website,
        whatsapp: data.whatsapp,

        logo: data.logo,
        coverImage: data.coverImage,

        description: data.description,

        timezone: data.timezone,
        currency: data.currency,
        language: data.language,
        country: data.country,
      },
    });
  }

  async createProfile(
    tx: Prisma.TransactionClient,
    businessId: string,
    data?: {
      email?: string;
      phone?: string;
      website?: string;
      whatsapp?: string;
      coverImage?: string;
    }
  ) {
    return tx.businessProfile.create({
      data: {
        businessId,

        email: data?.email,
        phone: data?.phone,
        website: data?.website,
        whatsapp: data?.whatsapp,
        coverImage: data?.coverImage,
      },
    });
  }

  async createWithProfile(data: BusinessCreateData) {
    return prisma.$transaction(async (tx) => {
      const business = await this.create(tx, data);

      await this.createProfile(tx, business.id, {
        email: data.email,
        phone: data.phone,
        website: data.website,
        whatsapp: data.whatsapp,
        coverImage: data.coverImage,
      });

      return business;
    });
  }

  async update(
    id: string,
    data: BusinessUpdateData
  ) {
    const updateData: Prisma.BusinessUpdateInput = {
      ...(data.name !== undefined && data.name !== null
        ? {
            name: data.name,
          }
        : {}),

      ...(data.legalName !== undefined
        ? {
            legalName: data.legalName,
          }
        : {}),

      ...(data.displayName !== undefined
        ? {
            displayName: data.displayName,
          }
        : {}),

      ...(data.businessType !== undefined
        ? {
            businessType: data.businessType,
          }
        : {}),

      ...(data.industry !== undefined
        ? {
            industry: data.industry,
          }
        : {}),

      ...(data.category !== undefined
        ? {
            category: data.category,
          }
        : {}),

      ...(data.subcategory !== undefined
        ? {
            subcategory: data.subcategory,
          }
        : {}),

      ...(data.email !== undefined
        ? {
            email: data.email,
          }
        : {}),

      ...(data.phone !== undefined
        ? {
            phone: data.phone,
          }
        : {}),

      ...(data.website !== undefined
        ? {
            website: data.website,
          }
        : {}),

      ...(data.whatsapp !== undefined
        ? {
            whatsapp: data.whatsapp,
          }
        : {}),

      ...(data.logo !== undefined
        ? {
            logo: data.logo,
          }
        : {}),

      ...(data.coverImage !== undefined
        ? {
            coverImage: data.coverImage,
          }
        : {}),

      ...(data.description !== undefined
        ? {
            description: data.description,
          }
        : {}),

      // These fields are required by Prisma.
      // null means "do not update", while a string updates the value.
      ...(data.timezone !== undefined && data.timezone !== null
        ? {
            timezone: data.timezone,
          }
        : {}),

      ...(data.currency !== undefined && data.currency !== null
        ? {
            currency: data.currency,
          }
        : {}),

      ...(data.language !== undefined && data.language !== null
        ? {
            language: data.language,
          }
        : {}),

      ...(data.country !== undefined && data.country !== null
        ? {
            country: data.country,
          }
        : {}),

      ...(data.isVerified !== undefined
        ? {
            isVerified: data.isVerified,
          }
        : {}),

      ...(data.isPublished !== undefined
        ? {
            isPublished: data.isPublished,
          }
        : {}),

      ...(data.onboardingCompleted !== undefined
        ? {
            onboardingCompleted: data.onboardingCompleted,
          }
        : {}),
    };

    return prisma.business.update({
      where: { id },

      data: updateData,

      include: {
        profile: true,
      },
    });
  }

  async updateProfile(
    businessId: string,
    data: Prisma.BusinessProfileUpdateInput
  ) {
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