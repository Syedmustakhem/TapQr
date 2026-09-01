import { Prisma } from "@prisma/client";

import { BusinessRepository } from "./business.repository";
import {
  CreateBusinessDTO,
  UpdateBusinessDTO,
  UpdateBusinessProfileDTO,
} from "./business.types";

import { AppError } from "../../cores/errors/AppError";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeEmail(email?: string | null) {
  if (email == null) {
    return email === null
      ? null
      : undefined;
  }

  const normalized =
    email.trim().toLowerCase();

  return normalized || null;
}

function normalizePhone(phone?: string | null) {
  if (phone == null) {
    return phone === null
      ? null
      : undefined;
  }

  const normalized = phone
    .trim()
    .replace(/[()\s.-]/g, "");

  return normalized || null;
}

export class BusinessService {
  private readonly repository =
    new BusinessRepository();

  async create(
    ownerId: string,
    data: CreateBusinessDTO
  ) {
    let baseSlug = slugify(data.name);

    if (!baseSlug) {
      baseSlug = "business";
    }

    let slug = baseSlug;
    let counter = 2;

    while (
      await this.repository.findBySlug(slug)
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    try {
      const business =
        await this.repository.createWithProfile({
          ownerId,
          name: data.name.trim(),
          slug,
          email: normalizeEmail(data.email) ?? undefined,
          phone: normalizePhone(data.phone) ?? undefined,
          description:
            data.description?.trim() || undefined,
          logo:
            data.logo?.trim() || undefined,
        });

      return this.repository.findById(
        business.id
      );
    } catch (error: any) {
      if (error?.code === "P2002") {
        /*
         * This can happen if another concurrent request
         * generated the same slug.
         */
        throw new AppError(
          "Unable to create the business because its unique identifier is already in use. Please try again.",
          409,
          "BUSINESS_CONFLICT"
        );
      }

      throw error;
    }
  }

  async getMyBusinesses(
    ownerId: string
  ) {
    return this.repository.findByOwnerId(
      ownerId
    );
  }

  async getById(
    ownerId: string,
    businessId: string
  ) {
    const business =
      await this.repository.findById(
        businessId
      );

    if (
      !business ||
      business.deletedAt
    ) {
      throw new AppError(
        "Business not found.",
        404,
        "BUSINESS_NOT_FOUND"
      );
    }

    if (
      business.ownerId !== ownerId
    ) {
      throw new AppError(
        "You do not have access to this business.",
        403,
        "BUSINESS_ACCESS_DENIED"
      );
    }

    return business;
  }

  async update(
    ownerId: string,
    businessId: string,
    data: UpdateBusinessDTO
  ) {
    await this.getById(
      ownerId,
      businessId
    );

    try {
      return await this.repository.update(
        businessId,
        {
          ...(data.name !== undefined && {
            name: data.name.trim(),
          }),

          ...(data.email !== undefined && {
            email: normalizeEmail(
              data.email
            ),
          }),

          ...(data.phone !== undefined && {
            phone: normalizePhone(
              data.phone
            ),
          }),

          ...(data.description !==
            undefined && {
            description:
              data.description?.trim() ||
              null,
          }),

          ...(data.logo !== undefined && {
            logo:
              data.logo?.trim() || null,
          }),
        }
      );
    } catch (error: any) {
      if (error?.code === "P2002") {
        throw new AppError(
          "Business update conflicts with existing data.",
          409,
          "BUSINESS_CONFLICT"
        );
      }

      throw error;
    }
  }

  async updateProfile(
    ownerId: string,
    businessId: string,
    data: UpdateBusinessProfileDTO
  ) {
    await this.getById(
      ownerId,
      businessId
    );

    const profileData: Prisma.BusinessProfileUpdateInput =
      {};

    if ("tagline" in data) {
      profileData.tagline =
        data.tagline;
    }

    if ("description" in data) {
      profileData.description =
        data.description;
    }

    if ("website" in data) {
      profileData.website =
        data.website;
    }

    if ("email" in data) {
      profileData.email =
        normalizeEmail(data.email);
    }

    if ("phone" in data) {
      profileData.phone =
        normalizePhone(data.phone);
    }

    if ("whatsapp" in data) {
      profileData.whatsapp =
        normalizePhone(data.whatsapp);
    }

    if ("addressLine1" in data) {
      profileData.addressLine1 =
        data.addressLine1;
    }

    if ("addressLine2" in data) {
      profileData.addressLine2 =
        data.addressLine2;
    }

    if ("city" in data) {
      profileData.city =
        data.city;
    }

    if ("state" in data) {
      profileData.state =
        data.state;
    }

    if ("postalCode" in data) {
      profileData.postalCode =
        data.postalCode;
    }

    if ("country" in data) {
      profileData.country =
        data.country;
    }

    if (
      data.latitude !== undefined
    ) {
      profileData.latitude =
        data.latitude === null
          ? null
          : new Prisma.Decimal(
              data.latitude
            );
    }

    if (
      data.longitude !== undefined
    ) {
      profileData.longitude =
        data.longitude === null
          ? null
          : new Prisma.Decimal(
              data.longitude
            );
    }

    if (
      data.openingHours !== undefined
    ) {
      profileData.openingHours =
        data.openingHours === null
          ? Prisma.JsonNull
          : (data.openingHours as Prisma.InputJsonValue);
    }

    if (
      data.socialLinks !== undefined
    ) {
      profileData.socialLinks =
        data.socialLinks === null
          ? Prisma.JsonNull
          : (data.socialLinks as Prisma.InputJsonValue);
    }

    if (
      data.coverImage !== undefined
    ) {
      profileData.coverImage =
        data.coverImage;
    }

    return this.repository.updateProfile(
      businessId,
      profileData
    );
  }

  async delete(
    ownerId: string,
    businessId: string
  ) {
    await this.getById(
      ownerId,
      businessId
    );

    await this.repository.softDelete(
      businessId
    );

    return {
      message:
        "Business deleted successfully.",
    };
  }
}