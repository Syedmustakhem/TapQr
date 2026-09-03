import {
  NotificationChannel,
  NotificationStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "../../config/prisma";
import {
  NotificationListQuery,
  PublishNotificationInput,
} from "./notifications.types";

export class NotificationsRepository {
  async findUser(userId: string) {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        notificationPreferences: true,
      },
    });
  }

  async findBusiness(
    businessId: string,
    userId: string
  ) {
    return prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
        status: true,
      },
    });
  }

  async findPreference(userId: string) {
    return prisma.notificationPreference.findUnique({
      where: {
        userId,
      },
    });
  }

  /**
   * Create the notification first.
   *
   * External delivery is intentionally handled separately
   * by the notification delivery worker.
   */
  async create(
    input: PublishNotificationInput,
    channels: NotificationChannel[]
  ) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        businessId: input.businessId ?? null,
        type: input.type,
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl ?? null,

        metadata:
          input.metadata === undefined ||
          input.metadata === null
            ? Prisma.JsonNull
            : (input.metadata as Prisma.InputJsonValue),

        eventKey: input.eventKey,
        expiresAt: input.expiresAt ?? null,

        deliveries: {
          create: channels.map((channel) => ({
            channel,
            status: NotificationStatus.PENDING,
          })),
        },
      },

      include: {
        deliveries: true,
      },
    });
  }

  /**
   * Find a notification belonging to a specific user.
   *
   * This prevents one authenticated user from accessing
   * another user's notification.
   */
  async findByIdForUser(
    id: string,
    userId: string
  ) {
    return prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        deliveries: true,
      },
    });
  }

  /**
   * List notifications belonging to a user.
   */
  async listForUser(
    userId: string,
    query: NotificationListQuery
  ) {
    const where: Prisma.NotificationWhereInput = {
      userId,

      ...(query.type
        ? {
            type: query.type,
          }
        : {}),

      /*
       * unreadOnly intentionally does not add a condition yet.
       *
       * The current Notification model does not have a readAt
       * / isRead field.
       *
       * Once readAt is added to Prisma, this should become:
       *
       * ...(query.unreadOnly
       *   ? {
       *       readAt: null,
       *     }
       *   : {}),
       */
    };

    const skip =
      (query.page - 1) *
      query.limit;

    const [items, total] =
      await prisma.$transaction([
        prisma.notification.findMany({
          where,

          orderBy: {
            createdAt: "desc",
          },

          skip,
          take: query.limit,

          include: {
            deliveries: {
              select: {
                id: true,
                channel: true,
                status: true,
                attempts: true,
                lastAttemptAt: true,
                sentAt: true,
                errorCode: true,
                errorMessage: true,
              },
            },
          },
        }),

        prisma.notification.count({
          where,
        }),
      ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(
        total / query.limit
      ),
    };
  }

  /**
   * Current schema does not contain a read marker.
   *
   * Therefore this intentionally returns the total number
   * of notifications rather than pretending they are unread.
   */
  async unreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
      },
    });
  }

  /**
   * Mark one notification as read.
   *
   * Currently a safe placeholder because the Notification
   * table does not contain readAt/isRead.
   */
  async markRead(
    id: string,
    userId: string
  ) {
    const notification =
      await this.findByIdForUser(
        id,
        userId
      );

    if (!notification) {
      return null;
    }

    return notification;
  }

  /**
   * Mark all notifications as read.
   *
   * Currently a safe no-op because the Notification table
   * does not contain readAt/isRead.
   */
  async markAllRead(userId: string) {
    return {
      count: 0,
    };
  }

  /**
   * Update notification delivery state.
   */
  async updateDelivery(
    id: string,
    data: {
      status?: NotificationStatus;
      attempts?: number;
      lastAttemptAt?: Date | null;
      sentAt?: Date | null;
      providerMessageId?: string | null;
      providerResponse?:
        | Prisma.InputJsonValue
        | Prisma.NullableJsonNullValueInput;
      errorCode?: string | null;
      errorMessage?: string | null;
    }
  ) {
    return prisma.notificationDelivery.update({
      where: {
        id,
      },
      data,
    });
  }

  /**
   * Find a notification delivery and its parent notification.
   */
  async findDelivery(id: string) {
    return prisma.notificationDelivery.findUnique({
      where: {
        id,
      },

      include: {
        notification: {
          select: {
            id: true,
            userId: true,
            businessId: true,
            type: true,
            title: true,
            message: true,
            actionUrl: true,
            metadata: true,
            eventKey: true,
            createdAt: true,
            expiresAt: true,
          },
        },
      },
    });
  }

  /**
   * Idempotency lookup.
   *
   * The same eventKey for the same user must not create
   * duplicate notifications.
   */
  async findNotificationByEventKey(
    userId: string,
    eventKey: string
  ) {
    return prisma.notification.findUnique({
      where: {
        userId_eventKey: {
          userId,
          eventKey,
        },
      },

      include: {
        deliveries: true,
      },
    });
  }

  /**
   * Find deliveries that are eligible for processing.
   *
   * PENDING:
   *   immediately process.
   *
   * FAILED:
   *   process only after exponential backoff.
   *
   * Expired notifications are excluded.
   */
  async findProcessableDeliveries(
    limit: number,
    maxAttempts: number
  ) {
    const rows =
      await prisma.notificationDelivery.findMany({
        where: {
          status: {
            in: [
              NotificationStatus.PENDING,
              NotificationStatus.FAILED,
            ],
          },

          attempts: {
            lt: maxAttempts,
          },

          notification: {
            OR: [
              {
                expiresAt: null,
              },
              {
                expiresAt: {
                  gt: new Date(),
                },
              },
            ],
          },
        },

        orderBy: {
          createdAt: "asc",
        },

        /*
         * Fetch more candidates because some FAILED
         * deliveries may still be inside their backoff window.
         */
        take: limit * 3,
      });

    return rows
      .filter((row) => {
        /*
         * PENDING deliveries can be processed immediately.
         */
        if (
          row.status ===
          NotificationStatus.PENDING
        ) {
          return true;
        }

        /*
         * FAILED delivery without previous attempt timestamp
         * can be retried immediately.
         */
        if (!row.lastAttemptAt) {
          return true;
        }

        /*
         * Exponential backoff:
         *
         * attempt 1 -> 30 seconds
         * attempt 2 -> 60 seconds
         * attempt 3 -> 120 seconds
         *
         * capped at 15 minutes.
         */
        const backoff =
          Math.min(
            30_000 *
              2 **
                Math.max(
                  0,
                  row.attempts - 1
                ),
            15 * 60_000
          );

        return (
          Date.now() -
            row.lastAttemptAt.getTime() >=
          backoff
        );
      })
      .slice(0, limit);
  }

  /**
   * Atomically claim a delivery.
   *
   * updateMany is important here because multiple
   * API/worker instances could see the same PENDING
   * delivery at approximately the same time.
   *
   * Only one instance can successfully change it to SENDING.
   */
  async claimDelivery(
    id: string,
    maxAttempts: number
  ) {
    const result =
      await prisma.notificationDelivery.updateMany(
        {
          where: {
            id,

            status: {
              in: [
                NotificationStatus.PENDING,
                NotificationStatus.FAILED,
              ],
            },

            attempts: {
              lt: maxAttempts,
            },
          },

          data: {
            status:
              NotificationStatus.SENDING,
          },
        }
      );

    return result.count === 1;
  }

  /**
   * Fetch a delivery with the recipient information
   * required by the email/WhatsApp providers.
   */
  async findDeliveryForProcessing(
    id: string
  ) {
    return prisma.notificationDelivery.findUnique(
      {
        where: {
          id,
        },

        include: {
          notification: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      }
    );
  }

  /**
   * Reset a failed delivery for manual retry.
   *
   * IMPORTANT:
   * attempts is reset to 0.
   *
   * Without this, a delivery that already reached the
   * MAX_ATTEMPTS limit would become PENDING but the worker
   * would immediately ignore it because attempts >= maxAttempts.
   */
  async resetFailedDelivery(
    deliveryId: string,
    notificationId: string
  ) {
    return prisma.notificationDelivery.updateMany({
      where: {
        id: deliveryId,

        notificationId,

        status:
          NotificationStatus.FAILED,
      },

      data: {
        status:
          NotificationStatus.PENDING,

        attempts: 0,

        lastAttemptAt: null,

        sentAt: null,

        providerMessageId: null,

        providerResponse:
          Prisma.JsonNull,

        errorCode: null,

        errorMessage: null,
      },
    });
  }
}