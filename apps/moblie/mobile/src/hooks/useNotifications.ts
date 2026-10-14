import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Notification } from "../types/notification";

import {
  getNotifications,
  markAllNotificationsRead as apiMarkAllRead,
  markNotificationRead as apiMarkRead,
} from "../api/notificationsApi";

export function useNotifications() {
  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  /*
   * GET /notifications — mirrors the web dashboard
   * notifications page.
   */
  const loadNotifications =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const data =
          await getNotifications({
            limit: 50,
          });

        setNotifications(data);
      } catch (error) {
        setError(
          "Unable to load notifications."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  /*
   * POST /notifications/:id/read (optimistic).
   */
  const markAsRead = (id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification
      )
    );

    void apiMarkRead(id).catch(
      (error) => {
        console.error(
          "Failed to mark notification as read:",
          error
        );
      }
    );
  };

  /*
   * POST /notifications/read-all (optimistic).
   */
  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );

    void apiMarkAllRead().catch(
      (error) => {
        console.error(
          "Failed to mark all notifications as read:",
          error
        );
      }
    );
  };

  return {
    notifications,
    loading,
    error,
    refresh: loadNotifications,
    markAsRead,
    markAllAsRead,
  };
}
