import crypto from "crypto";

import { Request } from "express";

import {
  QRAuthenticationState,
  QRBusinessState,
  QRGeoContext,
  QRRoutingContext,
  QRRoutingUTM,
  QRVisitorType,
} from "./qr-rules.types";

/**
 * ============================================================
 * SAFE REQUEST HELPERS
 * ============================================================
 */

function firstHeaderValue(
  value: string | string[] | undefined
) {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalize(
  value?: string | null
) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : undefined;
}

/**
 * ============================================================
 * USER AGENT PARSING
 * ============================================================
 */

function detectDevice(
  userAgent: string
): string {
  const ua = userAgent.toLowerCase();

  if (/ipad|tablet/.test(ua)) {
    return "TABLET";
  }

  if (
    /mobile|android|iphone|ipod|windows phone/.test(
      ua
    )
  ) {
    return "MOBILE";
  }

  return "DESKTOP";
}

function detectOperatingSystem(
  userAgent: string
): string {
  const ua = userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) {
    return "IOS";
  }

  if (/android/.test(ua)) {
    return "ANDROID";
  }

  if (/windows/.test(ua)) {
    return "WINDOWS";
  }

  if (/mac os|macintosh/.test(ua)) {
    return "MACOS";
  }

  if (/linux/.test(ua)) {
    return "LINUX";
  }

  return "UNKNOWN";
}

function detectBrowser(
  userAgent: string
): string {
  const ua = userAgent.toLowerCase();

  if (/edg\//.test(ua)) {
    return "EDGE";
  }

  if (
    /opr\//.test(ua) ||
    /opera/.test(ua)
  ) {
    return "OPERA";
  }

  if (
    /chrome\//.test(ua) &&
    !/edg\//.test(ua)
  ) {
    return "CHROME";
  }

  if (
    /safari\//.test(ua) &&
    !/chrome\//.test(ua)
  ) {
    return "SAFARI";
  }

  if (/firefox\//.test(ua)) {
    return "FIREFOX";
  }

  return "UNKNOWN";
}

/**
 * ============================================================
 * LANGUAGE
 * ============================================================
 */

function extractLanguage(
  req: Request
) {
  const header =
    firstHeaderValue(
      req.headers["accept-language"]
    );

  if (!header) {
    return undefined;
  }

  const first =
    header
      .split(",")[0]
      ?.trim();

  if (!first) {
    return undefined;
  }

  return first
    .split(";")[0]
    ?.trim();
}

/**
 * ============================================================
 * UTM
 * ============================================================
 */

function extractUTM(
  req: Request
): QRRoutingUTM {
  const query = req.query;

  return {
    source: normalize(
      typeof query.utm_source === "string"
        ? query.utm_source
        : undefined
    ),

    medium: normalize(
      typeof query.utm_medium === "string"
        ? query.utm_medium
        : undefined
    ),

    campaign: normalize(
      typeof query.utm_campaign === "string"
        ? query.utm_campaign
        : undefined
    ),

    term: normalize(
      typeof query.utm_term === "string"
        ? query.utm_term
        : undefined
    ),

    content: normalize(
      typeof query.utm_content === "string"
        ? query.utm_content
        : undefined
    ),
  };
}

/**
 * ============================================================
 * REFERRER
 * ============================================================
 */

function extractReferrer(
  req: Request
) {
  return normalize(
    firstHeaderValue(
      req.headers.referer
    )
  );
}

/**
 * ============================================================
 * IP
 * ============================================================
 */


/**
 * ============================================================
 * VISITOR KEY
 * ============================================================
 */

function extractVisitorKey(
  req: Request
): string | undefined {
  const header =
    firstHeaderValue(
      req.headers[
        "x-tapqr-visitor-key"
      ]
    );

  if (!header) {
    return undefined;
  }

  if (header.length > 128) {
    return undefined;
  }

  return header;
}

/**
 * ============================================================
 * ANONYMOUS FALLBACK KEY
 * ============================================================
 */

export function createAnonymousVisitorKey(): string {
  return crypto
    .randomBytes(16)
    .toString("hex");
}

/**
 * ============================================================
 * GEO CONTEXT
 * ============================================================
 */

export interface GeoProviderResult {
  country?: string;
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export function buildGeoContext(
  result?: GeoProviderResult
): QRGeoContext {
  return {
    country: normalize(
      result?.country
    ),

    state: normalize(
      result?.state
    ),

    city: normalize(
      result?.city
    ),

    latitude:
      result?.latitude,

    longitude:
      result?.longitude,

    accuracy:
      result?.accuracy,
  };
}

/**
 * ============================================================
 * BUSINESS STATE
 * ============================================================
 */

export function normalizeBusinessState(
  value?: string | null
): QRBusinessState {
  const state =
    value?.toUpperCase();

  switch (state) {
    case "OPEN":
      return "OPEN";

    case "CLOSED":
      return "CLOSED";

    case "BUSY":
      return "BUSY";

    case "LOW_STOCK":
      return "LOW_STOCK";

    case "OUT_OF_STOCK":
      return "OUT_OF_STOCK";

    case "TEMPORARILY_UNAVAILABLE":
      return "TEMPORARILY_UNAVAILABLE";

    case "HOLIDAY":
      return "HOLIDAY";

    case "EMERGENCY":
      return "EMERGENCY";

    default:
      return "UNKNOWN";
  }
}

/**
 * ============================================================
 * VISITOR TYPE
 * ============================================================
 */

export function normalizeVisitorType(
  value?: string | null
): QRVisitorType {
  const normalized =
    value?.toUpperCase();

  if (normalized === "NEW") {
    return "NEW";
  }

  if (
    normalized === "RETURNING"
  ) {
    return "RETURNING";
  }

  return "UNKNOWN";
}

/**
 * ============================================================
 * AUTHENTICATION
 * ============================================================
 */

export function getAuthenticationState(
  authenticated: boolean
): QRAuthenticationState {
  return authenticated
    ? "AUTHENTICATED"
    : "UNAUTHENTICATED";
}

/**
 * ============================================================
 * CONTEXT BUILDER
 * ============================================================
 */

export interface BuildQRContextInput {
  req: Request;

  qrCodeId: string;

  businessId: string;

  scanCount: number;

  sourceType?: string | null;

  placementLabel?: string | null;

  locationLabel?: string | null;

  campaignName?: string | null;

  businessState?: string | null;

  catalogId?: string | null;

  catalogState?: string | null;

  customerId?: string;

  customerState?: string;

  customerSegment?: string;

  authenticated?: boolean;

  visitorType?: QRVisitorType;

  visitorKey?: string;

  subscriptionPlan?: string;

  geo?: GeoProviderResult;

  /**
   * Business-configured IANA timezone.
   *
   * Example:
   * Asia/Kolkata
   * America/New_York
   * Europe/London
   */
  timezone?: string | null;

  custom?: Record<
    string,
    unknown
  >;
}

export function buildQRRoutingContext(
  input: BuildQRContextInput
): QRRoutingContext {
  const userAgent =
    normalize(
      firstHeaderValue(
        input.req.headers[
          "user-agent"
        ]
      )
    ) ?? "";

  const now = new Date();

  /**
   * Express trust proxy is already configured
   * in the TapQR backend.
   */
  

  return {
    qrCodeId:
      input.qrCodeId,

    businessId:
      input.businessId,

    timestamp: now,

    /**
     * Use the business timezone.
     *
     * If unavailable, safely fall back to UTC.
     */
    timezone:
      normalize(input.timezone) ??
      "UTC",

    device: userAgent
      ? detectDevice(userAgent)
      : undefined,

    operatingSystem:
      userAgent
        ? detectOperatingSystem(
            userAgent
          )
        : undefined,

    browser: userAgent
      ? detectBrowser(userAgent)
      : undefined,

    language:
      extractLanguage(
        input.req
      ),

    geo:
      buildGeoContext(
        input.geo
      ),


    referrer:
      extractReferrer(
        input.req
      ),

    utm:
      extractUTM(
        input.req
      ),

    sourceType:
      normalize(
        input.sourceType
      ),

    placementLabel:
      normalize(
        input.placementLabel
      ),

    locationLabel:
      normalize(
        input.locationLabel
      ),

    campaignName:
      normalize(
        input.campaignName
      ),

    scanCount:
      input.scanCount,

    visitorType:
      input.visitorType ??
      normalizeVisitorType(
        undefined
      ),

    visitorKey:
      input.visitorKey ??
      extractVisitorKey(
        input.req
      ),

    customer: {
      customerId:
        input.customerId,

      state:
        normalize(
          input.customerState
        ),

      segment:
        normalize(
          input.customerSegment
        ),

      authenticated:
        getAuthenticationState(
          input.authenticated === true
        ),
    },

    catalog: {
      catalogId:
        input.catalogId ??
        undefined,

      state:
        normalize(
          input.catalogState
        ),
    },

    businessState:
      normalizeBusinessState(
        input.businessState
      ),

    subscriptionPlan:
      normalize(
        input.subscriptionPlan
      ),

    custom:
      input.custom ?? {},
  };
}