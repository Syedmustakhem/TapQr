export type QRCodeType = "STATIC" | "DYNAMIC";

export type QRCodeStatus = "ACTIVE" | "PAUSED" | "EXPIRED";

export type QRSourceType =
  | "TABLE"
  | "COUNTER"
  | "TAKEAWAY"
  | "PACKAGING"
  | "POSTER"
  | "FLYER"
  | "BUSINESS_CARD"
  | "RECEIPT"
  | "WEBSITE"
  | "SOCIAL_MEDIA"
  | "ADVERTISEMENT"
  | "EVENT"
  | "OTHER";

export type QRExperienceType =
  | "BUSINESS"
  | "CATALOG"
  | "MENU"
  | "SERVICES"
  | "PRODUCTS"
  | "CONTACT"
  | "REDIRECT";

export interface CreateQRCodeDTO {
  businessId: string;
  ownerId: string;
  catalogId?: string;
  name: string;
  description?: string;
  destinationUrl?: string;
  type: QRCodeType;
  experienceType?: QRExperienceType;
  enabledSections?: string[];
  sourceType?: QRSourceType;
  placementLabel?: string;
  locationLabel?: string;
  campaignName?: string;
}

export interface UpdateQRCodeDTO {
  id: string;
  ownerId: string;
  catalogId?: string | null;
  name?: string;
  description?: string | null;
  destinationUrl?: string | null;
  experienceType?: QRExperienceType;
  enabledSections?: string[];
  status?: QRCodeStatus;
  sourceType?: QRSourceType;
  placementLabel?: string | null;
  locationLabel?: string | null;
  campaignName?: string | null;
}

export interface QRBrandingDTO {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  backgroundColor?: string | null;
  qrForegroundColor?: string | null;
  qrBackgroundColor?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  buttonStyle?: string | null;
  fontFamily?: string | null;
}

export interface UpdateQRBrandingDTO extends QRBrandingDTO {
  qrCodeId: string;
  ownerId: string;
}

export interface QRCodeScanContext {
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  browser?: string;
  device?: string;
  operatingSystem?: string;
}
