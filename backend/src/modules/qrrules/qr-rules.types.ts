import {
  QRRuleActionType,
  QRRuleConditionType,
  QRRuleLogic,
  QRRuleMatchStatus,
  QRRuleOperator,
  QRRuleOverrideType,
} from "@prisma/client";

/**
 * ============================================================
 * ROUTING CONTEXT
 * ============================================================
 *
 * Everything the rule engine is allowed to use when making
 * a routing decision.
 *
 * Keep this object normalized and deterministic.
 */

export interface QRRoutingUTM {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface QRGeoContext {
  country?: string;
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export type QRVisitorType =
  | "NEW"
  | "RETURNING"
  | "UNKNOWN";

export type QRAuthenticationState =
  | "AUTHENTICATED"
  | "UNAUTHENTICATED"
  | "UNKNOWN";

export type QRBusinessState =
  | "OPEN"
  | "CLOSED"
  | "BUSY"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "TEMPORARILY_UNAVAILABLE"
  | "HOLIDAY"
  | "EMERGENCY"
  | "UNKNOWN";

export interface QRCustomerContext {
  customerId?: string;
  state?: string;
  segment?: string;
  authenticated: QRAuthenticationState;
}

export interface QRCatalogContext {
  catalogId?: string;
  state?: string;
}

export interface QRRoutingContext {
  qrCodeId: string;
  businessId: string;

  timestamp: Date;
  timezone: string;

  device?: string;
  operatingSystem?: string;
  browser?: string;
  language?: string;

  geo: QRGeoContext;

  referrer?: string;

  utm: QRRoutingUTM;

  sourceType?: string;
  placementLabel?: string;
  locationLabel?: string;

  campaignName?: string;

  scanCount: number;

  visitorType: QRVisitorType;
  visitorKey?: string;

  customer: QRCustomerContext;
  catalog: QRCatalogContext;

  businessState: QRBusinessState;

  subscriptionPlan?: string;

  /**
   * Optional arbitrary context supplied by trusted
   * internal integrations.
   *
   * NEVER accept arbitrary client-controlled values here
   * for privileged conditions.
   */
  custom: Record<string, unknown>;
}

/**
 * ============================================================
 * CONDITION VALUES
 * ============================================================
 */

export type QRConditionValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | Record<string, unknown>
  | null;

/**
 * ============================================================
 * CONDITION
 * ============================================================
 */

export interface QRConditionNode {
  id: string;

  type: QRRuleConditionType;
  operator: QRRuleOperator;

  value: QRConditionValue;

  sortOrder: number;
}

/**
 * ============================================================
 * CONDITION GROUP
 * ============================================================
 */

export interface QRConditionGroupNode {
  id: string;

  logic: QRRuleLogic;

  sortOrder: number;

  conditions: QRConditionNode[];

  children: QRConditionGroupNode[];
}

/**
 * ============================================================
 * RULE ACTION
 * ============================================================
 */

export interface QRRuleAction {
  type: QRRuleActionType;
  value: string;
}

/**
 * ============================================================
 * FALLBACK
 * ============================================================
 */

export interface QRRuleFallback {
  type?: QRRuleActionType;
  value?: string;
}

/**
 * ============================================================
 * ROUTING RESULT
 * ============================================================
 */

export interface QRRoutingResult {
  status: QRRuleMatchStatus;

  qrCodeId: string;

  ruleId?: string;

  ruleVersion?: number;

  action?: QRRuleAction;

  fallback?: QRRuleFallback;

  experimentId?: string;

  variantId?: string;

  /**
   * Useful for simulator/debugging.
   */
  evaluation: QREvaluationTrace;

  matchedAt: Date;
}

/**
 * ============================================================
 * EVALUATION TRACE
 * ============================================================
 *
 * This powers the future Rule Simulator.
 */

export interface QREvaluationConditionResult {
  conditionId: string;

  type: QRRuleConditionType;

  operator: QRRuleOperator;

  matched: boolean;

  reason?: string;
}

export interface QREvaluationGroupResult {
  groupId: string;

  logic: QRRuleLogic;

  matched: boolean;

  conditions: QREvaluationConditionResult[];

  children: QREvaluationGroupResult[];

  reason?: string;
}

export interface QREvaluationRuleResult {
  ruleId: string;

  priority: number;

  matched: boolean;

  skipped?: boolean;

  reason?: string;

  groups: QREvaluationGroupResult[];
}

export interface QREvaluationTrace {
  rules: QREvaluationRuleResult[];

  selectedRuleId?: string;

  selectedReason?: string;
}

/**
 * ============================================================
 * ENGINE OPTIONS
 * ============================================================
 */

export interface QRRoutingEngineOptions {
  /**
   * Simulator mode does not mutate:
   * - match counters
   * - experiments
   * - analytics
   */
  simulation?: boolean;

  /**
   * Include detailed evaluation information.
   */
  includeTrace?: boolean;

  /**
   * Skip analytics persistence.
   */
  skipAnalytics?: boolean;

  /**
   * Optional forced timestamp for simulator/testing.
   */
  now?: Date;

  /**
   * Optional timezone override for simulator/testing.
   */
  timezone?: string;
}

/**
 * ============================================================
 * RULE DECISION
 * ============================================================
 */

export interface QRRuleDecision {
  matched: boolean;

  action?: QRRuleAction;

  ruleId?: string;

  ruleVersion?: number;

  experimentId?: string;

  variantId?: string;

  reason?: string;
}

/**
 * ============================================================
 * OVERRIDE DECISION
 * ============================================================
 */

export interface QROverrideDecision {
  matched: boolean;

  overrideId?: string;

  type?: QRRuleOverrideType;

  action?: QRRuleAction;

  reason?: string;
}