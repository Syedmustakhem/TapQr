import {
  CampaignStatus,
  QRStatus,
} from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../cores/errors/AppError";

export type QRMaintenanceStatus =
  | "HEALTHY"
  | "WARNING"
  | "CRITICAL";

export type QRMaintenanceIssueCode =
  | "QR_INACTIVE"
  | "QR_DELETED"
  | "DESTINATION_MISSING"
  | "DESTINATION_INVALID"
  | "CAMPAIGN_INACTIVE"
  | "CAMPAIGN_MISSING"
  | "CATALOG_MISSING";

export interface QRMaintenanceIssue {
  code: QRMaintenanceIssueCode;
  severity: "WARNING" | "CRITICAL";
  message: string;
}

export interface QRMaintenanceResult {
  qrCodeId: string;
  status: QRMaintenanceStatus;
  issues: QRMaintenanceIssue[];

  checks: {
    qrActive: boolean;
    qrDeleted: boolean;
    destinationValid: boolean;
    campaignValid: boolean;
    catalogValid: boolean;
    routingAvailable: boolean;
  };

  metadata: {
    name: string;
    shortCode: string;
    experienceType: string;
    sourceType: string;
    scanCount: number;
    lastScannedAt: Date | null;
  };
}

class QRMaintenanceService {
  async checkQRCode(
    businessId: string,
    qrCodeId: string,
  ): Promise<QRMaintenanceResult> {
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        id: qrCodeId,
        businessId,
      },

      select: {
        id: true,
        name: true,
        shortCode: true,
        status: true,
        deletedAt: true,
        destinationUrl: true,
        experienceType: true,
        sourceType: true,
        catalogId: true,
        campaignId: true,
        scanCount: true,
        lastScannedAt: true,

        campaign: {
          select: {
            id: true,
            status: true,
          },
        },

        catalog: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!qrCode) {
      throw new AppError("QR code not found", 404);
    }

    const issues: QRMaintenanceIssue[] = [];

    // ---------------------------------------------------------
    // QR STATUS
    // ---------------------------------------------------------

    const qrActive =
      qrCode.status === QRStatus.ACTIVE;

    const qrDeleted =
      qrCode.deletedAt !== null;

    if (qrDeleted) {
      issues.push({
        code: "QR_DELETED",
        severity: "CRITICAL",
        message: "This QR code has been deleted.",
      });
    } else if (!qrActive) {
      issues.push({
        code: "QR_INACTIVE",
        severity: "CRITICAL",
        message: "This QR code is not active.",
      });
    }

    // ---------------------------------------------------------
    // DESTINATION
    // ---------------------------------------------------------

    let destinationValid = true;

    if (qrCode.experienceType === "REDIRECT") {
      if (!qrCode.destinationUrl) {
        destinationValid = false;

        issues.push({
          code: "DESTINATION_MISSING",
          severity: "CRITICAL",
          message:
            "This redirect QR code does not have a destination URL.",
        });
      } else {
        try {
          const url = new URL(
            qrCode.destinationUrl,
          );

          const validProtocol =
            url.protocol === "http:" ||
            url.protocol === "https:";

          if (!validProtocol) {
            destinationValid = false;

            issues.push({
              code: "DESTINATION_INVALID",
              severity: "CRITICAL",
              message:
                "The QR destination URL must use HTTP or HTTPS.",
            });
          }
        } catch {
          destinationValid = false;

          issues.push({
            code: "DESTINATION_INVALID",
            severity: "CRITICAL",
            message:
              "The QR destination URL is invalid.",
          });
        }
      }
    }

    // ---------------------------------------------------------
    // CAMPAIGN
    // ---------------------------------------------------------

    let campaignValid = true;

    if (qrCode.campaignId) {
      if (!qrCode.campaign) {
        campaignValid = false;

        issues.push({
          code: "CAMPAIGN_MISSING",
          severity: "WARNING",
          message:
            "This QR code references a campaign that no longer exists.",
        });
      } else if (
        qrCode.campaign.status !==
        CampaignStatus.ACTIVE
      ) {
        campaignValid = false;

        issues.push({
          code: "CAMPAIGN_INACTIVE",
          severity: "WARNING",
          message:
            "The campaign attached to this QR code is not active.",
        });
      }
    }

    // ---------------------------------------------------------
    // CATALOG
    // ---------------------------------------------------------

    let catalogValid = true;

    if (qrCode.catalogId) {
      if (!qrCode.catalog) {
        catalogValid = false;

        issues.push({
          code: "CATALOG_MISSING",
          severity: "CRITICAL",
          message:
            "This QR code references a catalog that no longer exists.",
        });
      }
    }

    // ---------------------------------------------------------
    // ROUTING
    // ---------------------------------------------------------

    const routingAvailable =
      Boolean(qrCode.experienceType);

    // ---------------------------------------------------------
    // FINAL STATUS
    // ---------------------------------------------------------

    const hasCriticalIssues =
      issues.some(
        (issue) =>
          issue.severity === "CRITICAL",
      );

    const hasWarnings =
      issues.some(
        (issue) =>
          issue.severity === "WARNING",
      );

    let status: QRMaintenanceStatus =
      "HEALTHY";

    if (hasCriticalIssues) {
      status = "CRITICAL";
    } else if (hasWarnings) {
      status = "WARNING";
    }

    return {
      qrCodeId: qrCode.id,

      status,

      issues,

      checks: {
        qrActive,
        qrDeleted,
        destinationValid,
        campaignValid,
        catalogValid,
        routingAvailable,
      },

      metadata: {
        name: qrCode.name,
        shortCode: qrCode.shortCode,
        experienceType:
          qrCode.experienceType,
        sourceType: qrCode.sourceType,
        scanCount: qrCode.scanCount,
        lastScannedAt:
          qrCode.lastScannedAt,
      },
    };
  }
}

export const qrMaintenanceService =
  new QRMaintenanceService();