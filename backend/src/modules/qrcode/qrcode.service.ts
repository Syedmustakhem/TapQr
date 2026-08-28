import { AppError } from "../../cores/errors/AppError";

import {
  generateShortCode,
} from "../../utils/generateShortCode";

import {
  CreateQRCodeDTO,
  UpdateQRCodeDTO,
} from "./qrcode.types";

import {
  QRCodeRepository,
} from "./qrcode.repository";

import {
  BusinessRepository,
} from "../business/business.repository";

export class QRCodeService {
  private qrRepository =
    new QRCodeRepository();

  private businessRepository =
    new BusinessRepository();

  /**
   * Verify that the owner owns the business
   * and that the catalog belongs to that business.
   */
  private async verifyCatalogOwnership(
    catalogId: string,
    businessId: string,
    ownerId: string
  ) {
    const catalog =
      await this.qrRepository.findCatalogById(
        catalogId
      );

    if (!catalog) {
      throw new AppError(
        "Catalog not found.",
        404
      );
    }

    if (
      catalog.businessId !== businessId
    ) {
      throw new AppError(
        "Catalog does not belong to this business.",
        400
      );
    }

    const business =
      await this.businessRepository.findById(
        businessId
      );

    if (!business) {
      throw new AppError(
        "Business not found.",
        404
      );
    }

    if (
      business.ownerId !== ownerId
    ) {
      throw new AppError(
        "You are not authorized to use this catalog.",
        403
      );
    }

    if (!catalog.isActive) {
      throw new AppError(
        "Catalog is inactive.",
        400
      );
    }

    return catalog;
  }

  /**
   * Create QR Code.
   */
  async createQRCode(
    data: CreateQRCodeDTO
  ) {
    const business =
      await this.businessRepository.findById(
        data.businessId
      );

    if (!business) {
      throw new AppError(
        "Business not found.",
        404
      );
    }

    if (
      business.ownerId !==
      data.ownerId
    ) {
      throw new AppError(
        "You are not authorized to create QR Codes for this business.",
        403
      );
    }

    const experienceType =
      data.experienceType ??
      "BUSINESS";

    /**
     * Catalog is mandatory for
     * catalog-based experiences.
     */
    if (
      [
        "CATALOG",
        "MENU",
        "SERVICES",
        "PRODUCTS",
      ].includes(
        experienceType
      )
    ) {
      if (!data.catalogId) {
        throw new AppError(
          "Catalog is required for this QR experience.",
          400
        );
      }
    }

    if (data.catalogId) {
      await this.verifyCatalogOwnership(
        data.catalogId,
        data.businessId,
        data.ownerId
      );
    }

    /**
     * Redirect QR requires destination.
     */
    if (
      experienceType ===
        "REDIRECT" &&
      !data.destinationUrl
    ) {
      throw new AppError(
        "Destination URL is required for redirect QR codes.",
        400
      );
    }

    let shortCode =
      generateShortCode();

    while (
      await this.qrRepository.findByShortCode(
        shortCode
      )
    ) {
      shortCode =
        generateShortCode();
    }

    return this.qrRepository.create({
      business: {
        connect: {
          id: data.businessId,
        },
      },

      ...(data.catalogId && {
        catalog: {
          connect: {
            id: data.catalogId,
          },
        },
      }),

      name: data.name,

      description:
        data.description,

      type: data.type,

      destinationUrl:
        data.destinationUrl,

      shortCode,

      experienceType,

      enabledSections:
        data.enabledSections,
    });
  }

  /**
   * Resolve QR for public use.
   */
  async resolveQRCode(
    shortCode: string
  ) {
    const qrCode =
      await this.qrRepository.findByShortCode(
        shortCode
      );

    if (!qrCode) {
      throw new AppError(
        "QR Code not found.",
        404
      );
    }

    if (qrCode.deletedAt) {
      throw new AppError(
        "QR Code not found.",
        404
      );
    }

    if (
      qrCode.status !==
      "ACTIVE"
    ) {
      throw new AppError(
        "QR Code is not active.",
        410
      );
    }

    return qrCode;
  }

  /**
   * Get all QR codes.
   */
  async getBusinessQRCodes(
    businessId: string,
    ownerId: string
  ) {
    const business =
      await this.businessRepository.findById(
        businessId
      );

    if (!business) {
      throw new AppError(
        "Business not found.",
        404
      );
    }

    if (
      business.ownerId !== ownerId
    ) {
      throw new AppError(
        "You are not authorized to access this business.",
        403
      );
    }

    return this.qrRepository.findByBusinessId(
      businessId
    );
  }

  /**
   * Get QR by ID.
   */
  async getQRCodeById(
    id: string,
    ownerId: string
  ) {
    const qrCode =
      await this.qrRepository.findById(
        id
      );

    if (!qrCode) {
      throw new AppError(
        "QR Code not found.",
        404
      );
    }

    if (
      qrCode.business.ownerId !==
      ownerId
    ) {
      throw new AppError(
        "You are not authorized to access this QR Code.",
        403
      );
    }

    return qrCode;
  }

  /**
   * Update QR Code.
   */
  async updateQRCode(
    data: UpdateQRCodeDTO
  ) {
    const qrCode =
      await this.qrRepository.findById(
        data.id
      );

    if (!qrCode) {
      throw new AppError(
        "QR Code not found.",
        404
      );
    }

    if (
      qrCode.business.ownerId !==
      data.ownerId
    ) {
      throw new AppError(
        "You are not authorized to update this QR Code.",
        403
      );
    }

    const businessId =
      qrCode.businessId;

    if (
      data.catalogId !==
        undefined &&
      data.catalogId !== null
    ) {
      await this.verifyCatalogOwnership(
        data.catalogId,
        businessId,
        data.ownerId
      );
    }

    const experienceType =
      data.experienceType ??
      qrCode.experienceType;

    if (
      [
        "CATALOG",
        "MENU",
        "SERVICES",
        "PRODUCTS",
      ].includes(
        experienceType
      )
    ) {
      const catalogId =
        data.catalogId !==
        undefined
          ? data.catalogId
          : qrCode.catalogId;

      if (!catalogId) {
        throw new AppError(
          "Catalog is required for this QR experience.",
          400
        );
      }
    }

    if (
      experienceType ===
        "REDIRECT"
    ) {
      const destination =
        data.destinationUrl !==
        undefined
          ? data.destinationUrl
          : qrCode.destinationUrl;

      if (!destination) {
        throw new AppError(
          "Destination URL is required for redirect QR codes.",
          400
        );
      }
    }

    return this.qrRepository.update(
      data.id,
      {
        ...(data.catalogId !==
          undefined && {
          catalog:
            data.catalogId ===
            null
              ? {
                  disconnect: true,
                }
              : {
                  connect: {
                    id:
                      data.catalogId,
                  },
                },
        }),

        ...(data.name !==
          undefined && {
          name: data.name,
        }),

        ...(data.description !==
          undefined && {
          description:
            data.description,
        }),

        ...(data.destinationUrl !==
          undefined && {
          destinationUrl:
            data.destinationUrl,
        }),

        ...(data.experienceType !==
          undefined && {
          experienceType:
            data.experienceType,
        }),

        ...(data.enabledSections !==
          undefined && {
          enabledSections:
            data.enabledSections,
        }),

        ...(data.status !==
          undefined && {
          status:
            data.status,
        }),
      }
    );
  }

  /**
   * Delete QR Code.
   */
  async deleteQRCode(
    id: string,
    ownerId: string
  ) {
    const qrCode =
      await this.qrRepository.findById(
        id
      );

    if (!qrCode) {
      throw new AppError(
        "QR Code not found.",
        404
      );
    }

    if (
      qrCode.business.ownerId !==
      ownerId
    ) {
      throw new AppError(
        "You are not authorized to delete this QR Code.",
        403
      );
    }

    await this.qrRepository.softDelete(
      id
    );

    return {
      message:
        "QR Code deleted successfully.",
    };
  }
}