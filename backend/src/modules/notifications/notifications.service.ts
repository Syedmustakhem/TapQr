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
   * Retry all failed deliveries for a notification.
   *
   * This method does not directly call email or WhatsApp.
   *
   * It resets failed deliveries to PENDING.
   * The notification worker performs the actual delivery.
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

    /*
     * Do not retry deliveries that already succeeded.
     */
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
   * Central notification creation method.
   *
   * Responsibilities:
   *
   * - validate recipient
   * - validate business ownership
   * - validate business status
   * - enforce eventKey idempotency
   * - check notification preferences
   * - resolve delivery channels
   * - persist notification
   *
   * External providers are handled by the worker.
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

    /*
     * If businessId is provided, verify that the
     * notification recipient owns that business.
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

    /*
     * Idempotency:
     *
     * Same user + same eventKey = same notification.
     */
    const existing =
      await this.repository.findNotificationByEventKey(
        input.userId,
        input.eventKey
      );

    if (existing) {
      return existing;
    }

    /*
     * Load notification preferences.
     */
    const preference =
      await this.repository.findPreference(
        input.userId
      );

    const typePreferenceKey =
      TYPE_PREFERENCE_MAP[
        input.type
      ];

    /*
     * Notifications are enabled by default when
     * the user does not yet have a preference record.
     */
    const categoryEnabled =
      preference?.[
        typePreferenceKey
      ] ?? true;

    /*
     * Category disabled:
     *
     * Persist the notification for history,
     * but do not create external delivery records.
     */
    if (!categoryEnabled) {
      return this.repository.create(
        input,
        []
      );
    }

    /*
     * Resolve channels based on:
     *
     * - requested channels
     * - preferences
     * - available email
     * - available phone
     */
    const channels =
      this.resolveChannels(
        input.channels,
        preference,
        user.email,
        user.phone
      );

    /*
     * Persist notification.
     *
     * readAt = NULL means unread.
     */
    return this.repository.create(
      input,
      channels
    );
  }

  /**
   * Resolve channels that are both:
   *
   * - requested
   * - enabled
   * - available
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

    /*
     * Default delivery channels.
     */
    const requestedChannels =
      requested ??
      [
        NotificationChannel.EMAIL,
        NotificationChannel.WHATSAPP,
      ];

    for (const channel of requestedChannels) {
      /*
       * EMAIL
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

      /*
       * WHATSAPP
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
   * Get true unread notification count.
   *
   * readAt IS NULL = unread.
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
        true,
    };
  }

  /**
   * Mark one notification as read.
   *
   * This operation is idempotent.
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
   * Mark all notifications belonging to the user
   * as read.
   */
  async markAllRead(
    userId: string
  ) {
    return this.repository.markAllRead(
      userId
    );
  }

  /**
   * Put a delivery back into PENDING.
   *
   * Intended for internal notification workflows.
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