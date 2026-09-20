import { prisma } from "../../../config/prisma";

const QR_MARKER_PREFIX = "TapQR QR:";

class WhatsAppQRAttributionService {
  /**
   * Creates the prefilled WhatsApp message used by a QR action.
   *
   * Example:
   * TapQR QR:ABC123
   *
   * The marker lets the inbound webhook identify
   * which QR initiated the conversation.
   */
  buildPrefilledMessage(shortCode: string): string {
    const code = shortCode.trim();

    return `${QR_MARKER_PREFIX}${code}`;
  }

  /**
   * Extracts a TapQR QR short code from an inbound
   * WhatsApp message.
   */
  extractShortCode(text?: string | null): string | null {
    if (!text) {
      return null;
    }

    const match = text.match(
      /TapQR\s+QR\s*:\s*([A-Za-z0-9_-]+)/i,
    );

    return match?.[1]?.trim() || null;
  }

  /**
   * Removes the attribution marker from the customer-facing
   * message while preserving the customer's actual text.
   */
  cleanCustomerText(text?: string | null): string | null {
    if (!text) {
      return null;
    }

    const cleaned = text
      .replace(
        /TapQR\s+QR\s*:\s*[A-Za-z0-9_-]+/i,
        "",
      )
      .replace(/\s{2,}/g, " ")
      .trim();

    return cleaned || null;
  }

  /**
   * Resolves a QR only inside the authenticated WhatsApp
   * business context.
   */
  async resolveQRCode(
    businessId: string,
    shortCode?: string | null,
  ) {
    if (!shortCode) {
      return null;
    }

    return prisma.qRCode.findFirst({
      where: {
        businessId,
        shortCode,
        status: "ACTIVE",
        deletedAt: null,
      },
      select: {
        id: true,
        businessId: true,
        shortCode: true,
        name: true,
        campaignId: true,
        campaignName: true,
        sourceType: true,
        placementLabel: true,
        locationLabel: true,
      },
    });
  }
}

export const whatsappQRAttributionService =
  new WhatsAppQRAttributionService();