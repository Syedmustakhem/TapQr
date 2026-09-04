import { Response } from "express";

import { AuthRequest } from "../auth/auth.types";

import { ResponseHandler } from "../../cores/responses/ResponseHandler";

import { QRCodeService } from "./qrcode.service";

export class QRCodeController {
  private qrCodeService =
    new QRCodeService();

  /**
   * ============================================================
   * CREATE QR
   * ============================================================
   */

  createQRCode = async (
    req: AuthRequest,
    res: Response
  ) => {
    const result =
      await this.qrCodeService.createQRCode({
        ownerId: req.user!.id,
        ...req.body,
      });

    return ResponseHandler.created(
      res,
      "QR Code created successfully.",
      result
    );
  };

  /**
   * ============================================================
   * GET BUSINESS QRS
   * ============================================================
   */

  getBusinessQRCodes = async (
    req: AuthRequest,
    res: Response
  ) => {
    const businessId =
      String(
        req.params.businessId
      );

    const result =
      await this.qrCodeService.getBusinessQRCodes(
        businessId,
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "QR Codes retrieved successfully.",
      result
    );
  };

  /**
   * ============================================================
   * GET QR
   * ============================================================
   */

  getQRCodeById = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.qrCodeService.getQRCodeById(
        id,
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "QR Code retrieved successfully.",
      result
    );
  };

  /**
   * ============================================================
   * UPDATE QR
   * ============================================================
   */

  updateQRCode = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.qrCodeService.updateQRCode({
        id,
        ownerId: req.user!.id,
        ...req.body,
      });

    return ResponseHandler.success(
      res,
      "QR Code updated successfully.",
      result
    );
  };

  /**
   * ============================================================
   * DELETE QR
   * ============================================================
   */

  deleteQRCode = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.qrCodeService.deleteQRCode(
        id,
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "QR Code deleted successfully.",
      result
    );
  };

  /**
   * ============================================================
   * QR STUDIO - GET BRANDING
   * ============================================================
   */

  getQRBranding = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.qrCodeService.getQRBranding(
        id,
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "QR branding retrieved successfully.",
      result
    );
  };

  /**
   * ============================================================
   * QR STUDIO - UPDATE BRANDING
   * ============================================================
   */

  updateQRBranding = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.qrCodeService.updateQRBranding(
        id,
        req.user!.id,
        req.body
      );

    return ResponseHandler.success(
      res,
      "QR branding updated successfully.",
      result
    );
  };
}