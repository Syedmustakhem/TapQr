import { AppError } from "../../cores/errors/AppError";

import { generateShortCode } from "../../utils/generateShortCode";

import {
  CreateQRCodeDTO,
  UpdateQRCodeDTO,
} from "./qrcode.types";

import { QRCodeRepository } from "./qrcode.repository";

import { BusinessRepository } from "../business/business.repository";

export class QRCodeService {
  private qrRepository =
    new QRCodeRepository();

  private businessRepository =
    new BusinessRepository();

  /**
   * Create QR Code
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

    const qrCode =
      await this.qrRepository.create({
        business: {
          connect: {
            id: data.businessId,
          },
        },

        name: data.name,

        description:
          data.description,

        destinationUrl:
          data.destinationUrl,

        type: data.type,

        shortCode,
      });

    return qrCode;
  }

  /**
   * Resolve public QR code
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

    if (qrCode.status !== "ACTIVE") {
      throw new AppError(
        "QR Code is not active.",
        410
      );
    }

    return {
      qrCodeId: qrCode.id,
      destinationUrl:
        qrCode.destinationUrl,
    };
  }

  /**
   * Get All QR Codes
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
   * Get Single QR Code
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

    const business =
      await this.businessRepository.findById(
        qrCode.businessId
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
        "You are not authorized to access this QR Code.",
        403
      );
    }

    return qrCode;
  }

  /**
   * Update QR Code
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

    const business =
      await this.businessRepository.findById(
        qrCode.businessId
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
        "You are not authorized to update this QR Code.",
        403
      );
    }

    return this.qrRepository.update(
      data.id,
      {
        name: data.name,
        description:
          data.description,
        destinationUrl:
          data.destinationUrl,
        status: data.status,
      }
    );
  }

  /**
   * Delete QR Code
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

    const business =
      await this.businessRepository.findById(
        qrCode.businessId
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