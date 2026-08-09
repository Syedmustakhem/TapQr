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
   * Record a QR scan.
   *
   * This is used by the PUBLIC QR redirect.
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
   * Get scan history for one QR code.
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

    if (
      qrCode.business.ownerId !==
      ownerId
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
   * Get scan count for one QR code.
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

    if (
      qrCode.business.ownerId !==
      ownerId
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
   * Get total scans for a business.
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
   * Get all business scan events.
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
   * Get QR scans within a date range.
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

    if (
      qrCode.business.ownerId !==
      ownerId
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
   * Get business scans within a date range.
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