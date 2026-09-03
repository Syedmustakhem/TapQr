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
   * Create a notification and its delivery records.
   *
   * External delivery is handled separately by the
   * notification delivery worker.
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

        /*
         * New notifications are unread by default.
         *
         * readAt remains NULL.
         */
        readAt: null,

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
   * Find one notification belonging to a specific user.
   *
   * userId is always checked to prevent cross-user access.
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
   * List notifications for the authenticated user.
   *
   * unreadOnly=true means:
   *
   * readAt IS NULL
   */
  async listForUser(
    userId: string,
    query: NotificationListQuery
  ) {
    const where: Prisma.NotificationWhereInput = {
      userId,

      ...(query.unreadOnly
        ? {
            readAt: null,
          }
        : {}),

      ...(query.type
        ? {
            type: query.type,
          }
        : {}),
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
   * Get the number of unread notifications.
   */
  async unreadCount(
    userId: string
  ) {
    return prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  /**
   * Mark one notification as read.
   *
   * updateMany is used so the ownership check and
   * read-state check happen together.
   */
  async markRead(
    id: string,
    userId: string
  ) {
    const result =
      await prisma.notification.updateMany({
        where: {
          id,
          userId,
          readAt: null,
        },

        data: {
          readAt: new Date(),
        },
      });

    /*
     * If count = 0, there are two possibilities:
     *
     * 1. Notification does not exist for this user.
     * 2. Notification was already read.
     *
     * Return the existing notification so the operation
     * remains idempotent.
     */
    if (result.count === 0) {
      return this.findByIdForUser(
        id,
        userId
      );
    }

    return this.findByIdForUser(
      id,
      userId
    );
  }

  /**
   * Mark all unread notifications belonging to
   * the authenticated user as read.
   */
  async markAllRead(
    userId: string
  ) {
    const result =
      await prisma.notification.updateMany({
        where: {
          userId,
          readAt: null,
        },

        data: {
          readAt: new Date(),
        },
      });

    return {
      count: result.count,
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
   * Find a notification delivery.
   */
  async findDelivery(
    id: string
  ) {
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
            readAt: true,
          },
        },
      },
    });
  }

  /**
   * Find an existing notification by event key.
   *
   * This provides notification idempotency.
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
   *   process after exponential backoff.
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
         * Fetch extra candidates because some FAILED
         * records may still be inside their backoff period.
         */
        take: limit * 3,
      });

    return rows
      .filter((row) => {
        /*
         * PENDING deliveries are ready immediately.
         */
        if (
          row.status ===
          NotificationStatus.PENDING
        ) {
          return true;
        }

        /*
         * FAILED delivery without a timestamp
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
         * maximum = 15 minutes
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
   * This prevents two worker instances from sending
   * the same notification simultaneously.
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
   * Load delivery + notification + recipient.
   *
   * Used by the notification worker.
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
   * attempts is reset to zero so a delivery that
   * already reached the automatic retry limit can
   * still be manually retried.
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