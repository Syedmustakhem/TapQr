import {
  QRExperienceType,
  QRSourceType,
} from "@prisma/client";

export type QRIntent =
  | "MENU"
  | "ORDER"
  | "PRODUCT"
  | "SERVICE"
  | "SUPPORT"
  | "CONTACT"
  | "EVENT"
  | "CAMPAIGN"
  | "FEEDBACK"
  | "GENERAL";

export interface QRIntentContext {
  experienceType: QRExperienceType;
  sourceType: QRSourceType;
  placementLabel?: string | null;
  locationLabel?: string | null;
  campaignName?: string | null;
}

export interface QRIntentResult {
  intent: QRIntent;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
}

class QRIntentService {
  detectIntent(
    context: QRIntentContext,
  ): QRIntentResult {
    const experienceType =
      context.experienceType;

    const sourceType =
      context.sourceType;

    const placement =
      context.placementLabel
        ?.trim()
        .toLowerCase() ?? "";

    const location =
      context.locationLabel
        ?.trim()
        .toLowerCase() ?? "";

    const campaign =
      context.campaignName
        ?.trim()
        .toLowerCase() ?? "";

    /*
     * ------------------------------------------------------------
     * 1. Explicit experience has the strongest signal.
     * ------------------------------------------------------------
     */

    switch (experienceType) {
      case "MENU":
        return {
          intent: "MENU",
          confidence: "HIGH",
          reason: "QR experience is configured as MENU.",
        };

      case "PRODUCTS":
        return {
          intent: "PRODUCT",
          confidence: "HIGH",
          reason: "QR experience is configured as PRODUCTS.",
        };

      case "SERVICES":
        return {
          intent: "SERVICE",
          confidence: "HIGH",
          reason: "QR experience is configured as SERVICES.",
        };

      case "CONTACT":
        return {
          intent: "CONTACT",
          confidence: "HIGH",
          reason: "QR experience is configured as CONTACT.",
        };

      case "CATALOG":
        return {
          intent: "PRODUCT",
          confidence: "HIGH",
          reason: "QR experience is configured as CATALOG.",
        };

      default:
        break;
    }

    /*
     * ------------------------------------------------------------
     * 2. QR source provides the next strongest signal.
     * ------------------------------------------------------------
     */

    switch (sourceType) {
      case "TABLE":
        return {
          intent: "MENU",
          confidence: "HIGH",
          reason: "QR source is TABLE.",
        };

      case "COUNTER":
        return {
          intent: "ORDER",
          confidence: "MEDIUM",
          reason: "QR source is COUNTER.",
        };

      case "TAKEAWAY":
        return {
          intent: "ORDER",
          confidence: "MEDIUM",
          reason: "QR source is TAKEAWAY.",
        };

      case "PACKAGING":
        return {
          intent: "SUPPORT",
          confidence: "MEDIUM",
          reason: "QR source is PACKAGING.",
        };

      case "POSTER":
      case "FLYER":
        return {
          intent: "CAMPAIGN",
          confidence: "MEDIUM",
          reason: "QR source is promotional material.",
        };

      case "BUSINESS_CARD":
        return {
          intent: "CONTACT",
          confidence: "HIGH",
          reason: "QR source is BUSINESS_CARD.",
        };

      case "EVENT":
        return {
          intent: "EVENT",
          confidence: "HIGH",
          reason: "QR source is EVENT.",
        };

      case "ADVERTISEMENT":
        return {
          intent: "CAMPAIGN",
          confidence: "MEDIUM",
          reason: "QR source is ADVERTISEMENT.",
        };

      case "SOCIAL_MEDIA":
      case "WEBSITE":
        return {
          intent: "CONTACT",
          confidence: "LOW",
          reason: "QR originated from a digital contact channel.",
        };

      default:
        break;
    }

    /*
     * ------------------------------------------------------------
     * 3. Placement/location labels.
     * ------------------------------------------------------------
     */

    const combinedText =
      `${placement} ${location} ${campaign}`;

    if (
      /\b(support|help|complaint|issue|problem)\b/.test(
        combinedText,
      )
    ) {
      return {
        intent: "SUPPORT",
        confidence: "MEDIUM",
        reason:
          "QR metadata contains support-related terms.",
      };
    }

    if (
      /\b(feedback|review|rating)\b/.test(
        combinedText,
      )
    ) {
      return {
        intent: "FEEDBACK",
        confidence: "MEDIUM",
        reason:
          "QR metadata contains feedback-related terms.",
      };
    }

    if (
      /\b(order|ordering|checkout|purchase)\b/.test(
        combinedText,
      )
    ) {
      return {
        intent: "ORDER",
        confidence: "MEDIUM",
        reason:
          "QR metadata contains order-related terms.",
      };
    }

    if (
      /\b(event|conference|wedding|expo|meetup)\b/.test(
        combinedText,
      )
    ) {
      return {
        intent: "EVENT",
        confidence: "MEDIUM",
        reason:
          "QR metadata contains event-related terms.",
      };
    }

    /*
     * ------------------------------------------------------------
     * 4. Safe default.
     * ------------------------------------------------------------
     */

    return {
      intent: "GENERAL",
      confidence: "LOW",
      reason:
        "No strong QR intent signal was detected.",
    };
  }
}

export const qrIntentService =
  new QRIntentService();