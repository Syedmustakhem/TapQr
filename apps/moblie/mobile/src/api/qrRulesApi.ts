// src/api/qrRulesApi.ts
//
// Smart Rule endpoints, mirroring the TapQR web dashboard
// (app/dashboard/qr/rules, /rules/new, /rules/[ruleId] call
// these exact paths against https://api.tapqr.shop/api).
//
// Uses the shared authenticated axios instance from
// authApi.ts (Bearer token + 401 refresh interceptors).
//
// NOTE (replication fix): the web Edit flow is broken —
// the Edit button links to /dashboard/qr/rules/new?edit=<id>
// but the page ignores the `edit` param and shows a blank
// create form; updateQRRule (PATCH /qr-rules/:id) is never
// called. Mobile implements edit properly via PATCH.

import api from "./authApi";

export type QRRuleStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "EXPIRED"
  | "ARCHIVED";

export type QRRuleLogic =
  | "AND"
  | "OR";

export type QRRuleConditionType =
  | "TIME"
  | "DATE"
  | "DAY_OF_WEEK"
  | "BUSINESS_HOURS"
  | "DEVICE"
  | "OPERATING_SYSTEM"
  | "BROWSER"
  | "LANGUAGE"
  | "COUNTRY"
  | "STATE"
  | "CITY"
  | "GEO_RADIUS"
  | "REFERRER"
  | "UTM_SOURCE"
  | "UTM_MEDIUM"
  | "UTM_CAMPAIGN"
  | "UTM_TERM"
  | "UTM_CONTENT"
  | "QR_SOURCE"
  | "QR_PLACEMENT"
  | "QR_LOCATION"
  | "CAMPAIGN"
  | "SCAN_COUNT"
  | "VISITOR_TYPE"
  | "CUSTOMER_STATE"
  | "CUSTOMER_SEGMENT"
  | "AUTHENTICATION_STATE"
  | "BUSINESS_STATE"
  | "CATALOG_STATE"
  | "PRODUCT_AVAILABILITY"
  | "SUBSCRIPTION_PLAN"
  | "CUSTOM";

export type QRRuleOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "GREATER_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN"
  | "LESS_THAN_OR_EQUAL"
  | "IN"
  | "NOT_IN"
  | "BETWEEN"
  | "NOT_BETWEEN"
  | "CONTAINS"
  | "NOT_CONTAINS"
  | "STARTS_WITH"
  | "ENDS_WITH"
  | "EXISTS"
  | "NOT_EXISTS";

export type QRRuleActionType =
  | "EXPERIENCE"
  | "REDIRECT"
  | "CATALOG"
  | "MENU"
  | "SERVICES"
  | "PRODUCTS"
  | "CONTACT"
  | "CAMPAIGN"
  | "CUSTOM";

export type QRRuleMatchStatus =
  | "MATCHED"
  | "NOT_MATCHED"
  | "FALLBACK"
  | "ERROR";

export type QRRuleCondition = {
  id?: string;
  type: QRRuleConditionType;
  operator: QRRuleOperator;
  value?: unknown;
  value2?: unknown;
  metadata?: Record<string, unknown>;
  sortOrder?: number;
};

export type QRRuleConditionGroup = {
  id?: string;
  logic: QRRuleLogic;
  conditions: QRRuleCondition[];
  children?: QRRuleConditionGroup[];
  sortOrder?: number;
};

export type QRRuleAction = {
  type: QRRuleActionType;
  value?: string | null;
};

export type QRRule = {
  id: string;
  qrCodeId: string;

  name: string;
  description?: string | null;

  status: QRRuleStatus;

  priority: number;
  logic: QRRuleLogic;

  actionType?: QRRuleActionType | null;
  actionValue?: string | null;

  fallbackActionType?: QRRuleActionType | null;
  fallbackActionValue?: string | null;

  conditions?: QRRuleCondition[];
  groups?: QRRuleConditionGroup[];

  matchCount?: number | null;
  lastMatchedAt?: string | null;

  publishedVersion?: number | null;

  experimentId?: string | null;

  startsAt?: string | null;
  endsAt?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

export type QRRuleMatch = {
  id: string;
  qrCodeId: string;
  ruleId?: string | null;
  ruleVersion?: number | null;

  status: QRRuleMatchStatus;

  actionType?: QRRuleActionType | null;
  actionValue?: string | null;

  device?: string | null;
  operatingSystem?: string | null;
  browser?: string | null;

  country?: string | null;
  state?: string | null;
  city?: string | null;

  language?: string | null;
  referrer?: string | null;

  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;

  sourceType?: string | null;

  visitorKey?: string | null;

  matchedAt: string;
};

export type CreateQRRuleInput = {
  qrCodeId: string;

  name: string;
  description?: string;

  priority?: number;

  logic?: QRRuleLogic;

  conditions?: QRRuleCondition[];

  groups?: QRRuleConditionGroup[];

  actionType: QRRuleActionType;
  actionValue?: string | null;

  fallbackActionType?: QRRuleActionType | null;
  fallbackActionValue?: string | null;

  startsAt?: string;
  endsAt?: string;
  experimentId?: string;
  status?: QRRuleStatus;
};

export type UpdateQRRuleInput = {
  name?: string;
  description?: string | null;

  priority?: number;

  logic?: QRRuleLogic;

  conditions?: QRRuleCondition[];

  groups?: QRRuleConditionGroup[];

  actionType?: QRRuleActionType;
  actionValue?: string | null;

  fallbackActionType?: QRRuleActionType | null;
  fallbackActionValue?: string | null;
};

export type QRRuleSimulationInput = {
  qrCodeId: string;

  ruleId?: string;

  device?: string;
  operatingSystem?: string;
  browser?: string;

  country?: string;
  state?: string;
  city?: string;

  language?: string;

  referrer?: string;

  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;

  sourceType?: string;
  placementLabel?: string;
  locationLabel?: string;
  campaignName?: string;

  scanCount?: number;

  visitorType?: string;
  customerState?: string;
  customerSegment?: string;

  authenticated?: boolean;

  subscriptionPlan?: string;

  timestamp?: string;
  timezone?: string;

  custom?: Record<string, unknown>;
};

export type QRRuleSimulationResult = {
  matched: boolean;

  ruleId?: string | null;
  ruleName?: string | null;

  actionType?: QRRuleActionType | null;
  actionValue?: string | null;

  fallback?: boolean;

  trace?: unknown[];
};

type QRRuleListResponse = {
  success?: boolean;
  message?: string;
  data?: QRRule[];
};

type QRRuleResponse = {
  success?: boolean;
  message?: string;
  data?: QRRule;
};

type QRRuleMatchesResponse = {
  success?: boolean;
  message?: string;
  data?: QRRuleMatch[];
};

/**
 * GET /qr-rules/qr/:qrCodeId — list smart rules
 * attached to a QR code.
 */
export async function listQRRules(
  qrCodeId: string
): Promise<QRRule[]> {
  const res =
    await api.get<QRRuleListResponse>(
      `/qr-rules/qr/${encodeURIComponent(
        qrCodeId
      )}`
    );

  return res.data?.data ?? [];
}

/**
 * GET /qr-rules/:ruleId — load one rule with its
 * conditions, groups, and routing action.
 */
export async function getQRRule(
  ruleId: string
): Promise<QRRule> {
  const res =
    await api.get<QRRuleResponse>(
      `/qr-rules/${encodeURIComponent(
        ruleId
      )}`
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Rule not found."
    );
  }

  return res.data.data;
}

/**
 * POST /qr-rules — create a rule. The web builder
 * always saves as DRAFT.
 */
export async function createQRRule(
  input: CreateQRRuleInput
): Promise<QRRule> {
  const res =
    await api.post<QRRuleResponse>(
      "/qr-rules",
      input
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to create rule."
    );
  }

  return res.data.data;
}

/**
 * PATCH /qr-rules/:id — update a rule (EDIT).
 * The web dashboard never calls this endpoint
 * (its Edit flow is broken); mobile implements
 * it properly.
 */
export async function updateQRRule(
  ruleId: string,
  input: UpdateQRRuleInput
): Promise<QRRule> {
  const res =
    await api.patch<QRRuleResponse>(
      `/qr-rules/${encodeURIComponent(
        ruleId
      )}`,
      input
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to update rule."
    );
  }

  return res.data.data;
}

/**
 * POST /qr-rules/:id/publish — publish a rule.
 */
export async function publishQRRule(
  ruleId: string
): Promise<QRRule> {
  const res =
    await api.post<QRRuleResponse>(
      `/qr-rules/${encodeURIComponent(
        ruleId
      )}/publish`
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to publish rule."
    );
  }

  return res.data.data;
}

/**
 * POST /qr-rules/:id/pause — pause an active rule.
 */
export async function pauseQRRule(
  ruleId: string
): Promise<QRRule> {
  const res =
    await api.post<QRRuleResponse>(
      `/qr-rules/${encodeURIComponent(
        ruleId
      )}/pause`
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to pause rule."
    );
  }

  return res.data.data;
}

/**
 * POST /qr-rules/:id/activate — activate a
 * paused/draft rule.
 */
export async function activateQRRule(
  ruleId: string
): Promise<QRRule> {
  const res =
    await api.post<QRRuleResponse>(
      `/qr-rules/${encodeURIComponent(
        ruleId
      )}/activate`
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to activate rule."
    );
  }

  return res.data.data;
}

/**
 * DELETE /qr-rules/:id — delete a rule.
 */
export async function deleteQRRule(
  ruleId: string
): Promise<void> {
  await api.delete(
    `/qr-rules/${encodeURIComponent(
      ruleId
    )}`
  );
}

/**
 * POST /qr-rules/simulate — test a rule against a
 * fabricated scan context.
 */
export async function simulateQRRule(
  input: QRRuleSimulationInput
): Promise<QRRuleSimulationResult> {
  const res = await api.post<{
    success?: boolean;
    message?: string;
    data?: QRRuleSimulationResult;
  }>("/qr-rules/simulate", input);

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Simulation failed."
    );
  }

  return res.data.data;
}

/**
 * GET /qr-rules/qr/:qrCodeId/matches?ruleId=&limit=25
 * — recent scans evaluated against a rule.
 */
export async function getQRRuleMatches(
  qrCodeId: string,
  params?: {
    ruleId?: string;
    limit?: number;
  }
): Promise<QRRuleMatch[]> {
  const search = new URLSearchParams();

  if (params?.ruleId) {
    search.set("ruleId", params.ruleId);
  }

  search.set(
    "limit",
    String(params?.limit ?? 25)
  );

  const query = search.toString();

  const res =
    await api.get<QRRuleMatchesResponse>(
      `/qr-rules/qr/${encodeURIComponent(
        qrCodeId
      )}/matches?${query}`
    );

  return res.data?.data ?? [];
}

/*
 * DEFERRED: POST /qr-rules/:id/rollback — rollback a rule
 * to an earlier version. Unused on the web dashboard
 * (RuleVersions is never rendered), so mobile defers it.
 */
