import {
  BusinessStatus,
  NotificationChannel,
  NotificationStatus,
} from "@prisma/client";

import { AppError } from "../../cores/errors/AppError";
import { NotificationsRepository } from "./notifications.repository";
import {
  NotificationListQuery,
  PublishNotificationInput,
} from "./notifications.types";

const TYPE_PREFERENCE_MAP = {
  SECURITY: "securityEnabled",
  AUTH: "authEnabled",
  BUSINESS: "businessEnabled",
  QR: "qrEnabled",
  STAFF: "staffEnabled",
  REVIEW: "reviewEnabled",
  ANALYTICS: "analyticsEnabled",
  BILLING: "billingEnabled",
  SYSTEM: "systemEnabled",
} as const;

export class NotificationsService {
  private readonly repository =
    new NotificationsRepository();

  /**
   * Get one notification belonging to the authenticated user.
   */
  async getById(
    userId: string,
    notificationId: string
  ) {
    const notification =
      await this.repository.findByIdForUser(
        notificationId,
        userId
      );

    if (!notification) {
      throw new AppError(
        "Notification not found.",
        404,
        "NOTIFICATION_NOT_FOUND"
      );
    }

    return notification;
  }

  /**
   * Retry all failed deliveries belonging to a notification.
   *
   * The service does not directly call email/WhatsApp.
   *
   * It only puts failed deliveries back into PENDING.
   * The notification worker will perform the actual delivery.
   */
  async retry(
    userId: string,
    notificationId: string
  ) {
    const notification =
      await this.repository.findByIdForUser(
        notificationId,
        userId
      );

    if (!notification) {
      throw new AppError(
        "Notification not found.",
        404,
        "NOTIFICATION_NOT_FOUND"
      );
    }

    const failedDeliveries =
      notification.deliveries.filter(
        (delivery) =>
          delivery.status ===
          NotificationStatus.FAILED
      );

    if (
      failedDeliveries.length === 0
    ) {
      throw new AppError(
        "This notification has no failed deliveries to retry.",
        409,
        "NOTIFICATION_NOT_RETRYABLE"
      );
    }

    let retried = 0;

    const deliveries = [];

    for (const delivery of failedDeliveries) {
      const updated =
        await this.repository.resetFailedDelivery(
          delivery.id,
          notificationId
        );

      if (updated.count === 1) {
        retried += 1;
      }

      deliveries.push({
        deliveryId: delivery.id,
        reset: updated.count === 1,
      });
    }

    return {
      notificationId,
      retried,
      deliveries,
    };
  }

  /**
   * Central notification entry point.
   *
   * Core business modules should call this service instead
   * of talking directly to email/WhatsApp providers.
   *
   * Responsibilities:
   *
   * 1. Validate recipient.
   * 2. Validate business ownership when businessId is supplied.
   * 3. Validate business status.
   * 4. Enforce eventKey idempotency.
   * 5. Check notification preferences.
   * 6. Resolve delivery channels.
   * 7. Persist notification and delivery records.
   *
   * External delivery is handled separately by the worker.
   */
  async publish(
    input: PublishNotificationInput
  ) {
    const user =
      await this.repository.findUser(
        input.userId
      );

    if (!user) {
      throw new AppError(
        "Notification recipient not found.",
        404,
        "NOTIFICATION_USER_NOT_FOUND"
      );
    }

    if (!user.isActive) {
      throw new AppError(
        "Notification recipient is inactive.",
        409,
        "NOTIFICATION_USER_INACTIVE"
      );
    }

    /**
     * If the notification belongs to a business,
     * verify that the recipient owns that business.
     */
    if (input.businessId) {
      const business =
        await this.repository.findBusiness(
          input.businessId,
          input.userId
        );

      if (!business) {
        throw new AppError(
          "Business not found or access denied.",
          403,
          "NOTIFICATION_BUSINESS_ACCESS_DENIED"
        );
      }

      if (
        business.status !==
        BusinessStatus.ACTIVE
      ) {
        throw new AppError(
          "Business is not active.",
          409,
          "NOTIFICATION_BUSINESS_INACTIVE"
        );
      }
    }

    /**
     * Idempotency:
     *
     * The same eventKey for the same user returns
     * the existing notification instead of creating
     * another notification.
     */
    const existing =
      await this.repository.findNotificationByEventKey(
        input.userId,
        input.eventKey
      );

    if (existing) {
      return existing;
    }

    /**
     * Load user notification preferences.
     */
    const preference =
      await this.repository.findPreference(
        input.userId
      );

    const typePreferenceKey =
      TYPE_PREFERENCE_MAP[
        input.type
      ];

    /**
     * If the preference record does not exist,
     * notifications are enabled by default.
     */
    const categoryEnabled =
      preference?.[
        typePreferenceKey
      ] ?? true;

    /**
     * Category disabled:
     *
     * Persist the notification but create no external
     * delivery records.
     *
     * This preserves the notification event/history
     * without violating the user's preference.
     */
    if (!categoryEnabled) {
      return this.repository.create(
        input,
        []
      );
    }

    /**
     * Resolve the actual channels based on:
     *
     * - requested channels
     * - user preferences
     * - available email
     * - available phone number
     */
    const channels =
      this.resolveChannels(
        input.channels,
        preference,
        user.email,
        user.phone
      );

    /**
     * Persist first.
     *
     * The worker handles external delivery later.
     */
    return this.repository.create(
      input,
      channels
    );
  }

  /**
   * Resolve channels that are actually available
   * and allowed by user preferences.
   */
  private resolveChannels(
    requested:
      | NotificationChannel[]
      | undefined,

    preference:
      | {
          emailEnabled: boolean;
          whatsappEnabled: boolean;
        }
      | null,

    email?: string | null,

    phone?: string | null
  ) {
    const allowed =
      new Set<NotificationChannel>();

    const emailEnabled =
      preference?.emailEnabled ??
      true;

    const whatsappEnabled =
      preference?.whatsappEnabled ??
      true;

    /**
     * If the caller does not explicitly provide channels,
     * default to EMAIL + WHATSAPP.
     */
    const requestedChannels =
      requested ??
      [
        NotificationChannel.EMAIL,
        NotificationChannel.WHATSAPP,
      ];

    for (const channel of requestedChannels) {
      /**
       * Email:
       *
       * Only create an email delivery when:
       * - channel was requested
       * - email notifications are enabled
       * - user has an email address
       */
      if (
        channel ===
          NotificationChannel.EMAIL &&
        emailEnabled &&
        email
      ) {
        allowed.add(
          NotificationChannel.EMAIL
        );
      }

      /**
       * WhatsApp:
       *
       * Only create a WhatsApp delivery when:
       * - channel was requested
       * - WhatsApp notifications are enabled
       * - user has a phone number
       */
      if (
        channel ===
          NotificationChannel.WHATSAPP &&
        whatsappEnabled &&
        phone
      ) {
        allowed.add(
          NotificationChannel.WHATSAPP
        );
      }
    }

    return Array.from(allowed);
  }

  /**
   * Get paginated notifications for the authenticated user.
   */
  async listForUser(
    userId: string,
    query: NotificationListQuery
  ) {
    const user =
      await this.repository.findUser(
        userId
      );

    if (!user) {
      throw new AppError(
        "User not found.",
        404,
        "USER_NOT_FOUND"
      );
    }

    return this.repository.listForUser(
      userId,
      query
    );
  }

  /**
   * Get notification count.
   *
   * NOTE:
   * The current Notification schema does not have
   * readAt/isRead, therefore this is not a true unread
   * count yet.
   */
  async getUnreadCount(
    userId: string
  ) {
    return {
      count:
        await this.repository.unreadCount(
          userId
        ),

      readTrackingAvailable:
        false,
    };
  }

  /**
   * Mark one notification as read.
   *
   * Currently delegates to the repository placeholder
   * because the schema does not yet contain readAt/isRead.
   */
  async markRead(
    userId: string,
    notificationId: string
  ) {
    const notification =
      await this.repository.markRead(
        notificationId,
        userId
      );

    if (!notification) {
      throw new AppError(
        "Notification not found.",
        404,
        "NOTIFICATION_NOT_FOUND"
      );
    }

    return notification;
  }

  /**
   * Mark all notifications as read.
   *
   * Currently a safe no-op until a read marker is added
   * to the Prisma Notification model.
   */
  async markAllRead(
    userId: string
  ) {
    return this.repository.markAllRead(
      userId
    );
  }

  /**
   * Put a notification delivery back into PENDING.
   *
   * This method is useful for internal workflows.
   */
  async markDeliveryPending(
    deliveryId: string
  ) {
    const delivery =
      await this.repository.findDelivery(
        deliveryId
      );

    if (!delivery) {
      throw new AppError(
        "Notification delivery not found.",
        404,
        "NOTIFICATION_DELIVERY_NOT_FOUND"
      );
    }

    return this.repository.updateDelivery(
      deliveryId,
      {
        status:
          NotificationStatus.PENDING,
      }
    );
  }
}