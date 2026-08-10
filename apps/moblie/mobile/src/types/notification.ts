export type NotificationType =
  | "QR_SCAN"
  | "REVIEW"
  | "BUSINESS"
  | "SYSTEM";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
}