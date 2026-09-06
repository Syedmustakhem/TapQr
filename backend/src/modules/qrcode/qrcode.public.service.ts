import { Request } from "express";

import { AppError } from "../../cores/errors/AppError";
import { prisma } from "../../config/prisma";

import { AnalyticsService } from "../analytics/analytics.service";

import {
  buildQRRoutingContext,
} from "../qrrules/qr-rules.context";

import {
  QRRoutingEngine,
} from "../qrrules/qr-rules.engine";

import {
  createReviewVerificationToken,
} from "./review-verification";

/**
 * ============================================================
 * PUBLIC CATALOG INCLUDE
 * ============================================================
 */

const catalogInclude = {
  categories: {
    where: {
      isActive: true,
    },

    orderBy: [
      {
        sortOrder: "asc" as const,
      },
      {
        createdAt: "asc" as const,
      },
    ],

    include: {
      items: {
        where: {
          isAvailable: true,
          deletedAt: null,
        },

        orderBy: [
          {
            sortOrder: "asc" as const,
          },
          {
            createdAt: "asc" as const,
          },
        ],

        include: {
          variants: {
            where: {
              isAvailable: true,
            },

            orderBy: [
              {
                sortOrder: "asc" as const,
              },
              {
                createdAt: "asc" as const,
              },
            ],
          },

          optionGroups: {
            orderBy: [
              {
                sortOrder: "asc" as const,
              },
              {
                createdAt: "asc" as const,
              },
            ],

            include: {
              options: {
                where: {
                  isAvailable: true,
                },

                orderBy: [
                  {
                    sortOrder: "asc" as const,
                  },
                  {
                    createdAt: "asc" as const,
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
};

/**
 * ============================================================
 * SERVICE
 * ============================================================
 */

export class QRCodePublicService {
  private readonly analyticsService =
    new AnalyticsService();

  private readonly routingEngine =
    new QRRoutingEngine();

  /**
   * ============================================================
   * GET PUBLIC QR EXPERIENCE
   * ============================================================
   *
   * Flow:
   *
   * shortCode
   *      ↓
   * QR lookup
   *      ↓
   * Business lookup
   *      ↓
   * Build routing context
   *      ↓
   * Smart Rule Engine
   *      ↓
   * Selected action
   *      ↓
   * Public experience
   *
   * Existing QRs without rules continue
   * to use their normal experience.
   */
  async getGuestExperience(
    shortCode: string,
    req: Request
  ) {
    const code =
      shortCode.trim();

    if (!code) {
      throw new AppError(
        "QR code is required.",
        400,
        "QR_CODE_REQUIRED"
      );
    }

    /**
     * ==========================================================
     * STEP 1 — LOAD BASIC QR
     * ==========================================================
     */

    const baseQR =
      await prisma.qRCode.findUnique({
        where: {
          shortCode: code,
        },

        select: {
          id: true,
          status: true,
          deletedAt: true,

          catalogId: true,

          experienceType: true,

          destinationUrl: true,

          businessId: true,

          sourceType: true,

          placementLabel: true,

          locationLabel: true,

          campaignName: true,

          scanCount: true,
        },
      });

    if (!baseQR) {
      throw new AppError(
        "QR Code not found.",
        404,
        "QR_NOT_FOUND"
      );
    }

    if (baseQR.deletedAt) {
      throw new AppError(
        "QR Code not found.",
        404,
        "QR_NOT_FOUND"
      );
    }

    if (
      baseQR.status !== "ACTIVE"
    ) {
      throw new AppError(
        "This QR Code is currently unavailable.",
        410,
        "QR_NOT_ACTIVE"
      );
    }

    /**
     * ==========================================================
     * STEP 2 — LOAD BUSINESS ROUTING DATA
     * ==========================================================
     */

    const businessForRouting =
      await prisma.business.findUnique({
        where: {
          id: baseQR.businessId,
        },

        select: {
          id: true,

          status: true,

          profile: {
            select: {
              openingHours: true,
              timezone: true,
            },
          },
        },
      });

    if (!businessForRouting) {
      throw new AppError(
        "Business not found.",
        404,
        "BUSINESS_NOT_FOUND"
      );
    }

    /**
     * ==========================================================
     * STEP 3 — BUILD SMART ROUTING CONTEXT
     * ==========================================================
     */

    let routingResult:
      | Awaited<
          ReturnType<
            QRRoutingEngine["resolve"]
          >
        >
      | null = null;

    try {
      const routingContext =
        buildQRRoutingContext({
          req,

          qrCodeId:
            baseQR.id,

          businessId:
            businessForRouting.id,

          scanCount:
            baseQR.scanCount,

          sourceType:
            baseQR.sourceType,

          placementLabel:
            baseQR.placementLabel,

          locationLabel:
            baseQR.locationLabel,

          campaignName:
            baseQR.campaignName,

          catalogId:
            baseQR.catalogId,

          timezone:
            businessForRouting
              .profile
              ?.timezone ??
            "UTC",

          /**
           * We deliberately don't infer
           * OPEN/CLOSED from BusinessStatus.
           *
           * BusinessStatus represents the
           * platform/business lifecycle.
           *
           * Actual operational state can later
           * be supplied from a dedicated business
           * state service.
           */
          businessState:
            undefined,
        });

      routingResult =
        await this.routingEngine.resolve({
          qrCodeId:
            baseQR.id,

          context:
            routingContext,

          options: {
            includeTrace: false,
          },
        });
    } catch (error) {
      /**
       * Smart routing must never make
       * an otherwise valid QR unusable.
       *
       * If the engine fails, the normal QR
       * experience remains available.
       */
      console.error(
        "[QR Routing] Engine failed. Falling back to default QR experience.",
        error
      );
    }

    /**
     * ==========================================================
     * STEP 4 — RESOLVE FINAL EXPERIENCE
     * ==========================================================
     */

    let resolvedExperienceType =
      baseQR.experienceType;

    let resolvedCatalogId =
      baseQR.catalogId;

    let resolvedDestinationUrl =
      baseQR.destinationUrl;

    let routingMetadata:
      | Record<string, unknown>
      | null = null;

    if (
      routingResult &&
      routingResult.status ===
        "MATCHED" &&
      routingResult.action
    ) {
      const action =
        routingResult.action;

      routingMetadata = {
        matched: true,

        actionType:
          action.type,

        actionValue:
          action.value,

        ruleId:
          routingResult.ruleId ??
          null,

        ruleVersion:
          routingResult.ruleVersion ??
          null,

        experimentId:
          routingResult.experimentId ??
          null,

        variantId:
          routingResult.variantId ??
          null,
      };

      switch (
        action.type
      ) {
        /**
         * EXPERIENCE
         */
        case "EXPERIENCE": {
          if (action.value) {
            resolvedExperienceType =
              action.value as typeof resolvedExperienceType;
          }

          break;
        }

        /**
         * CATALOG-BASED EXPERIENCES
         */
        case "CATALOG":
        case "MENU":
        case "SERVICES":
        case "PRODUCTS": {
          if (action.value) {
            resolvedCatalogId =
              action.value;
          }

          resolvedExperienceType =
            action.type as typeof resolvedExperienceType;

          break;
        }

        /**
         * REDIRECT
         */
        case "REDIRECT": {
          if (action.value) {
            resolvedDestinationUrl =
              action.value;
          }

          break;
        }

        /**
         * Other action types are
         * currently returned as routing
         * metadata without changing the
         * existing public experience.
         */
        case "CONTACT":
        case "CAMPAIGN":
        case "CUSTOM":
        default:
          break;
      }
    }

    /**
     * ==========================================================
     * STEP 5 — DETERMINE CATALOG
     * ==========================================================
     */

    const catalogExperienceTypes = [
      "CATALOG",
      "MENU",
      "SERVICES",
      "PRODUCTS",
    ];

    const useSelectedCatalog =
      catalogExperienceTypes.includes(
        resolvedExperienceType
      );

    /**
     * ==========================================================
     * STEP 6 — LOAD FULL PUBLIC EXPERIENCE
     * ==========================================================
     */

    const qrCode =
      await prisma.qRCode.findUnique({
        where: {
          id: baseQR.id,
        },

        include: {
          branding: true,

          business: {
            include: {
              profile: true,

              catalogs: {
                where: {
                  isActive: true,

                  ...(useSelectedCatalog &&
                  resolvedCatalogId
                    ? {
                        id:
                          resolvedCatalogId,
                      }
                    : {}),
                },

                orderBy: [
                  {
                    sortOrder: "asc",
                  },
                  {
                    createdAt: "asc",
                  },
                ],

                include:
                  catalogInclude,
              },
            },
          },
        },
      });

    if (!qrCode?.business) {
      throw new AppError(
        "Business not found.",
        404,
        "BUSINESS_NOT_FOUND"
      );
    }

    const business =
      qrCode.business;

    /**
     * ==========================================================
     * STEP 7 — PUBLIC RESPONSE
     * ==========================================================
     */

    return {
      qr: {
        id:
          qrCode.id,

        name:
          qrCode.name,

        description:
          qrCode.description,

        type:
          qrCode.type,

        experienceType:
          resolvedExperienceType,

        shortCode:
          qrCode.shortCode,

        enabledSections:
          qrCode.enabledSections,

        catalogId:
          resolvedCatalogId,

        destinationUrl:
          resolvedDestinationUrl,

        sourceType:
          qrCode.sourceType,

        placementLabel:
          qrCode.placementLabel,

        locationLabel:
          qrCode.locationLabel,

        campaignName:
          qrCode.campaignName,
      },

      /**
       * Routing information is intentionally
       * limited to safe public metadata.
       *
       * The complete evaluator trace is never
       * exposed to the public client.
       */
      routing:
        routingMetadata,

      branding:
        qrCode.branding
          ? {
              primaryColor:
                qrCode.branding
                  .primaryColor,

              secondaryColor:
                qrCode.branding
                  .secondaryColor,

              backgroundColor:
                qrCode.branding
                  .backgroundColor,

              qrForegroundColor:
                qrCode.branding
                  .qrForegroundColor,

              qrBackgroundColor:
                qrCode.branding
                  .qrBackgroundColor,

              logoUrl:
                qrCode.branding
                  .logoUrl,

              coverImageUrl:
                qrCode.branding
                  .coverImageUrl,

              buttonStyle:
                qrCode.branding
                  .buttonStyle,

              fontFamily:
                qrCode.branding
                  .fontFamily,
            }
          : null,

      business: {
        id:
          business.id,

        name:
          business.name,

        slug:
          business.slug,

        email:
          business.email,

        phone:
          business.phone,

        logo:
          business.logo,

        description:
          business.description,

        profile:
          business.profile
            ? {
                tagline:
                  business.profile
                    .tagline,

                description:
                  business.profile
                    .description,

                website:
                  business.profile
                    .website,

                email:
                  business.profile
                    .email,

                phone:
                  business.profile
                    .phone,

                whatsapp:
                  business.profile
                    .whatsapp,

                externalReviewUrl:
                  business.profile
                    .externalReviewUrl,

                address: {
                  line1:
                    business.profile
                      .addressLine1,

                  line2:
                    business.profile
                      .addressLine2,

                  city:
                    business.profile
                      .city,

                  state:
                    business.profile
                      .state,

                  postalCode:
                    business.profile
                      .postalCode,

                  country:
                    business.profile
                      .country,
                },

                location: {
                  latitude:
                    business.profile
                      .latitude,

                  longitude:
                    business.profile
                      .longitude,
                },

                openingHours:
                  business.profile
                    .openingHours,

                socialLinks:
                  business.profile
                    .socialLinks,

                coverImage:
                  business.profile
                    .coverImage,
              }
            : null,

        catalogs:
          business.catalogs.map(
            (catalog) => ({
              id:
                catalog.id,

              name:
                catalog.name,

              description:
                catalog.description,

              type:
                catalog.type,

              categories:
                catalog.categories.map(
                  (category) => ({
                    id:
                      category.id,

                    name:
                      category.name,

                    description:
                      category.description,

                    image:
                      category.image,

                    items:
                      category.items.map(
                        (item) => ({
                          id:
                            item.id,

                          name:
                            item.name,

                          description:
                            item.description,

                          type:
                            item.type,

                          price:
                            item.price,

                          compareAtPrice:
                            item.compareAtPrice,

                          currency:
                            item.currency,

                          image:
                            item.image,

                          gallery:
                            item.gallery,

                          sku:
                            item.sku,

                          unit:
                            item.unit,

                          stock:
                            item.stock,

                          durationMinutes:
                            item.durationMinutes,

                          isAvailable:
                            item.isAvailable,

                          isFeatured:
                            item.isFeatured,

                          metadata:
                            item.metadata,

                          variants:
                            item.variants.map(
                              (variant) => ({
                                id:
                                  variant.id,

                                name:
                                  variant.name,

                                price:
                                  variant.price,

                                compareAtPrice:
                                  variant.compareAtPrice,

                                sku:
                                  variant.sku,

                                stock:
                                  variant.stock,

                                isAvailable:
                                  variant.isAvailable,
                              })
                            ),

                          optionGroups:
                            item.optionGroups.map(
                              (group) => ({
                                id:
                                  group.id,

                                name:
                                  group.name,

                                required:
                                  group.required,

                                minSelect:
                                  group.minSelect,

                                maxSelect:
                                  group.maxSelect,

                                options:
                                  group.options.map(
                                    (option) => ({
                                      id:
                                        option.id,

                                      name:
                                        option.name,

                                      price:
                                        option.price,

                                      isAvailable:
                                        option.isAvailable,
                                    })
                                  ),
                              })
                            ),
                        })
                      ),
                  })
                ),
            })
          ),
      },
    };
  }

  /**
   * ============================================================
   * RECORD QR SCAN
   * ============================================================
   */

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
    const code =
      shortCode.trim();

    if (!code) {
      throw new AppError(
        "QR code is required.",
        400,
        "QR_CODE_REQUIRED"
      );
    }

    const qrCode =
      await prisma.qRCode.findUnique({
        where: {
          shortCode: code,
        },

        select: {
          id: true,

          status: true,

          deletedAt: true,

          sourceType: true,
        },
      });

    if (!qrCode) {
      throw new AppError(
        "QR Code not found.",
        404,
        "QR_NOT_FOUND"
      );
    }

    if (
      qrCode.deletedAt ||
      qrCode.status !== "ACTIVE"
    ) {
      throw new AppError(
        "QR Code is not active.",
        410,
        "QR_NOT_ACTIVE"
      );
    }

    /**
     * ==========================================================
     * RECORD ANALYTICS
     * ==========================================================
     */

    const scan =
      await this.analyticsService.recordScan({
        qrCodeId:
          qrCode.id,

        ipAddress:
          data.ipAddress,

        userAgent:
          data.userAgent,

        referrer:
          data.referrer,

        browser:
          data.browser,

        device:
          data.device,

        operatingSystem:
          data.operatingSystem,
      });

    if (!scan?.id) {
      return {
        recorded: false,

        verificationToken:
          null,
      };
    }

    /**
     * ==========================================================
     * SNAPSHOT SOURCE + LAST SCAN
     * ==========================================================
     */

    await prisma.$transaction([
      prisma.scanEvent.update({
        where: {
          id: scan.id,
        },

        data: {
          sourceTypeSnapshot:
            qrCode.sourceType,
        },
      }),

      prisma.qRCode.update({
        where: {
          id: qrCode.id,
        },

        data: {
          lastScannedAt:
            new Date(),
        },
      }),
    ]);

    /**
     * ==========================================================
     * REVIEW VERIFICATION TOKEN
     * ==========================================================
     */

    return {
      recorded: true,

      verificationToken:
        createReviewVerificationToken({
          scanEventId:
            scan.id,

          qrCodeId:
            qrCode.id,

          ttlSeconds:
            15 * 60,
        }),
    };
  }

  /**
   * ============================================================
   * GET REDIRECT TARGET
   * ============================================================
   */

  async getRedirectTarget(
    shortCode: string
  ) {
    const code =
      shortCode.trim();

    if (!code) {
      throw new AppError(
        "QR code is required.",
        400,
        "QR_CODE_REQUIRED"
      );
    }

    const qrCode =
      await prisma.qRCode.findUnique({
        where: {
          shortCode: code,
        },

        select: {
          id: true,

          status: true,

          deletedAt: true,

          destinationUrl: true,
        },
      });

    if (!qrCode) {
      throw new AppError(
        "QR Code not found.",
        404,
        "QR_NOT_FOUND"
      );
    }

    if (
      qrCode.deletedAt ||
      qrCode.status !== "ACTIVE"
    ) {
      throw new AppError(
        "QR Code is not active.",
        410,
        "QR_NOT_ACTIVE"
      );
    }

    if (!qrCode.destinationUrl) {
      throw new AppError(
        "This QR code has no redirect destination.",
        409,
        "QR_DESTINATION_MISSING"
      );
    }

    return qrCode;
  }
}