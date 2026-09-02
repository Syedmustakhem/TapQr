import { AppError } from "../../cores/errors/AppError";
import { prisma } from "../../config/prisma";
import { AnalyticsService } from "../analytics/analytics.service";
import { createReviewVerificationToken } from "./review-verification";

export class QRCodePublicService {
  private readonly analyticsService = new AnalyticsService();

  async getGuestExperience(shortCode: string) {
    const code = shortCode.trim();

    if (!code) {
      throw new AppError("QR code is required.", 400, "QR_CODE_REQUIRED");
    }

    const qrCode = await prisma.qRCode.findUnique({
      where: { shortCode: code },
      include: {
        branding: true,
        business: {
          include: {
            profile: true,
            catalogs: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
              include: {
                categories: {
                  where: { isActive: true },
                  orderBy: { sortOrder: "asc" },
                  include: {
                    items: {
                      where: { isAvailable: true, deletedAt: null },
                      orderBy: { sortOrder: "asc" },
                      include: {
                        variants: {
                          where: { isAvailable: true },
                          orderBy: { sortOrder: "asc" },
                        },
                        optionGroups: {
                          orderBy: { sortOrder: "asc" },
                          include: {
                            options: {
                              where: { isAvailable: true },
                              orderBy: { sortOrder: "asc" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!qrCode) {
      throw new AppError("QR Code not found.", 404, "QR_NOT_FOUND");
    }

    if (qrCode.deletedAt || qrCode.status !== "ACTIVE") {
      throw new AppError(
        "This QR Code is currently unavailable.",
        410,
        "QR_NOT_ACTIVE"
      );
    }

    if (!qrCode.business) {
      throw new AppError("Business not found.", 404, "BUSINESS_NOT_FOUND");
    }

    const business = qrCode.business;

    return {
      qr: {
        id: qrCode.id,
        name: qrCode.name,
        description: qrCode.description,
        type: qrCode.type,
        experienceType: qrCode.experienceType,
        shortCode: qrCode.shortCode,
        enabledSections: qrCode.enabledSections,
      },
      branding: qrCode.branding
        ? {
            primaryColor: qrCode.branding.primaryColor,
            secondaryColor: qrCode.branding.secondaryColor,
            backgroundColor: qrCode.branding.backgroundColor,
            qrForegroundColor: qrCode.branding.qrForegroundColor,
            qrBackgroundColor: qrCode.branding.qrBackgroundColor,
            logoUrl: qrCode.branding.logoUrl,
            coverImageUrl: qrCode.branding.coverImageUrl,
            buttonStyle: qrCode.branding.buttonStyle,
            fontFamily: qrCode.branding.fontFamily,
          }
        : null,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        email: business.email,
        phone: business.phone,
        logo: business.logo,
        description: business.description,
        profile: business.profile
          ? {
              tagline: business.profile.tagline,
              description: business.profile.description,
              website: business.profile.website,
              email: business.profile.email,
              phone: business.profile.phone,
              whatsapp: business.profile.whatsapp,
              externalReviewUrl: business.profile.externalReviewUrl,
              address: {
                line1: business.profile.addressLine1,
                line2: business.profile.addressLine2,
                city: business.profile.city,
                state: business.profile.state,
                postalCode: business.profile.postalCode,
                country: business.profile.country,
              },
              location: {
                latitude: business.profile.latitude,
                longitude: business.profile.longitude,
              },
              openingHours: business.profile.openingHours,
              socialLinks: business.profile.socialLinks,
              coverImage: business.profile.coverImage,
            }
          : null,
        catalogs: business.catalogs.map((catalog) => ({
          id: catalog.id,
          name: catalog.name,
          description: catalog.description,
          type: catalog.type,
          categories: catalog.categories.map((category) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            image: category.image,
            items: category.items.map((item) => ({
              id: item.id,
              name: item.name,
              description: item.description,
              type: item.type,
              price: item.price,
              compareAtPrice: item.compareAtPrice,
              currency: item.currency,
              image: item.image,
              gallery: item.gallery,
              sku: item.sku,
              unit: item.unit,
              stock: item.stock,
              durationMinutes: item.durationMinutes,
              isAvailable: item.isAvailable,
              isFeatured: item.isFeatured,
              metadata: item.metadata,
              variants: item.variants.map((variant) => ({
                id: variant.id,
                name: variant.name,
                price: variant.price,
                compareAtPrice: variant.compareAtPrice,
                sku: variant.sku,
                stock: variant.stock,
                isAvailable: variant.isAvailable,
              })),
              optionGroups: item.optionGroups.map((group) => ({
                id: group.id,
                name: group.name,
                required: group.required,
                minSelect: group.minSelect,
                maxSelect: group.maxSelect,
                options: group.options.map((option) => ({
                  id: option.id,
                  name: option.name,
                  price: option.price,
                  isAvailable: option.isAvailable,
                })),
              })),
            })),
          })),
        })),
      },
    };
  }

  async recordScan(
    shortCode: string,
    data: {
      ipAddress?: string;
      userAgent?: string;
      referrer?: string;
      browser?: string;
      device?: string;
      operatingSystem?: string;
    }
  ) {
    const code = shortCode.trim();

    if (!code) {
      throw new AppError("QR code is required.", 400, "QR_CODE_REQUIRED");
    }

    const qrCode = await prisma.qRCode.findUnique({
      where: { shortCode: code },
      select: {
        id: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!qrCode) {
      throw new AppError("QR Code not found.", 404, "QR_NOT_FOUND");
    }

    if (qrCode.deletedAt || qrCode.status !== "ACTIVE") {
      throw new AppError("QR Code is not active.", 410, "QR_NOT_ACTIVE");
    }

    const scan = await this.analyticsService.recordScan({
      qrCodeId: qrCode.id,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      referrer: data.referrer,
      browser: data.browser,
      device: data.device,
      operatingSystem: data.operatingSystem,
    });

    if (!scan?.id) {
      return { recorded: false, verificationToken: null };
    }

    return {
      recorded: true,
      verificationToken: createReviewVerificationToken({
        scanEventId: scan.id,
        qrCodeId: qrCode.id,
        ttlSeconds: 15 * 60,
      }),
    };
  }
}
