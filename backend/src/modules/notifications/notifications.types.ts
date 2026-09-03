import { NotificationChannel, NotificationStatus, NotificationType } from "@prisma/client";

export interface PublishNotificationInput {
  userId: string;
  businessId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  eventKey: string;
  expiresAt?: Date | null;
  channels?: NotificationChannel[];
}

export interface NotificationListQuery {
  page: number;
  limit: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

export interface NotificationDeliveryResult {
  id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  attempts: number;
}

export interface NotificationSummary {
  unreadCount: number;
  totalCount: number;
}
