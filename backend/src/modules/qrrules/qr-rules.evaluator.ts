import {
  QRRuleConditionType,
  QRRuleLogic,
  QRRuleOperator,
} from "@prisma/client";

import {
  QRConditionGroupNode,
  QRConditionNode,
  QREvaluationConditionResult,
  QREvaluationGroupResult,
  QRRoutingContext,
} from "./qr-rules.types";

/**
 * ============================================================
 * ADVANCED TAPQR CONDITION EVALUATOR
 * ============================================================
 *
 * IMPORTANT ARCHITECTURE RULE:
 *
 * This class MUST remain pure.
 *
 * It:
 * - does not query Prisma
 * - does not call external APIs
 * - does not mutate database state
 * - does not increment counters
 * - does not assign experiments
 *
 * It receives:
 *
 *   QRRoutingContext
 *
 * and answers:
 *
 *   true / false + evaluation trace
 *
 * This makes the evaluator safe for:
 *
 * - production routing
 * - rule simulator
 * - automated tests
 * - preview mode
 * - conflict detection
 * - future rule debugging
 */

/* ============================================================
 * TYPES
 * ============================================================
 */

export interface ConditionEvaluationResult {
  matched: boolean;
  reason?: string;
}

export interface GroupEvaluationResult {
  matched: boolean;
  trace: QREvaluationGroupResult;
}

/* ============================================================
 * GENERIC HELPERS
 * ============================================================
 */

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  return normalized.length > 0
    ? normalized
    : undefined;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeString(item))
      .filter(
        (item): item is string => Boolean(item)
      );
  }

  const normalized = normalizeString(value);

  return normalized ? [normalized] : [];
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : undefined;
  }

  return undefined;
}

function toNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) {
    const number = toNumber(value);

    return number === undefined
      ? []
      : [number];
  }

  return value
    .map(toNumber)
    .filter(
      (item): item is number =>
        item !== undefined
    );
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/* ============================================================
 * DATE / TIME HELPERS
 * ============================================================
 */

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function getTimeMinutes(
  date: Date,
  timezone = "UTC"
): number {
  try {
    const formatter = new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }
    );

    const parts = formatter.formatToParts(date);

    const hour = Number(
      parts.find(
        (part) => part.type === "hour"
      )?.value ?? 0
    );

    const minute = Number(
      parts.find(
        (part) => part.type === "minute"
      )?.value ?? 0
    );

    return hour * 60 + minute;
  } catch {
    return (
      date.getUTCHours() * 60 +
      date.getUTCMinutes()
    );
  }
}

function parseTimeToMinutes(
  value: unknown
): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const match =
    value.trim().match(
      /^(\d{1,2}):(\d{2})$/
    );

  if (!match) {
    return undefined;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return undefined;
  }

  return hour * 60 + minute;
}

function isTimeBetween(
  current: number,
  start: number,
  end: number
): boolean {
  /**
   * Normal range:
   *
   * 09:00 → 18:00
   */
  if (start <= end) {
    return current >= start && current <= end;
  }

  /**
   * Overnight range:
   *
   * 22:00 → 06:00
   *
   * Matches:
   *
   * 22:00 → 23:59
   * OR
   * 00:00 → 06:00
   */
  return current >= start || current <= end;
}

function getDateParts(
  date: Date,
  timezone: string
) {
  try {
    const formatter = new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "long",
      }
    );

    const parts = formatter.formatToParts(date);

    const year = Number(
      parts.find(
        (part) => part.type === "year"
      )?.value
    );

    const month = Number(
      parts.find(
        (part) => part.type === "month"
      )?.value
    );

    const day = Number(
      parts.find(
        (part) => part.type === "day"
      )?.value
    );

    const weekday =
      parts.find(
        (part) => part.type === "weekday"
      )?.value;

    return {
      year,
      month,
      day,
      weekday,
    };
  } catch {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      weekday: new Intl.DateTimeFormat(
        "en-US",
        {
          weekday: "long",
          timeZone: "UTC",
        }
      ).format(date),
    };
  }
}

/* ============================================================
 * COMPARISON HELPERS
 * ============================================================
 */

function compareScalar(
  actual: unknown,
  operator: QRRuleOperator,
  expected: unknown
): boolean {
  switch (operator) {
    case QRRuleOperator.EQUALS:
      return equals(actual, expected);

    case QRRuleOperator.NOT_EQUALS:
      return !equals(actual, expected);

    case QRRuleOperator.GREATER_THAN:
      return compareNumbers(
        actual,
        expected,
        (a, b) => a > b
      );

    case QRRuleOperator.GREATER_THAN_OR_EQUAL:
      return compareNumbers(
        actual,
        expected,
        (a, b) => a >= b
      );

    case QRRuleOperator.LESS_THAN:
      return compareNumbers(
        actual,
        expected,
        (a, b) => a < b
      );

    case QRRuleOperator.LESS_THAN_OR_EQUAL:
      return compareNumbers(
        actual,
        expected,
        (a, b) => a <= b
      );

    case QRRuleOperator.CONTAINS:
      return contains(actual, expected);

    case QRRuleOperator.NOT_CONTAINS:
      return !contains(actual, expected);

    case QRRuleOperator.STARTS_WITH:
      return stringStartsWith(
        actual,
        expected
      );

    case QRRuleOperator.ENDS_WITH:
      return stringEndsWith(
        actual,
        expected
      );

    default:
      return false;
  }
}

function equals(
  actual: unknown,
  expected: unknown
): boolean {
  if (
    typeof actual === "number" &&
    typeof expected === "number"
  ) {
    return actual === expected;
  }

  if (
    typeof actual === "boolean" &&
    typeof expected === "boolean"
  ) {
    return actual === expected;
  }

  const a = normalizeString(actual);
  const b = normalizeString(expected);

  if (
    a !== undefined &&
    b !== undefined
  ) {
    return a === b;
  }

  return actual === expected;
}

function compareNumbers(
  actual: unknown,
  expected: unknown,
  comparator: (
    actual: number,
    expected: number
  ) => boolean
): boolean {
  const a = toNumber(actual);
  const b = toNumber(expected);

  if (
    a === undefined ||
    b === undefined
  ) {
    return false;
  }

  return comparator(a, b);
}

function contains(
  actual: unknown,
  expected: unknown
): boolean {
  if (Array.isArray(actual)) {
    return actual.some((item) =>
      equals(item, expected)
    );
  }

  const actualString =
    normalizeString(actual);

  const expectedString =
    normalizeString(expected);

  if (
    actualString === undefined ||
    expectedString === undefined
  ) {
    return false;
  }

  return actualString.includes(
    expectedString
  );
}

function stringStartsWith(
  actual: unknown,
  expected: unknown
): boolean {
  const a = normalizeString(actual);
  const b = normalizeString(expected);

  if (
    a === undefined ||
    b === undefined
  ) {
    return false;
  }

  return a.startsWith(b);
}

function stringEndsWith(
  actual: unknown,
  expected: unknown
): boolean {
  const a = normalizeString(actual);
  const b = normalizeString(expected);

  if (
    a === undefined ||
    b === undefined
  ) {
    return false;
  }

  return a.endsWith(b);
}

/* ============================================================
 * IN / NOT IN
 * ============================================================
 */

function evaluateMembership(
  actual: unknown,
  expected: unknown,
  operator: QRRuleOperator
): boolean {
  const expectedValues = Array.isArray(expected)
    ? expected
    : [expected];

  const matched = expectedValues.some(
    (item) => equals(actual, item)
  );

  if (operator === QRRuleOperator.IN) {
    return matched;
  }

  if (operator === QRRuleOperator.NOT_IN) {
    return !matched;
  }

  return false;
}

/* ============================================================
 * BETWEEN
 * ============================================================
 */

function evaluateBetween(
  actual: unknown,
  expected: unknown,
  operator: QRRuleOperator
): ConditionEvaluationResult {
  if (!Array.isArray(expected)) {
    return {
      matched: false,
      reason: "BETWEEN expects an array with [min, max].",
    };
  }

  if (expected.length < 2) {
    return {
      matched: false,
      reason: "BETWEEN requires at least two values.",
    };
  }

  const actualNumber = toNumber(actual);
  const min = toNumber(expected[0]);
  const max = toNumber(expected[1]);

  if (
    actualNumber === undefined ||
    min === undefined ||
    max === undefined
  ) {
    return {
      matched: false,
      reason: "BETWEEN values must be valid numbers.",
    };
  }

  if (min > max) {
    return {
      matched: false,
      reason: "BETWEEN minimum cannot be greater than maximum.",
    };
  }

  const matched =
    actualNumber >= min &&
    actualNumber <= max;

  const finalMatched =
    operator === QRRuleOperator.BETWEEN
      ? matched
      : !matched;

  return {
    matched: finalMatched,
    reason: finalMatched
      ? `Value ${actualNumber} is ${operator === QRRuleOperator.BETWEEN ? "between" : "outside"} ${min} and ${max}.`
      : `Value ${actualNumber} is not ${operator === QRRuleOperator.BETWEEN ? "between" : "outside"} ${min} and ${max}.`,
  };
}

/* ============================================================
 * GEO
 * ============================================================
 *
 * Haversine distance.
 *
 * Returns distance in kilometres.
 */

function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusKm = 6371;

  const toRadians = (
    degrees: number
  ) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
}

/* ============================================================
 * CONDITION VALUE EXTRACTION
 * ============================================================
 */

function getConditionContextValue(
  condition: QRConditionNode,
  context: QRRoutingContext
): unknown {
  switch (condition.type) {
    case QRRuleConditionType.TIME:
      return getTimeMinutes(
        context.timestamp,
        context.timezone
      );

    case QRRuleConditionType.DATE:
      return context.timestamp;

    case QRRuleConditionType.DAY_OF_WEEK:
      return getDateParts(
        context.timestamp,
        context.timezone
      ).weekday?.toUpperCase();

    case QRRuleConditionType.BUSINESS_HOURS:
      return context.businessState === "OPEN";

    case QRRuleConditionType.DEVICE:
      return context.device;

    case QRRuleConditionType.OPERATING_SYSTEM:
      return context.operatingSystem;

    case QRRuleConditionType.BROWSER:
      return context.browser;

    case QRRuleConditionType.LANGUAGE:
      return context.language;

    case QRRuleConditionType.COUNTRY:
      return context.geo.country;

    case QRRuleConditionType.STATE:
      return context.geo.state;

    case QRRuleConditionType.CITY:
      return context.geo.city;

    case QRRuleConditionType.REFERRER:
      return context.referrer;

    case QRRuleConditionType.UTM_SOURCE:
      return context.utm.source;

    case QRRuleConditionType.UTM_MEDIUM:
      return context.utm.medium;

    case QRRuleConditionType.UTM_CAMPAIGN:
      return context.utm.campaign;

    case QRRuleConditionType.UTM_TERM:
      return context.utm.term;

    case QRRuleConditionType.UTM_CONTENT:
      return context.utm.content;

    case QRRuleConditionType.QR_SOURCE:
      return context.sourceType;

    case QRRuleConditionType.QR_PLACEMENT:
      return context.placementLabel;

    case QRRuleConditionType.QR_LOCATION:
      return context.locationLabel;

    case QRRuleConditionType.CAMPAIGN:
      return context.campaignName;

    case QRRuleConditionType.SCAN_COUNT:
      return context.scanCount;

    case QRRuleConditionType.VISITOR_TYPE:
      return context.visitorType;

    case QRRuleConditionType.CUSTOMER_STATE:
      return context.customer.state;

    case QRRuleConditionType.CUSTOMER_SEGMENT:
      return context.customer.segment;

    case QRRuleConditionType.AUTHENTICATION_STATE:
      return context.customer.authenticated;

    case QRRuleConditionType.BUSINESS_STATE:
      return context.businessState;

    case QRRuleConditionType.CATALOG_STATE:
      return context.catalog.state;

    case QRRuleConditionType.SUBSCRIPTION_PLAN:
      return context.subscriptionPlan;

    case QRRuleConditionType.CUSTOM: {
      if (!isRecord(condition.value)) {
        return undefined;
      }

      const key =
        typeof condition.value.key ===
        "string"
          ? condition.value.key
          : undefined;

      if (!key) {
        return undefined;
      }

      return context.custom[key];
    }

    /**
     * PRODUCT_AVAILABILITY requires product/inventory
     * context to be injected by a trusted context provider.
     */
    case QRRuleConditionType.PRODUCT_AVAILABILITY:
      return context.custom.productAvailability;

    case QRRuleConditionType.GEO_RADIUS:
      return context.geo;

    default:
      return undefined;
  }
}

/* ============================================================
 * DATE EVALUATION
 * ============================================================
 */

function evaluateDateCondition(
  context: QRRoutingContext,
  condition: QRConditionNode
): ConditionEvaluationResult {
  const value = condition.value;

  const current = context.timestamp;

  if (
    condition.operator ===
      QRRuleOperator.EXISTS ||
    condition.operator ===
      QRRuleOperator.NOT_EXISTS
  ) {
    return {
      matched:
        condition.operator ===
        QRRuleOperator.EXISTS,
      reason:
        "Date context is always available.",
    };
  }

  if (isRecord(value)) {
    const from =
      typeof value.from === "string"
        ? new Date(value.from)
        : undefined;

    const to =
      typeof value.to === "string"
        ? new Date(value.to)
        : undefined;

    if (
      from &&
      !Number.isNaN(from.getTime()) &&
      to &&
      !Number.isNaN(to.getTime())
    ) {
      const matched =
        current >= from &&
        current <= to;

      return {
        matched:
          condition.operator ===
          QRRuleOperator.NOT_BETWEEN
            ? !matched
            : matched,
        reason: `Date range ${from.toISOString()} → ${to.toISOString()}`,
      };
    }
  }

  if (
    typeof value === "string"
  ) {
    const target = new Date(value);

    if (!Number.isNaN(target.getTime())) {
      const sameDay =
        current.getUTCFullYear() ===
          target.getUTCFullYear() &&
        current.getUTCMonth() ===
          target.getUTCMonth() &&
        current.getUTCDate() ===
          target.getUTCDate();

      if (
        condition.operator ===
        QRRuleOperator.EQUALS
      ) {
        return {
          matched: sameDay,
          reason: `Target date: ${target.toISOString()}`,
        };
      }

      if (
        condition.operator ===
        QRRuleOperator.NOT_EQUALS
      ) {
        return {
          matched: !sameDay,
        };
      }
    }
  }

  return {
    matched: false,
    reason: "Invalid date condition value.",
  };
}

/* ============================================================
 * TIME EVALUATION
 * ============================================================
 */

function evaluateTimeCondition(
  context: QRRoutingContext,
  condition: QRConditionNode
): ConditionEvaluationResult {
  const current = getTimeMinutes(
    context.timestamp,
    context.timezone
  );

  const value = condition.value;

  if (
    condition.operator ===
      QRRuleOperator.EXISTS ||
    condition.operator ===
      QRRuleOperator.NOT_EXISTS
  ) {
    return {
      matched:
        condition.operator ===
        QRRuleOperator.EXISTS,
    };
  }

  if (isRecord(value)) {
    const start = parseTimeToMinutes(
      value.start
    );

    const end = parseTimeToMinutes(
      value.end
    );

    if (
      start === undefined ||
      end === undefined
    ) {
      return {
        matched: false,
        reason: "Invalid time range.",
      };
    }

    const matched = isTimeBetween(
      current,
      start,
      end
    );

    return {
      matched,
      reason: `Current ${pad(
        Math.floor(current / 60)
      )}:${pad(current % 60)}`,
    };
  }

  if (Array.isArray(value)) {
    const times = value
      .map(parseTimeToMinutes)
      .filter(
        (item): item is number =>
          item !== undefined
      );

    if (!times.length) {
      return {
        matched: false,
        reason: "No valid time values.",
      };
    }

    const matched = times.includes(
      current
    );

    return {
      matched:
        condition.operator ===
        QRRuleOperator.NOT_EQUALS
          ? !matched
          : matched,
    };
  }

  const target = parseTimeToMinutes(
    value
  );

  if (target === undefined) {
    return {
      matched: false,
      reason: "Invalid time value.",
    };
  }

  return {
    matched: compareScalar(
      current,
      condition.operator,
      target
    ),
  };
}

/* ============================================================
 * DAY OF WEEK
 * ============================================================
 */

function evaluateDayOfWeek(
  context: QRRoutingContext,
  condition: QRConditionNode
): ConditionEvaluationResult {
  const weekday =
    getDateParts(
      context.timestamp,
      context.timezone
    ).weekday?.toUpperCase();

  if (!weekday) {
    return {
      matched: false,
      reason: "Unable to determine weekday.",
    };
  }

  if (
    condition.operator ===
      QRRuleOperator.IN ||
    condition.operator ===
      QRRuleOperator.NOT_IN
  ) {
    return {
      matched: evaluateMembership(
        weekday,
        toStringArray(condition.value),
        condition.operator
      ),
    };
  }

  return {
    matched: compareScalar(
      weekday,
      condition.operator,
      condition.value
    ),
  };
}

/* ============================================================
 * GEO RADIUS
 * ============================================================
 *
 * Expected condition:
 *
 * {
 *   latitude: 13.65,
 *   longitude: 78.05,
 *   radiusKm: 5
 * }
 */

function evaluateGeoRadius(
  context: QRRoutingContext,
  condition: QRConditionNode
): ConditionEvaluationResult {
  if (!isRecord(condition.value)) {
    return {
      matched: false,
      reason: "Invalid geo-radius configuration.",
    };
  }

  const latitude =
    toNumber(condition.value.latitude);

  const longitude =
    toNumber(condition.value.longitude);

  const radiusKm =
    toNumber(condition.value.radiusKm);

  const userLatitude =
    context.geo.latitude;

  const userLongitude =
    context.geo.longitude;

  if (
    latitude === undefined ||
    longitude === undefined ||
    radiusKm === undefined ||
    userLatitude === undefined ||
    userLongitude === undefined
  ) {
    return {
      matched: false,
      reason:
        "Insufficient geographic information.",
    };
  }

  const distance = calculateDistanceKm(
    userLatitude,
    userLongitude,
    latitude,
    longitude
  );

  const matched =
    distance <= radiusKm;

  if (
    condition.operator ===
    QRRuleOperator.NOT_EQUALS
  ) {
    return {
      matched: !matched,
      reason: `${distance.toFixed(
        2
      )} km from target`,
    };
  }

  return {
    matched,
    reason: `${distance.toFixed(
      2
    )} km from target; radius ${radiusKm} km`,
  };
}

/* ============================================================
 * EXISTENCE
 * ============================================================
 */

function evaluateExistence(
  actual: unknown,
  operator: QRRuleOperator
): ConditionEvaluationResult {
  const exists =
    actual !== undefined &&
    actual !== null &&
    actual !== "";

  if (
    operator === QRRuleOperator.EXISTS
  ) {
    return {
      matched: exists,
      reason: exists
        ? "Value exists."
        : "Value does not exist.",
    };
  }

  if (
    operator ===
    QRRuleOperator.NOT_EXISTS
  ) {
    return {
      matched: !exists,
      reason: exists
        ? "Value exists."
        : "Value does not exist.",
    };
  }

  return {
    matched: false,
  };
}

/* ============================================================
 * MAIN CONDITION EVALUATOR
 * ============================================================
 */

export class QRRuleConditionEvaluator {
  evaluateCondition(
    condition: QRConditionNode,
    context: QRRoutingContext
  ): QREvaluationConditionResult {
    const actual =
      getConditionContextValue(
        condition,
        context
      );

    /**
     * Existence operators work even when the value
     * is missing.
     */
    if (
      condition.operator ===
        QRRuleOperator.EXISTS ||
      condition.operator ===
        QRRuleOperator.NOT_EXISTS
    ) {
      const result = evaluateExistence(
        actual,
        condition.operator
      );

      return {
        conditionId: condition.id,
        type: condition.type,
        operator: condition.operator,
        matched: result.matched,
        reason: result.reason,
      };
    }

    /**
     * Missing context must fail closed.
     *
     * Example:
     *
     * Rule says:
     * COUNTRY = IN
     *
     * but geo lookup failed.
     *
     * We DO NOT assume India.
     */
    if (
      actual === undefined ||
      actual === null
    ) {
      return {
        conditionId: condition.id,
        type: condition.type,
        operator: condition.operator,
        matched: false,
        reason:
          "Required context value is unavailable.",
      };
    }

    let result: ConditionEvaluationResult;

    switch (condition.type) {
      case QRRuleConditionType.TIME:
        result = evaluateTimeCondition(
          context,
          condition
        );
        break;

      case QRRuleConditionType.DATE:
        result = evaluateDateCondition(
          context,
          condition
        );
        break;

      case QRRuleConditionType.DAY_OF_WEEK:
        result = evaluateDayOfWeek(
          context,
          condition
        );
        break;

      case QRRuleConditionType.GEO_RADIUS:
        result = evaluateGeoRadius(
          context,
          condition
        );
        break;

      default:
        if (
          condition.operator ===
            QRRuleOperator.IN ||
          condition.operator ===
            QRRuleOperator.NOT_IN
        ) {
          result = {
            matched: evaluateMembership(
              actual,
              condition.value,
              condition.operator
            ),
          };
        } else if (
          condition.operator ===
            QRRuleOperator.BETWEEN ||
          condition.operator ===
            QRRuleOperator.NOT_BETWEEN
        ) {
          result = evaluateBetween(
            actual,
            condition.value,
            condition.operator
          );
        } else {
          result = {
            matched: compareScalar(
              actual,
              condition.operator,
              condition.value
            ),
          };
        }

        break;
    }

    return {
      conditionId: condition.id,
      type: condition.type,
      operator: condition.operator,
      matched: result.matched,
      reason: result.reason,
    };
  }

  /**
   * ==========================================================
   * GROUP EVALUATION
   * ==========================================================
   *
   * Recursive evaluator for:
   *
   * AND
   * OR
   *
   * with nested groups.
   */
  evaluateGroup(
    group: QRConditionGroupNode,
    context: QRRoutingContext
  ): GroupEvaluationResult {
    const conditionResults =
      group.conditions
        .slice()
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder
        )
        .map((condition) =>
          this.evaluateCondition(
            condition,
            context
          )
        );

    const childResults =
      group.children
        .slice()
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder
        )
        .map((child) =>
          this.evaluateGroup(
            child,
            context
          )
        );

    const allResults = [
      ...conditionResults.map(
        (result) => result.matched
      ),
      ...childResults.map(
        (result) => result.matched
      ),
    ];

    /**
     * Empty groups fail closed.
     *
     * An accidental empty rule should never become
     * an unconditional production rule.
     */
    if (allResults.length === 0) {
      return {
        matched: false,
        trace: {
          groupId: group.id,
          logic: group.logic,
          matched: false,
          conditions: conditionResults,
          children:
            childResults.map(
              (result) => result.trace
            ),
          reason:
            "Condition group contains no conditions.",
        },
      };
    }

    const matched =
      group.logic === QRRuleLogic.AND
        ? allResults.every(Boolean)
        : allResults.some(Boolean);

    return {
      matched,
      trace: {
        groupId: group.id,
        logic: group.logic,
        matched,
        conditions: conditionResults,
        children:
          childResults.map(
            (result) => result.trace
          ),
      },
    };
  }
}

/**
 * Singleton instance.
 *
 * The evaluator is stateless, so a shared instance is safe.
 */
export const qrRuleConditionEvaluator =
  new QRRuleConditionEvaluator();