export type QRCodeType =
  | "STATIC"
  | "DYNAMIC";

export type QRCodeStatus =
  | "ACTIVE"
  | "PAUSED"
  | "EXPIRED";

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

  /**
   * Optional for BUSINESS / CONTACT QR.
   *
   * Required for:
   * CATALOG
   * MENU
   * SERVICES
   * PRODUCTS
   */
  catalogId?: string;

  name: string;

  description?: string;

  /**
   * Required only when experienceType = REDIRECT.
   *
   * Kept optional so catalog/business QR codes
   * don't need a destination URL.
   */
  destinationUrl?: string;

  type: QRCodeType;

  /**
   * Determines what the guest sees
   * after scanning the QR.
   */
  experienceType?: QRExperienceType;

  /**
   * Controls which sections appear
   * on the guest experience page.
   *
   * Example:
   *
   * [
   *   "PROFILE",
   *   "CATALOG",
   *   "OFFERS",
   *   "CONTACT",
   *   "LOCATION"
   * ]
   */
  enabledSections?: string[];
}

export interface UpdateQRCodeDTO {
  id: string;

  ownerId: string;

  /**
   * Attach QR to a catalog.
   *
   * null = remove catalog.
   */
  catalogId?: string | null;

  name?: string;

  description?: string;

  /**
   * null = remove destination URL.
   */
  destinationUrl?: string | null;

  experienceType?: QRExperienceType;

  enabledSections?: string[];

  status?: QRCodeStatus;
}

/**
 * Information collected when
 * a guest scans a QR code.
 */
export interface QRCodeScanContext {
  ipAddress?: string;

  userAgent?: string;

  referrer?: string;

  browser?: string;

  device?: string;

  operatingSystem?: string;
}