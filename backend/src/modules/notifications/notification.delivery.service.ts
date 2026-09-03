import {
  NotificationChannel,
  NotificationStatus,
  Prisma,
} from "@prisma/client";

import { AppError } from "../../cores/errors/AppError";
import { NotificationsRepository } from "./notifications.repository";
import { buildNotificationEmail } from "./notification.templates";
import {
  sendNotificationEmail,
} from "./providers/email.provider";
import {
  sendNotificationWhatsApp,
} from "./providers/whatsapp.provider";

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 30_000;
const MAX_BACKOFF_MS = 15 * 60_000;

function backoffMs(attempts: number) {
  const exponent = Math.max(0, attempts - 1);
  return Math.min(
    BASE_BACKOFF_MS * 2 ** exponent,
    MAX_BACKOFF_MS
  );
}

function isRetryDue(lastAttemptAt: Date | null, attempts: number) {
  if (!lastAttemptAt) return true;
  return Date.now() - lastAttemptAt.getTime() >= backoffMs(attempts);
}

function errorDetails(error: unknown) {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      code: "DELIVERY_FAILED",
      message: error.message,
    };
  }

  return {
    code: "DELIVERY_FAILED",
    message: "Unknown notification delivery error.",
  };
}

export class NotificationDeliveryService {
  private readonly repository = new NotificationsRepository();

  /**
   * Claims one delivery atomically so multiple API instances/workers
   * do not send the same notification concurrently.
   */
  async claim(deliveryId: string) {
    const result = await this.repository.claimDelivery(
      deliveryId,
      MAX_ATTEMPTS
    );

    return result;
  }

  async processDelivery(deliveryId: string) {
    const delivery = await this.repository.findDeliveryForProcessing(
      deliveryId
    );

    if (!delivery) return null;

    if (delivery.notification.expiresAt && delivery.notification.expiresAt <= new Date()) {
      await this.repository.updateDelivery(deliveryId, {
        status: NotificationStatus.SKIPPED,
        lastAttemptAt: new Date(),
        errorCode: "NOTIFICATION_EXPIRED",
        errorMessage: "Notification expired before delivery.",
      });
      return { id: deliveryId, status: NotificationStatus.SKIPPED };
    }

    if (delivery.attempts >= MAX_ATTEMPTS) {
      if (delivery.status !== NotificationStatus.FAILED) {
        await this.repository.updateDelivery(deliveryId, {
          status: NotificationStatus.FAILED,
        });
      }
      return { id: deliveryId, status: NotificationStatus.FAILED };
    }

    if (delivery.status === NotificationStatus.FAILED && !isRetryDue(delivery.lastAttemptAt, delivery.attempts)) {
      return { id: deliveryId, status: delivery.status };
    }

    const claimed = await this.claim(deliveryId);
    if (!claimed) return null;

    const attempt = delivery.attempts + 1;
    const attemptedAt = new Date();

    try {
      let result:
        | { providerMessageId?: string; providerResponse?: unknown }
        | undefined;

      if (delivery.channel === NotificationChannel.EMAIL) {
        if (!delivery.notification.user.email) {
          throw new AppError(
            "Notification recipient has no email address.",
            400,
            "NOTIFICATION_EMAIL_MISSING"
          );
        }

        const email = buildNotificationEmail({
          userId: delivery.notification.user.id,
          businessId: delivery.notification.businessId,
          type: delivery.notification.type,
          title: delivery.notification.title,
          message: delivery.notification.message,
          actionUrl: delivery.notification.actionUrl,
          metadata: undefined,
          eventKey: delivery.notification.eventKey,
        });

        result = await sendNotificationEmail({
          to: delivery.notification.user.email,
          subject: email.subject,
          text: email.text,
          html: email.html,
        });
      } else if (delivery.channel === NotificationChannel.WHATSAPP) {
        if (!delivery.notification.user.phone) {
          throw new AppError(
            "Notification recipient has no WhatsApp phone number.",
            400,
            "NOTIFICATION_WHATSAPP_PHONE_MISSING"
          );
        }

        result = await sendNotificationWhatsApp({
          toPhoneE164: delivery.notification.user.phone,
          recipientName: delivery.notification.user.fullName,
          message: delivery.notification.message,
        });
      } else {
        throw new AppError(
          `Unsupported notification channel: ${delivery.channel}`,
          400,
          "NOTIFICATION_CHANNEL_UNSUPPORTED"
        );
      }

      return await this.repository.updateDelivery(deliveryId, {
        status: NotificationStatus.SENT,
        attempts: attempt,
        lastAttemptAt: attemptedAt,
        sentAt: new Date(),
        providerMessageId: result?.providerMessageId ?? null,
        providerResponse:
          result?.providerResponse === undefined
            ? Prisma.JsonNull
            : (result.providerResponse as Prisma.InputJsonValue),
        errorCode: null,
        errorMessage: null,
      });
    } catch (error) {
      const details = errorDetails(error);
      const terminal = attempt >= MAX_ATTEMPTS;

      return await this.repository.updateDelivery(deliveryId, {
        status: terminal
          ? NotificationStatus.FAILED
          : NotificationStatus.FAILED,
        attempts: attempt,
        lastAttemptAt: attemptedAt,
        errorCode: details.code,
        errorMessage: details.message,
      });
    }
  }

  async processBatch(limit = 20) {
    const candidates = await this.repository.findProcessableDeliveries(
      Math.min(Math.max(limit, 1), 100),
      MAX_ATTEMPTS
    );

    let processed = 0;

    for (const delivery of candidates) {
      const result = await this.processDelivery(delivery.id);
      if (result) processed++;
    }

    return {
      found: candidates.length,
      processed,
    };
  }
}
