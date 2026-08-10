import {
  DashboardActivity,
  DashboardStats,
} from "../../types/dashboard";

export const dashboardStats: DashboardStats = {
  qrCodes: 12,
  totalScans: 1248,
  activeQrCodes: 10,
  customers: 486,
};

export const dashboardActivities: DashboardActivity[] = [
  {
    id: "1",
    title: "QR Code Scanned",
    description: "Your Google Review QR was scanned",
    time: "2 min ago",
    type: "scan",
  },
  {
    id: "2",
    title: "QR Code Created",
    description: "Menu QR Code was created",
    time: "1 hour ago",
    type: "qr_created",
  },
  {
    id: "3",
    title: "QR Code Updated",
    description: "Payment QR was updated",
    time: "3 hours ago",
    type: "qr_updated",
  },
];