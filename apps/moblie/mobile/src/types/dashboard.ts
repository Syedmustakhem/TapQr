export interface DashboardStats {
  qrCodes: number;
  totalScans: number;
  activeQrCodes: number;
  customers: number;
}

export interface DashboardActivity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "scan" | "qr_created" | "qr_updated";
}