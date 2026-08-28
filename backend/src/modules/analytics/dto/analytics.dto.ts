export interface AnalyticsQueryDTO {
  days?: number;

  qrCodeId?: string;
}

export interface AnalyticsPeriodDTO {
  days: number;

  startDate: Date;

  endDate: Date;
}

export interface AnalyticsOverviewDTO {
  totalScans: number;

  previousPeriodScans: number;

  percentageChange: number;

  activeQrCodes: number;
}

export interface DailyScanDTO {
  date: string;

  scans: number;
}

export interface QRPerformanceDTO {
  id: string;

  name: string | null;

  shortCode: string;

  scanCount: number;
}

export interface AnalyticsLocationDTO {
  name: string | null;

  scans: number;
}

export interface AnalyticsTechnologyDTO {
  name: string | null;

  scans: number;
}

export interface RecentScanDTO {
  id: string;

  qrCodeId: string;

  city: string | null;

  country: string | null;

  device: string | null;

  browser: string | null;

  operatingSystem: string | null;

  referrer: string | null;

  scannedAt: Date;
}

export interface BusinessAnalyticsDTO {
  period: AnalyticsPeriodDTO;

  overview: AnalyticsOverviewDTO;

  scansByDay: DailyScanDTO[];

  qrPerformance: QRPerformanceDTO[];

  locations: {
    cities: AnalyticsLocationDTO[];

    countries: AnalyticsLocationDTO[];
  };

  technology: {
    devices: AnalyticsTechnologyDTO[];

    browsers: AnalyticsTechnologyDTO[];

    operatingSystems: AnalyticsTechnologyDTO[];
  };

  recentScans: RecentScanDTO[];
}