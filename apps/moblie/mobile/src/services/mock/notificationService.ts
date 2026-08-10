import { Notification } from "../../types/notification";

const notifications: Notification[] = [
  {
    id: "notification-1",
    title: "New QR Scan",
    message: "Someone scanned your business QR code.",
    type: "QR_SCAN",
    createdAt: "2 min ago",
    read: false,
  },

  {
    id: "notification-2",
    title: "New Review",
    message: "You received a new 5-star review.",
    type: "REVIEW",
    createdAt: "1 hour ago",
    read: false,
  },

  {
    id: "notification-3",
    title: "Business Profile Updated",
    message: "Your business profile was successfully updated.",
    type: "BUSINESS",
    createdAt: "3 hours ago",
    read: true,
  },

  {
    id: "notification-4",
    title: "Welcome to TapQR",
    message: "Your TapQR business account is ready.",
    type: "SYSTEM",
    createdAt: "Yesterday",
    read: true,
  },
];

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    await new Promise((resolve) =>
      setTimeout(resolve, 700)
    );

    return notifications;
  },
};