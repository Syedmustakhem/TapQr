import { prisma } from "../../config/prisma";

class QRConversationConversionService {
  async recordWhatsAppConversationConversion(input: {
    qrCodeId: string;
    conversationId: string;
    visitorKey?: string | null;
  }) {
    const existing =
      await prisma.qRConversion.findFirst({
        where: {
          qrCodeId: input.qrCodeId,
          conversationId: input.conversationId,
          conversionType: "WHATSAPP",
        },
      });

    if (existing) {
      return {
        conversion: existing,
        duplicate: true,
      };
    }

    const conversion =
      await prisma.qRConversion.create({
        data: {
          qrCodeId: input.qrCodeId,
          conversationId: input.conversationId,
          conversionType: "WHATSAPP",
          externalId: `conversation:${input.conversationId}`,
          visitorKey:
            input.visitorKey ?? null,
        },
      });

    return {
      conversion,
      duplicate: false,
    };
  }
}

export const qrConversationConversionService =
  new QRConversationConversionService();