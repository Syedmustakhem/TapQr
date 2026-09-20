import axios from "axios";
import { prisma } from "../../../config/prisma";

interface WhatsAppMediaInfo {
  id: string;
  url: string;
  mimeType?: string | null;
  sha256?: string | null;
  fileSize?: number | null;
  messagingProduct?: string | null;
}

class WhatsAppMediaService {
  private getAccessToken(): string {
    const token =
      process.env.WHATSAPP_ACCESS_TOKEN?.trim();

    if (!token) {
      throw new Error(
        "WHATSAPP_ACCESS_TOKEN is not configured",
      );
    }

    return token;
  }

  private getApiVersion(): string {
    return (
      process.env.WHATSAPP_API_VERSION?.trim() ||
      "v23.0"
    );
  }

  /**
   * Resolve a WhatsApp media ID into
   * Meta's temporary media URL.
   */
  async getMediaInfo(
    mediaId: string,
  ): Promise<WhatsAppMediaInfo> {
    if (!mediaId) {
      throw new Error("WhatsApp media ID is required");
    }

    const token = this.getAccessToken();
    const apiVersion = this.getApiVersion();

    const response = await axios.get(
      `https://graph.facebook.com/${apiVersion}/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      },
    );

    return {
      id: mediaId,
      url: response.data?.url,
      mimeType:
        response.data?.mime_type ?? null,
      sha256:
        response.data?.sha256 ?? null,
      fileSize:
        response.data?.file_size ?? null,
      messagingProduct:
        response.data?.messaging_product ?? null,
    };
  }

  /**
   * Resolve media and persist the temporary
   * Meta URL against the local message.
   */
  async resolveMessageMedia(
    businessId: string,
    messageId: string,
  ): Promise<WhatsAppMediaInfo> {
    const message =
      await prisma.whatsAppMessage.findFirst({
        where: {
          id: messageId,
          businessId,
        },
      });

    if (!message) {
      throw new Error(
        "WhatsApp message not found",
      );
    }

    if (!message.mediaId) {
      throw new Error(
        "This message does not contain media",
      );
    }

    const media =
      await this.getMediaInfo(message.mediaId);

    await prisma.whatsAppMessage.update({
      where: {
        id: message.id,
      },

      data: {
        mediaUrl: media.url,
        metadata: {
          ...(message.metadata &&
          typeof message.metadata === "object"
            ? message.metadata
            : {}),

          media: {
            id: media.id,
            mimeType: media.mimeType,
            sha256: media.sha256,
            fileSize: media.fileSize,
            messagingProduct:
              media.messagingProduct,
          },
        },
      },
    });

    return media;
  }

  /**
   * Resolve all media messages in a conversation.
   */
  async resolveConversationMedia(
    businessId: string,
    conversationId: string,
  ) {
    const messages =
      await prisma.whatsAppMessage.findMany({
        where: {
          businessId,
          conversationId,
          mediaId: {
            not: null,
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    const results = [];

    for (const message of messages) {
      try {
        const media =
          await this.getMediaInfo(
            message.mediaId!,
          );

        await prisma.whatsAppMessage.update({
          where: {
            id: message.id,
          },

          data: {
            mediaUrl: media.url,
            metadata: {
              ...(message.metadata &&
              typeof message.metadata ===
                "object"
                ? message.metadata
                : {}),

              media: {
                id: media.id,
                mimeType: media.mimeType,
                sha256: media.sha256,
                fileSize:
                  media.fileSize,
                messagingProduct:
                  media.messagingProduct,
              },
            },
          },
        });

        results.push({
          messageId: message.id,
          mediaId: media.id,
          mediaUrl: media.url,
          mimeType: media.mimeType,
          fileSize: media.fileSize,
        });
      } catch (error) {
        console.error(
          "[WHATSAPP MEDIA] Failed to resolve media",
          {
            messageId: message.id,
            mediaId: message.mediaId,
            error,
          },
        );

        results.push({
          messageId: message.id,
          mediaId: message.mediaId,
          mediaUrl: null,
          error:
            "Unable to resolve WhatsApp media",
        });
      }
    }

    return results;
  }
}

export const whatsappMediaService =
  new WhatsAppMediaService();