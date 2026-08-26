import { AppError } from "../../cores/errors/AppError";

import { AnalyticsRepository } from "./analytics.repository";

import {
  CreateScanEventDTO,
} from "./analytics.types";

import { QRCodeRepository } from "../qrcode/qrcode.repository";

import { BusinessRepository } from "../business/business.repository";

export class AnalyticsService {
  private analyticsRepository =
    new AnalyticsRepository();

  private qrCodeRepository =
    new QRCodeRepository();

  private businessRepository =
    new BusinessRepository();

  /**
   * Record QR scan
   */
  async recordScan(
    data: CreateScanEventDTO
  ) {
    const qrCode =
      await this.qrCodeRepository.findById(
        data.qrCodeId
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

    return this.analyticsRepository
      .createScanEventAndIncrementCount(
        data
      );
  }

  /**
   * Get QR scan history
   */
  async getQRCodeScans(
    qrCodeId: string,
    ownerId: string
  ) {
    const qrCode =
      await this.qrCodeRepository.findById(
        qrCodeId
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
        "Unauthorized.",
        403
      );
    }

    return this.analyticsRepository
      .findByQRCodeId(qrCodeId);
  }

  /**
   * Get QR scan count
   */
  async getQRCodeScanCount(
    qrCodeId: string,
    ownerId: string
  ) {
    const qrCode =
      await this.qrCodeRepository.findById(
        qrCodeId
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
        "Unauthorized.",
        403
      );
    }

    const total =
      await this.analyticsRepository
        .countByQRCodeId(qrCodeId);

    return {
      qrCodeId,
      totalScans: total,
    };
  }

  /**
   * Get business scan count
   */
  async getBusinessScanCount(
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
        "Unauthorized.",
        403
      );
    }

    const total =
      await this.analyticsRepository
        .countByBusinessId(
          businessId
        );

    return {
      businessId,
      totalScans: total,
    };
  }

  /**
   * Get business scan events
   */
  async getBusinessScans(
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
        "Unauthorized.",
        403
      );
    }

    return this.analyticsRepository
      .findByBusinessId(
        businessId
      );
  }

  /**
   * QR scans by date range
   */
  async getQRCodeScansByDateRange(
    qrCodeId: string,
    ownerId: string,
    from?: Date,
    to?: Date
  ) {
    const qrCode =
      await this.qrCodeRepository.findById(
        qrCodeId
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
        "Unauthorized.",
        403
      );
    }

    return this.analyticsRepository
      .findByQRCodeIdAndDateRange(
        qrCodeId,
        from,
        to
      );
  }

  /**
   * Business scans by date range
   */
  async getBusinessScansByDateRange(
    businessId: string,
    ownerId: string,
    from?: Date,
    to?: Date
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
        "Unauthorized.",
        403
      );
    }

    return this.analyticsRepository
      .findByBusinessIdAndDateRange(
        businessId,
        from,
        to
      );
  }
}