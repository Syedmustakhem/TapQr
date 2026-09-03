import {
  NextFunction,
  Response,
} from "express";

import { AppError } from "../../cores/errors/AppError";
import { AuthRequest } from "../auth/auth.types";
import { NotificationsService } from "./notifications.service";
import {
  notificationIdSchema,
  notificationListQuerySchema,
} from "./notification.validation";

const notificationService =
  new NotificationsService();

export class NotificationController {
  /**
   * GET /api/notifications
   *
   * Get notifications for the authenticated user.
   *
   * Query:
   * ?page=1
   * &limit=20
   * &unreadOnly=false
   * &type=SECURITY
   */
  static async list(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw new AppError(
          "Authenticated user is required.",
          401,
          "AUTHENTICATION_REQUIRED"
        );
      }

      const query =
        notificationListQuerySchema.parse(
          req.query
        );

      const result =
        await notificationService.listForUser(
          req.user.id,
          query
        );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/notifications/unread-count
   *
   * Returns the current notification count.
   *
   * NOTE:
   * The current database schema does not yet have
   * readAt/isRead, so the service reports
   * readTrackingAvailable: false.
   */
  static async unreadCount(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw new AppError(
          "Authenticated user is required.",
          401,
          "AUTHENTICATION_REQUIRED"
        );
      }

      const result =
        await notificationService.getUnreadCount(
          req.user.id
        );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/notifications/:id
   *
   * Get a single notification belonging
   * to the authenticated user.
   */
  static async getById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw new AppError(
          "Authenticated user is required.",
          401,
          "AUTHENTICATION_REQUIRED"
        );
      }

      const { id } =
        notificationIdSchema.parse(
          req.params
        );

      const notification =
        await notificationService.getById(
          req.user.id,
          id
        );

      return res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /api/notifications/:id/read
   *
   * Mark one notification as read.
   *
   * Currently the repository safely returns
   * the notification because the database does
   * not yet contain a readAt/isRead field.
   */
  static async markRead(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw new AppError(
          "Authenticated user is required.",
          401,
          "AUTHENTICATION_REQUIRED"
        );
      }

      const { id } =
        notificationIdSchema.parse(
          req.params
        );

      const notification =
        await notificationService.markRead(
          req.user.id,
          id
        );

      return res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /api/notifications/read-all
   *
   * Mark all notifications as read.
   *
   * Currently returns count: 0 because the
   * Notification model does not yet have a
   * read marker.
   */
  static async markAllRead(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw new AppError(
          "Authenticated user is required.",
          401,
          "AUTHENTICATION_REQUIRED"
        );
      }

      const result =
        await notificationService.markAllRead(
          req.user.id
        );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /api/notifications/:id/retry
   *
   * Retry failed notification deliveries.
   *
   * This does NOT call email/WhatsApp directly.
   *
   * It resets failed deliveries to PENDING.
   * The notification worker then processes them.
   */
  static async retry(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.id) {
        throw new AppError(
          "Authenticated user is required.",
          401,
          "AUTHENTICATION_REQUIRED"
        );
      }

      const { id } =
        notificationIdSchema.parse(
          req.params
        );

      const result =
        await notificationService.retry(
          req.user.id,
          id
        );

      return res.status(200).json({
        success: true,
        message:
          "Notification delivery queued for retry.",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}