import { Prisma } from "@prisma/client";

import { BusinessRepository } from "./business.repository";
import {
  CreateBusinessDTO,
  UpdateBusinessDTO,
  UpdateBusinessProfileDTO,
} from "./business.types";

import { AppError } from "../../cores/errors/AppError";
import { prisma } from "../../config/prisma";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeEmail(email?: string) {
  if (!email) return undefined;
  return email.trim().toLowerCase();
}

function normalizePhone(phone?: string) {
  if (!phone) return undefined;
  return phone.trim();
}

export class BusinessService {
  private repository = new BusinessRepository();

  async create(ownerId: string, data: CreateBusinessDTO) {
    const existingCount =
      await this.repository.countOwnerBusinesses(ownerId);

    /*
     * Current product rule:
     * one owner can have multiple businesses.
     *
     * We intentionally do not block multiple businesses.
     */

    let baseSlug = slugify(data.name);

    if (!baseSlug) {
      baseSlug = "business";
    }

    let slug = baseSlug;
    let counter = 2;

    while (await this.repository.findBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    try {
      const business =
        await this.repository.createWithProfile({
          ownerId,
          name: data.name.trim(),
          slug,
          email: normalizeEmail(data.email),
          phone: normalizePhone(data.phone),
          description: data.description?.trim(),
          logo: data.logo,
        });

      return this.repository.findById(business.id);
    } catch (error: any) {
      if (error?.code === "P2002") {
        throw new AppError(
          "A business with these details already exists.",
          409,
          "BUSINESS_ALREADY_EXISTS"
        );
      }

      throw error;
    }
  }

  async getMyBusinesses(ownerId: string) {
    return this.repository.findByOwnerId(ownerId);
  }

  async getById(ownerId: string, businessId: string) {
    const business =
      await this.repository.findById(businessId);

    if (!business || business.deletedAt) {
      throw new AppError(
        "Business not found.",
        404,
        "BUSINESS_NOT_FOUND"
      );
    }

    if (business.ownerId !== ownerId) {
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
    await this.getById(ownerId, businessId);

    try {
      return await this.repository.update(
        businessId,
        {
          name: data.name?.trim(),
          email:
  data.email === undefined
    ? undefined
    : data.email === null
      ? null
      : normalizeEmail(data.email),
          phone:
  data.phone === undefined
    ? undefined
    : data.phone === null
      ? null
      : normalizePhone(data.phone),
          description:
            data.description === undefined
              ? undefined
              : data.description?.trim() || null,
          logo: data.logo,
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
    await this.getById(ownerId, businessId);

    const profileData: Prisma.BusinessProfileUpdateInput =
      {};

    if ("tagline" in data) {
      profileData.tagline = data.tagline;
    }

    if ("description" in data) {
      profileData.description = data.description;
    }

    if ("website" in data) {
      profileData.website = data.website;
    }

    if ("email" in data) {
      profileData.email = data.email;
    }

    if ("phone" in data) {
      profileData.phone = data.phone;
    }

    if ("whatsapp" in data) {
      profileData.whatsapp = data.whatsapp;
    }

    if ("addressLine1" in data) {
      profileData.addressLine1 = data.addressLine1;
    }

    if ("addressLine2" in data) {
      profileData.addressLine2 = data.addressLine2;
    }

    if ("city" in data) {
      profileData.city = data.city;
    }

    if ("state" in data) {
      profileData.state = data.state;
    }

    if ("postalCode" in data) {
      profileData.postalCode = data.postalCode;
    }

    if ("country" in data) {
      profileData.country = data.country;
    }

    if (data.latitude !== undefined) {
  profileData.latitude =
    data.latitude === null
      ? null
      : new Prisma.Decimal(data.latitude);
}
if (data.longitude !== undefined) {
  profileData.longitude =
    data.longitude === null
      ? null
      : new Prisma.Decimal(data.longitude);
}

    if ("openingHours" in data) {
      profileData.openingHours =
        data.openingHours as Prisma.InputJsonValue;
    }

    if ("socialLinks" in data) {
      profileData.socialLinks =
        data.socialLinks as Prisma.InputJsonValue;
    }

    if ("coverImage" in data) {
      profileData.coverImage = data.coverImage;
    }

    return this.repository.updateProfile(
      businessId,
      profileData
    );
  }

  async delete(ownerId: string, businessId: string) {
    await this.getById(ownerId, businessId);

    await this.repository.softDelete(businessId);

    return {
      message: "Business deleted successfully.",
    };
  }
}