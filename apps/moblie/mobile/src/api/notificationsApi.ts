// src/api/notificationsApi.ts
//
// Notification endpoints, mirroring the TapQR web dashboard
// (app/dashboard/notifications and lib/notifications.ts call
// these exact paths against https://api.tapqr.shop/api).
//
// Uses the shared authenticated axios instance from
// authApi.ts (Bearer token + 401 refresh interceptors).

import api from "./authApi";

import {
  Notification,
  NotificationType,
} from "../types/notification";

import { relativeTime } from "./utils";

type WebNotification = {
  id: string;
  type?: string | null;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string | null;
};

type NotificationListResponse = {
  success?: boolean;
  message?: string;
  data?: {
    notifications?: WebNotification[];
    items?: WebNotification[];
    total?: number;
    page?: number;
    limit?: number;
  };
};

/**
 * Map backend notification types to the mobile
 * NotificationType union used by NotificationCard.
 */
function mapType(
  value?: string | null
): NotificationType {
  switch (
    (value ?? "").toUpperCase()
  ) {
    case "QR":
    case "QR_SCAN":
      return "QR_SCAN";

    case "REVIEW":
      return "REVIEW";

    case "BUSINESS":
      return "BUSINESS";

    case "SYSTEM":
    default:
      return "SYSTEM";
  }
}

function mapNotification(
  item: WebNotification
): Notification {
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    type: mapType(item.type),
    createdAt: relativeTime(
      item.createdAt
    ),
    read: Boolean(item.readAt),
  };
}

/**
 * GET /notifications?page=&limit=&unreadOnly=&type=
 */
export async function getNotifications(
  params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
  }
): Promise<Notification[]> {
  const searchParams =
    new URLSearchParams();

  if (params?.page) {
    searchParams.set(
      "page",
      String(params.page)
    );
  }

  if (params?.limit) {
    searchParams.set(
      "limit",
      String(params.limit)
    );
  }

  if (
    params?.unreadOnly !== undefined
  ) {
    searchParams.set(
      "unreadOnly",
      String(params.unreadOnly)
    );
  }

  if (params?.type) {
    searchParams.set(
      "type",
      params.type
    );
  }

  const query =
    searchParams.toString();

  const res =
    await api.get<NotificationListResponse>(
      `/notifications${
        query ? `?${query}` : ""
      }`
    );

  const data = res.data?.data;

  const list =
    data?.notifications ??
    data?.items ??
    [];

  return list.map(mapNotification);
}

/**
 * POST /notifications/:id/read
 */
export async function markNotificationRead(
  id: string
): Promise<void> {
  await api.post(
    `/notifications/${id}/read`
  );
}

/**
 * POST /notifications/read-all
 */
export async function markAllNotificationsRead(): Promise<void> {
  await api.post(
    "/notifications/read-all"
  );
}

/**
 * GET /notifications/preferences
 */
export async function getNotificationPreferences(): Promise<
  Record<string, unknown>
> {
  const res = await api.get<{
    success?: boolean;
    message?: string;
    data?: Record<string, unknown>;
  }>("/notifications/preferences");

  return res.data?.data ?? {};
}

/**
 * PATCH /notifications/preferences
 */
export async function updateNotificationPreferences(
  prefs: Record<string, unknown>
): Promise<void> {
  await api.patch(
    "/notifications/preferences",
    prefs
  );
}
