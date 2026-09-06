import {
  QRRuleConditionType,
  QRRuleLogic,
  QRRuleMatchStatus,
  QRRuleOverrideType,
} from "@prisma/client";

import { QRRulesRepository } from "./qr-rules.repository";

import {
  QRConditionGroupNode,
  QRConditionNode,
  QRConditionValue,
  QREvaluationRuleResult,
  QREvaluationTrace,
  QROverrideDecision,
  QRRoutingContext,
  QRRoutingEngineOptions,
  QRRoutingResult,
  QRRuleAction,
} from "./qr-rules.types";

import { qrRuleConditionEvaluator } from "./qr-rules.evaluator";

/**
 * ============================================================
 * TAPQR QR ROUTING ENGINE
 * ============================================================
 *
 * Central decision-making layer for TapQR Smart QR routing.
 *
 * Responsibilities:
 *
 * 1. Load QR configuration
 * 2. Resolve emergency/business/system overrides
 * 3. Load active rules
 * 4. Build nested condition trees
 * 5. Evaluate rules by priority
 * 6. Resolve experiments / variants
 * 7. Select the final action
 * 8. Resolve default QR fallback
 * 9. Record routing analytics
 *
 * Deliberately does NOT:
 *
 * - parse Express requests
 * - parse user agents
 * - perform geolocation
 * - manage HTTP responses
 *
 * Those responsibilities belong to the context layer
 * and controllers/public routing layer.
 */

/**
 * ============================================================
 * ENGINE INPUT
 * ============================================================
 */

interface EngineInput {
  qrCodeId: string;

  context: QRRoutingContext;

  options?: QRRoutingEngineOptions;
}

/**
 * ============================================================
 * LOADED RULE
 * ============================================================
 *
 * This is the shape consumed by the routing engine.
 *
 * Important:
 *
 * `logic` must exist here because QRRule.logic controls
 * how direct conditions and root condition groups are combined.
 */

interface LoadedRule {
  id: string;

  priority: number;

  /**
   * Top-level rule condition logic.
   *
   * Example:
   *
   * AND
   * OR
   */
  logic: QRRuleLogic;

  actionType: QRRuleActionTypeLike;

  actionValue: string;

  fallbackActionType:
    | QRRuleActionTypeLike
    | null;

  fallbackActionValue: string | null;

  publishedVersion: number | null;

  experiment:
    | {
        id: string;

        variants: Array<{
          id: string;

          name: string;

          allocation: number;

          actionType: QRRuleActionTypeLike;

          actionValue: string;
        }>;
      }
    | null;

  /**
   * Conditions directly attached to the rule.
   *
   * groupId === null means the condition belongs
   * directly to the root rule expression.
   */
  conditions: Array<{
    id: string;

    groupId: string | null;

    type: QRRuleConditionType;

    operator: any;

    value: unknown;

    sortOrder: number;
  }>;

  /**
   * Effective condition groups used by the live router.
   *
   * IMPORTANT:
   * These come from the PUBLISHED version snapshot.
   */
  conditionGroups: any[];

  /**
   * Published rule versions.
   */
  versions: Array<{
    version: number;

    snapshot: unknown;
  }>;
}

/**
 * ============================================================
 * ACTION TYPE
 * ============================================================
 *
 * Kept flexible because the Prisma enum and routing layer
 * may evolve independently as new QR action types are added.
 */

type QRRuleActionTypeLike = any;

/**
 * ============================================================
 * QR ROUTING ENGINE
 * ============================================================
 */

export class QRRoutingEngine {
  private readonly repository: QRRulesRepository;

  constructor(
    repository = new QRRulesRepository()
  ) {
    this.repository = repository;
  }

  /**
   * ==========================================================
   * PUBLIC ENTRY POINT
   * ==========================================================
   *
   * Main routing method.
   *
   * Flow:
   *
   * QR
   *  ↓
   * Override
   *  ↓
   * Active Rules
   *  ↓
   * Condition Tree
   *  ↓
   * Evaluation
   *  ↓
   * Experiment
   *  ↓
   * Action
   *  ↓
   * Analytics
   */

  async resolve(
    input: EngineInput
  ): Promise<QRRoutingResult> {
    const {
      qrCodeId,
      context,
      options = {},
    } = input;

    /**
     * Use explicitly supplied time when simulation/testing
     * requires it. Otherwise use the context timestamp.
     */
    const now =
      options.now ?? context.timestamp;

    /**
     * Trace is useful for:
     *
     * - simulator
     * - debugging
     * - admin dashboard
     * - rule testing
     * - future conflict detection
     */
    const includeTrace =
      options.includeTrace ?? true;

    const trace: QREvaluationTrace = {
      rules: [],
    };

    /**
     * --------------------------------------------------------
     * STEP 1 — VERIFY QR
     * --------------------------------------------------------
     */

    const qrCode =
      await this.repository.findQRCodeForRouting(
        qrCodeId
      );

    if (!qrCode) {
      return this.createResult({
        status: QRRuleMatchStatus.ERROR,

        qrCodeId,

        trace,

        reason: "QR code not found.",

        now,
      });
    }

    /**
     * --------------------------------------------------------
     * STEP 2 — EMERGENCY / BUSINESS OVERRIDE
     * --------------------------------------------------------
     *
     * Overrides have priority over normal Smart Rules.
     *
     * Example:
     *
     * QR normally opens Menu
     *
     * Emergency override:
     * "Restaurant temporarily closed"
     *
     * Result:
     * Closed page
     */

    const overrides =
      await this.repository.findActiveOverrides(
        qrCodeId,
        now
      );

    const overrideDecision =
      this.resolveOverride(
        overrides,
        context
      );

    if (overrideDecision.matched) {
      const result =
        this.createResult({
          status:
            QRRuleMatchStatus.MATCHED,

          qrCodeId,

          ruleId:
            overrideDecision.overrideId,

          action:
            overrideDecision.action,

          reason:
            overrideDecision.reason ??
            "Override matched.",

          trace,

          now,
        });

      /**
       * Simulation must never mutate analytics.
       */
      if (
        !options.simulation &&
        !options.skipAnalytics
      ) {
        await this.recordMatch(
          result,
          context
        );
      }

      return this.stripTraceIfNeeded(
        result,
        includeTrace
      );
    }

    /**
     * --------------------------------------------------------
     * STEP 3 — LOAD ACTIVE RULES
     * --------------------------------------------------------
     */

    const rules =
      await this.repository.findActiveRules(
        qrCodeId,
        now
      );

    /**
     * IMPORTANT — PUBLISHED VERSION IS THE LIVE SOURCE OF TRUTH
     *
     * QRRule also stores editable fields. Those fields may represent
     * an unpublished draft after an admin edits a live rule.
     *
     * Therefore production routing MUST NOT read the editable QRRule
     * configuration directly. It reads the immutable PUBLISHED
     * version snapshot instead.
     */
    const effectiveRules =
      rules.map((rule) =>
        this.applyPublishedVersion(rule)
      );

    /**
     * No rules means:
     *
     * QR → default destination/experience
     */

    if (!effectiveRules.length) {
      return this.resolveFallback({
        qrCode,

        context,

        qrCodeId,

        trace,

        now,

        includeTrace,

        options,
      });
    }

    /**
     * --------------------------------------------------------
     * STEP 4 — LOAD CONDITION GROUPS
     * --------------------------------------------------------
     */

    const ruleIds =
      effectiveRules.map(
        (rule) => rule.id
      );

    const groups =
      await this.repository.findConditionGroups(
        ruleIds
      );

    /**
     * --------------------------------------------------------
     * STEP 5 — GROUP CONDITION GROUPS BY RULE
     * --------------------------------------------------------
     */

    const groupMap =
      this.groupGroupsByRule(
        groups
      );

    /**
     * --------------------------------------------------------
     * STEP 6 — EVALUATE RULES
     * --------------------------------------------------------
     *
     * Repository is responsible for returning active rules
     * in priority order.
     *
     * Highest-priority matching rule wins.
     */

    for (const rule of effectiveRules) {
      /**
       * Build a complete root condition expression from the
       * PUBLISHED snapshot.
       *
       * The repository groups are retained only as a backward-
       * compatibility fallback for older versions that do not
       * contain a complete group snapshot.
       */
      const root =
        this.buildRootConditionGroup(
          rule,
          rule.conditionGroups.length
            ? rule.conditionGroups
            : groupMap.get(rule.id) ?? []
        );

      /**
       * Evaluate the complete tree.
       */
      const evaluation =
        qrRuleConditionEvaluator.evaluateGroup(
          root,
          context
        );

      /**
       * Build trace entry for this rule.
       */
      const ruleTrace: QREvaluationRuleResult =
        {
          ruleId: rule.id,

          priority: rule.priority,

          matched:
            evaluation.matched,

          groups: [
            evaluation.trace,
          ],
        };

      /**
       * Rule did not match.
       */
      if (!evaluation.matched) {
        ruleTrace.reason =
          "Conditions did not match.";

        trace.rules.push(
          ruleTrace
        );

        continue;
      }

      /**
       * Rule matched.
       */
      ruleTrace.reason =
        "All required conditions matched.";

      trace.rules.push(
        ruleTrace
      );

      /**
       * ------------------------------------------------------
       * STEP 7 — EXPERIMENT
       * ------------------------------------------------------
       *
       * If this rule has an active experiment,
       * determine the visitor's variant.
       */

      const experimentDecision =
        await this.resolveExperiment(
          rule,
          context,
          options
        );

      /**
       * ------------------------------------------------------
       * STEP 8 — SELECT ACTION
       * ------------------------------------------------------
       *
       * Experiment action wins over rule action.
       */

      const action =
        experimentDecision?.action ??
        this.normalizeAction(
          rule.actionType,
          rule.actionValue
        );

      trace.selectedRuleId =
        rule.id;

      trace.selectedReason =
        experimentDecision
          ? "Rule matched and experiment variant selected."
          : "Highest-priority matching rule selected.";

      /**
       * Build final result.
       */
      const result =
        this.createResult({
          status:
            QRRuleMatchStatus.MATCHED,

          qrCodeId,

          ruleId:
            rule.id,

          ruleVersion:
            rule.publishedVersion ??
            rule.versions[0]?.version,

          action,

          experimentId:
            experimentDecision?.experimentId,

          variantId:
            experimentDecision?.variantId,

          trace,

          now,
        });

      /**
       * ------------------------------------------------------
       * STEP 9 — PERSIST MATCH
       * ------------------------------------------------------
       */

      if (
        !options.simulation &&
        !options.skipAnalytics
      ) {
        await this.persistSuccessfulMatch(
          result,
          context
        );
      }

      return this.stripTraceIfNeeded(
        result,
        includeTrace
      );
    }

    /**
     * --------------------------------------------------------
     * STEP 10 — NOTHING MATCHED
     * --------------------------------------------------------
     */

    return this.resolveFallback({
      qrCode,

      context,

      qrCodeId,

      trace,

      now,

      includeTrace,

      options,
    });
  }

  /**
   * ==========================================================
   * PUBLISHED VERSION NORMALIZATION
   * ==========================================================
   *
   * A QRRule row can contain an unpublished draft while the
   * QR is still live on an older published version.
   *
   * The router therefore materializes the effective rule from
   * the latest PUBLISHED snapshot.
   */
  private applyPublishedVersion(
    rule: any
  ): LoadedRule {
    const publishedVersion =
      rule.versions?.[0];

    const snapshot =
      publishedVersion?.snapshot;

    /**
     * Backward compatibility for rules created before
     * version snapshots were populated.
     *
     * Once every production rule has a valid published
     * snapshot, this fallback can be removed.
     */
    if (
      !snapshot ||
      typeof snapshot !== "object" ||
      Array.isArray(snapshot)
    ) {
      return {
        ...rule,
        conditionGroups:
          rule.qrruleConditionGroups ?? [],
      } as LoadedRule;
    }

    const data =
      snapshot as Record<string, unknown>;

    const snapshotConditions =
      Array.isArray(data.conditions)
        ? data.conditions
        : [];

    const snapshotGroups =
      Array.isArray(data.groups)
        ? data.groups
        : [];

    const conditions =
      snapshotConditions
        .filter(
          (condition) =>
            typeof condition === "object" &&
            condition !== null &&
            !Array.isArray(condition)
        )
        .map((condition: any, index: number) => ({
          id:
            typeof condition.id === "string"
              ? condition.id
              : `snapshot-condition-${rule.id}-${index}`,
          groupId:
            typeof condition.groupId === "string"
              ? condition.groupId
              : null,
          type:
            condition.type as QRRuleConditionType,
          operator:
            condition.operator,
          value:
            condition.value,
          sortOrder:
            typeof condition.sortOrder === "number"
              ? condition.sortOrder
              : 0,
        }));

    const conditionGroups =
      snapshotGroups
        .filter(
          (group) =>
            typeof group === "object" &&
            group !== null &&
            !Array.isArray(group)
        )
        .map((group: any, groupIndex: number) => ({
          id:
            typeof group.id === "string"
              ? group.id
              : `snapshot-group-${rule.id}-${groupIndex}`,
          ruleId:
            rule.id,
          parentGroupId:
            typeof group.parentGroupId === "string"
              ? group.parentGroupId
              : null,
          logic:
            group.logic === QRRuleLogic.OR
              ? QRRuleLogic.OR
              : QRRuleLogic.AND,
          sortOrder:
            typeof group.sortOrder === "number"
              ? group.sortOrder
              : 0,
          conditions:
            Array.isArray(group.conditions)
              ? group.conditions
                  .filter(
                    (condition: unknown) =>
                      typeof condition === "object" &&
                      condition !== null &&
                      !Array.isArray(condition)
                  )
                  .map((condition: any, conditionIndex: number) => ({
                    id:
                      typeof condition.id === "string"
                        ? condition.id
                        : `snapshot-group-condition-${rule.id}-${group.id}-${conditionIndex}`,
                    groupId:
                      typeof group.id === "string"
                        ? group.id
                        : null,
                    type:
                      condition.type as QRRuleConditionType,
                    operator:
                      condition.operator,
                    value:
                      condition.value,
                    sortOrder:
                      typeof condition.sortOrder === "number"
                        ? condition.sortOrder
                        : 0,
                  }))
              : [],
        }));

    return {
      ...rule,

      /**
       * Published configuration.
       */
      priority:
        typeof data.priority === "number"
          ? data.priority
          : rule.priority,

      logic:
        data.logic === QRRuleLogic.OR
          ? QRRuleLogic.OR
          : data.logic === QRRuleLogic.AND
            ? QRRuleLogic.AND
            : rule.logic,

      actionType:
        typeof data.actionType === "string"
          ? data.actionType
          : rule.actionType,

      actionValue:
        typeof data.actionValue === "string"
          ? data.actionValue
          : rule.actionValue,

      fallbackActionType:
        data.fallbackActionType === null ||
        typeof data.fallbackActionType === "string"
          ? data.fallbackActionType
          : rule.fallbackActionType,

      fallbackActionValue:
        data.fallbackActionValue === null ||
        typeof data.fallbackActionValue === "string"
          ? data.fallbackActionValue
          : rule.fallbackActionValue,

      experimentId:
        data.experimentId === null ||
        typeof data.experimentId === "string"
          ? data.experimentId
          : rule.experimentId,

      conditions,

      conditionGroups,

      publishedVersion:
        publishedVersion.version,
    } as LoadedRule;
  }

  /**
   * ==========================================================
   * OVERRIDE RESOLUTION
   * ==========================================================
   *
   * Overrides currently act as unconditional routing rules
   * inside their activation window.
   *
   * Example:
   *
   * EMERGENCY
   * BUSINESS
   * SYSTEM
   * CAMPAIGN
   */

  private resolveOverride(
    overrides: any[],
    context: QRRoutingContext
  ): QROverrideDecision {
    for (const override of overrides) {
      /**
       * Overrides currently do not have their own
       * condition tree.
       *
       * Their activation window determines validity.
       */

      if (
        !this.isOverrideValid(
          override,
          context.timestamp
        )
      ) {
        continue;
      }

      return {
        matched: true,

        overrideId:
          override.id,

        type:
          override.type as QRRuleOverrideType,

        action:
          this.normalizeAction(
            override.actionType,
            override.actionValue
          ),

        reason:
          override.reason ??
          "Active override matched.",
      };
    }

    return {
      matched: false,
    };
  }

  /**
   * ==========================================================
   * OVERRIDE VALIDATION
   * ==========================================================
   */

  private isOverrideValid(
    override: any,
    now: Date
  ): boolean {
    /**
     * Not started yet.
     */
    if (
      override.startsAt &&
      now < override.startsAt
    ) {
      return false;
    }

    /**
     * Already expired.
     */
    if (
      override.endsAt &&
      now > override.endsAt
    ) {
      return false;
    }

    return true;
  }

  /**
   * ==========================================================
   * CONDITION GROUP MAPPING
   * ==========================================================
   *
   * Converts:
   *
   * [
   *   groupA,
   *   groupB,
   *   groupC
   * ]
   *
   * into:
   *
   * Map<ruleId, groups[]>
   */

  private groupGroupsByRule(
    groups: any[]
  ): Map<string, any[]> {
    const map =
      new Map<
        string,
        any[]
      >();

    for (const group of groups) {
      const existing =
        map.get(group.ruleId) ??
        [];

      existing.push(
        group
      );

      map.set(
        group.ruleId,
        existing
      );
    }

    return map;
  }

  /**
   * ==========================================================
   * CONDITION TREE BUILDER
   * ==========================================================
   *
   * Converts database condition/group records into
   * evaluator-friendly recursive structures.
   *
   * Root:
   *
   * Rule
   * ├── direct conditions
   * └── condition groups
   *
   * Nested:
   *
   * Group
   * ├── conditions
   * └── child groups
   */

  private buildRootConditionGroup(
    rule: LoadedRule,
    groups: any[]
  ): QRConditionGroupNode {
    /**
     * --------------------------------------------------------
     * Group lookup
     * --------------------------------------------------------
     */

    const groupById =
      new Map<string, any>();

    for (const group of groups) {
      groupById.set(
        group.id,
        group
      );
    }

    /**
     * --------------------------------------------------------
     * Child-group lookup
     * --------------------------------------------------------
     *
     * parentGroupId → children
     */

    const childGroups =
      new Map<
        string,
        any[]
      >();

    for (const group of groups) {
      if (!group.parentGroupId) {
        continue;
      }

      const children =
        childGroups.get(
          group.parentGroupId
        ) ?? [];

      children.push(
        group
      );

      childGroups.set(
        group.parentGroupId,
        children
      );
    }

    /**
     * --------------------------------------------------------
     * Recursive group builder
     * --------------------------------------------------------
     */

    const buildGroup = (
      group: any
    ): QRConditionGroupNode => {
      const children =
        childGroups.get(
          group.id
        ) ?? [];

      /**
       * Convert database conditions into evaluator nodes.
       */
      const conditions: QRConditionNode[] =
        (group.conditions ?? [])
          .map(
            (
              condition: any
            ): QRConditionNode => ({
              id:
                condition.id,

              type:
                condition.type,

              operator:
                condition.operator,

              /**
               * Prisma Json is `unknown`.
               *
               * QRConditionValue is the controlled
               * value shape used by the rule engine.
               */
              value:
                condition.value as QRConditionValue,

              sortOrder:
                condition.sortOrder ??
                0,
            })
          )
          .sort(
            (
              a: QRConditionNode,
              b: QRConditionNode
            ) =>
              a.sortOrder -
              b.sortOrder
          );

      /**
       * Sort child groups by their configured order.
       */
      const sortedChildren =
        [...children]
          .sort(
            (
              a: any,
              b: any
            ) =>
              (a.sortOrder ?? 0) -
              (b.sortOrder ?? 0)
          )
          .map(
            buildGroup
          );

      return {
        id:
          group.id,

        logic:
          group.logic as QRRuleLogic,

        sortOrder:
          group.sortOrder ??
          0,

        conditions,

        children:
          sortedChildren,
      };
    };

    /**
     * --------------------------------------------------------
     * Root groups
     * --------------------------------------------------------
     *
     * Only groups without parentGroupId belong directly
     * beneath the rule root.
     */

    const rootGroups =
      groups
        .filter(
          (group) =>
            !group.parentGroupId
        )
        .sort(
          (
            a: any,
            b: any
          ) =>
            (a.sortOrder ?? 0) -
            (b.sortOrder ?? 0)
        )
        .map(
          buildGroup
        );

    /**
     * --------------------------------------------------------
     * Direct rule conditions
     * --------------------------------------------------------
     *
     * groupId === null means the condition is directly
     * attached to the QR rule.
     */

    const directConditions: QRConditionNode[] =
      rule.conditions
        .filter(
          (condition) =>
            !condition.groupId
        )
        .sort(
          (
            a,
            b
          ) =>
            (a.sortOrder ?? 0) -
            (b.sortOrder ?? 0)
        )
        .map(
          (
            condition
          ): QRConditionNode => ({
            id:
              condition.id,

            type:
              condition.type,

            operator:
              condition.operator,

            value:
              condition.value as QRConditionValue,

            sortOrder:
              condition.sortOrder ??
              0,
          })
        );

    /**
     * --------------------------------------------------------
     * ROOT EXPRESSION
     * --------------------------------------------------------
     *
     * If there are no groups:
     *
     * Rule.logic controls direct conditions.
     *
     * Example:
     *
     * AND
     * ├── DEVICE = MOBILE
     * └── COUNTRY = IN
     */

    if (!rootGroups.length) {
      return {
        id:
          `rule-root-${rule.id}`,

        logic:
          rule.logic,

        sortOrder:
          0,

        conditions:
          directConditions,

        children:
          [],
      };
    }

    /**
     * --------------------------------------------------------
     * ROOT WITH GROUPS
     * --------------------------------------------------------
     *
     * Direct conditions and root groups are evaluated
     * together using the rule's top-level logic.
     *
     * Example:
     *
     * AND
     * ├── DEVICE = MOBILE
     * └── OR
     *     ├── COUNTRY = IN
     *     └── COUNTRY = AE
     */

    return {
      id:
        `rule-root-${rule.id}`,

      logic:
        rule.logic,

      sortOrder:
        0,

      conditions:
        directConditions,

      children:
        rootGroups,
    };
  }

  /**
   * ==========================================================
   * EXPERIMENT RESOLUTION
   * ==========================================================
   *
   * Experiments provide deterministic visitor allocation.
   *
   * Same:
   *
   * experimentId + visitorKey
   *
   * always produces the same bucket.
   */

  private async resolveExperiment(
    rule: LoadedRule,
    context: QRRoutingContext,
    options: QRRoutingEngineOptions
  ) {
    /**
     * Rule has no experiment.
     */
    if (!rule.experiment) {
      return undefined;
    }

    /**
     * Without a stable visitor key we cannot safely keep
     * a visitor in the same experiment variant.
     */
    if (!context.visitorKey) {
      return undefined;
    }

    /**
     * Verify that the experiment is currently active.
     */
    const experiment =
      await this.repository.findActiveExperiment(
        rule.experiment.id,
        context.timestamp
      );

    if (!experiment) {
      return undefined;
    }

    /**
     * No variants means there is nothing to test.
     */
    if (!experiment.variants.length) {
      return undefined;
    }

    /**
     * ------------------------------------------------------
     * EXISTING ASSIGNMENT
     * ------------------------------------------------------
     */

    const existing =
      await this.repository.findExperimentAssignment(
        experiment.id,
        context.visitorKey
      );

    if (existing) {
      return {
        experimentId:
          experiment.id,

        variantId:
          existing.variantId,

        action:
          this.normalizeAction(
            existing.variant.actionType,
            existing.variant.actionValue
          ),
      };
    }

    /**
     * ------------------------------------------------------
     * DETERMINISTIC ALLOCATION
     * ------------------------------------------------------
     *
     * Hash:
     *
     * experimentId:visitorKey
     *
     * Bucket:
     *
     * 0 - 9999
     */

    const bucket =
      this.deterministicBucket(
        experiment.id,
        context.visitorKey
      );

    const variant =
      this.selectVariant(
        experiment.variants,
        bucket
      );

    if (!variant) {
      return undefined;
    }

    /**
     * ------------------------------------------------------
     * PERSIST ASSIGNMENT
     * ------------------------------------------------------
     *
     * Simulation must not create assignments.
     */

    if (!options.simulation) {
      try {
        await this.repository.createExperimentAssignment(
          {
            experimentId:
              experiment.id,

            variantId:
              variant.id,

            visitorKey:
              context.visitorKey,
          }
        );

        await this.repository.incrementExperimentParticipants(
          experiment.id,
          variant.id
        );
      } catch {
        /**
         * Race condition protection.
         *
         * Another concurrent request may have created
         * the same visitor assignment.
         *
         * Routing can safely continue because the
         * deterministic bucket guarantees the same
         * variant selection.
         */
      }
    }

    return {
      experimentId:
        experiment.id,

      variantId:
        variant.id,

      action:
        this.normalizeAction(
          variant.actionType,
          variant.actionValue
        ),
    };
  }

  /**
   * ==========================================================
   * DETERMINISTIC BUCKET
   * ==========================================================
   *
   * FNV-style integer hash.
   *
   * Produces:
   *
   * 0 - 9999
   */

  private deterministicBucket(
    experimentId: string,
    visitorKey: string
  ): number {
    let hash =
      2166136261;

    const input =
      `${experimentId}:${visitorKey}`;

    for (
      let index = 0;
      index < input.length;
      index += 1
    ) {
      hash ^=
        input.charCodeAt(
          index
        );

      hash +=
        (hash << 1) +
        (hash << 4) +
        (hash << 7) +
        (hash << 8) +
        (hash << 24);
    }

    /**
     * Convert signed integer into unsigned integer.
     */
    hash >>>=
      0;

    return hash % 10000;
  }

  /**
   * ==========================================================
   * VARIANT SELECTION
   * ==========================================================
   *
   * Supports allocation such as:
   *
   * 50 + 50
   * 70 + 30
   * 80 + 20
   *
   * Allocation values are normalized into a 0-10000 bucket.
   */

  private selectVariant(
    variants: any[],
    bucket: number
  ) {
    const totalAllocation =
      variants.reduce(
        (
          total,
          variant
        ) =>
          total +
          Math.max(
            0,
            Number(
              variant.allocation
            ) || 0
          ),
        0
      );

    /**
     * Invalid experiment configuration.
     */
    if (
      totalAllocation <= 0
    ) {
      return undefined;
    }

    let cursor =
      0;

    for (
      const variant of variants
    ) {
      const allocation =
        Math.max(
          0,
          Number(
            variant.allocation
          ) || 0
        );

      const start =
        (cursor /
          totalAllocation) *
        10000;

      const end =
        ((cursor +
          allocation) /
          totalAllocation) *
        10000;

      if (
        bucket >= start &&
        bucket < end
      ) {
        return variant;
      }

      cursor +=
        allocation;
    }

    /**
     * Floating-point safety.
     *
     * If a bucket falls outside because of a tiny
     * floating-point rounding issue, return the last variant.
     */
    return variants[
      variants.length - 1
    ];
  }

  /**
   * ==========================================================
   * FALLBACK
   * ==========================================================
   *
   * If:
   *
   * - no rules exist
   * OR
   * - rules exist but none matched
   *
   * the QR's default action is returned.
   */

  private async resolveFallback(
    input: {
      qrCode: any;

      context: QRRoutingContext;

      qrCodeId: string;

      trace: QREvaluationTrace;

      now: Date;

      includeTrace: boolean;

      options: QRRoutingEngineOptions;
    }
  ): Promise<QRRoutingResult> {
    const {
      qrCode,

      context,

      qrCodeId,

      trace,

      now,

      includeTrace,

      options,
    } = input;

    trace.selectedReason =
      "No active rule matched. Default QR experience selected.";

    /**
     * Determine default QR action.
     */
    const action =
      this.resolveDefaultQRCodeAction(
        qrCode
      );

    const result =
      this.createResult({
        status:
          QRRuleMatchStatus.FALLBACK,

        qrCodeId,

        action,

        trace,

        now,
      });

    /**
     * Persist fallback analytics unless this is
     * simulation mode.
     */
    if (
      !options.simulation &&
      !options.skipAnalytics
    ) {
      await this.recordMatch(
        result,
        context
      );
    }

    return this.stripTraceIfNeeded(
      result,
      includeTrace
    );
  }

  /**
   * ==========================================================
   * DEFAULT QR ACTION
   * ==========================================================
   *
   * Redirect QR:
   *
   * destinationUrl exists
   *
   * otherwise:
   *
   * Experience QR:
   *
   * experienceType
   */

  private resolveDefaultQRCodeAction(
    qrCode: any
  ): QRRuleAction {
    /**
     * --------------------------------------------------------
     * REDIRECT
     * --------------------------------------------------------
     */

    if (
      qrCode.destinationUrl
    ) {
      return {
        type:
          "REDIRECT" as any,

        value:
          qrCode.destinationUrl,
      };
    }

    /**
     * --------------------------------------------------------
     * EXPERIENCE
     * --------------------------------------------------------
     */

    return {
      type:
        qrCode.experienceType ??
        "EXPERIENCE",

      value:
        qrCode.id,
    };
  }

  /**
   * ==========================================================
   * PERSIST SUCCESSFUL MATCH
   * ==========================================================
   */

  private async persistSuccessfulMatch(
    result: QRRoutingResult,
    context: QRRoutingContext
  ) {
    /**
     * Increment rule-level counters.
     */
    if (result.ruleId) {
      await this.repository.incrementRuleMatch(
        result.ruleId,
        result.matchedAt
      );
    }

    /**
     * Store detailed routing event.
     */
    await this.recordMatch(
      result,
      context
    );
  }

  /**
   * ==========================================================
   * RECORD MATCH
   * ==========================================================
   *
   * Persists rich routing context for analytics.
   *
   * Captures:
   *
   * - device
   * - operating system
   * - browser
   * - country
   * - state
   * - city
   * - language
   * - referrer
   * - UTM
   * - QR source
   * - visitor
   */

  private async recordMatch(
    result: QRRoutingResult,
    context: QRRoutingContext
  ) {
    await this.repository.createRuleMatch(
      {
        qrCodeId:
          result.qrCodeId,

        ruleId:
          result.ruleId,

        ruleVersion:
          result.ruleVersion,

        status:
          result.status,

        actionType:
          result.action?.type as any,

        actionValue:
          result.action?.value,

        experimentId:
          result.experimentId,

        variantId:
          result.variantId,

        device:
          context.device,

        operatingSystem:
          context.operatingSystem,

        browser:
          context.browser,

        country:
          context.geo.country,

        state:
          context.geo.state,

        city:
          context.geo.city,

        language:
          context.language,

        referrer:
          context.referrer,

        utmSource:
          context.utm.source,

        utmMedium:
          context.utm.medium,

        utmCampaign:
          context.utm.campaign,

        utmTerm:
          context.utm.term,

        utmContent:
          context.utm.content,

        sourceType:
          context.sourceType,

        visitorKey:
          context.visitorKey,
      }
    );
  }

  /**
   * ==========================================================
   * RESULT BUILDER
   * ==========================================================
   */

  private createResult(
    input: {
      status: QRRuleMatchStatus;

      qrCodeId: string;

      ruleId?: string;

      ruleVersion?: number;

      action?: QRRuleAction;

      fallback?: any;

      experimentId?: string;

      variantId?: string;

      trace: QREvaluationTrace;

      reason?: string;

      now: Date;
    }
  ): QRRoutingResult {
    /**
     * Selected rule is also reflected in the trace.
     */
    if (input.ruleId) {
      input.trace.selectedRuleId =
        input.ruleId;
    }

    /**
     * Optional result reason.
     */
    if (input.reason) {
      input.trace.selectedReason =
        input.reason;
    }

    return {
      status:
        input.status,

      qrCodeId:
        input.qrCodeId,

      ruleId:
        input.ruleId,

      ruleVersion:
        input.ruleVersion,

      action:
        input.action,

      fallback:
        input.fallback,

      experimentId:
        input.experimentId,

      variantId:
        input.variantId,

      evaluation:
        input.trace,

      matchedAt:
        input.now,
    };
  }

  /**
   * ==========================================================
   * TRACE CONTROL
   * ==========================================================
   *
   * Production redirect requests do not necessarily need
   * the full evaluation trace.
   *
   * Simulator/debug requests can request it.
   */

  private stripTraceIfNeeded(
    result: QRRoutingResult,
    includeTrace: boolean
  ): QRRoutingResult {
    if (includeTrace) {
      return result;
    }

    return {
      ...result,

      evaluation: {
        rules: [],
      },
    };
  }

  /**
   * ==========================================================
   * ACTION NORMALIZATION
   * ==========================================================
   *
   * Ensures action value is always a string.
   */

  private normalizeAction(
    type: any,
    value: unknown
  ): QRRuleAction {
    return {
      type,

      value:
        typeof value === "string"
          ? value
          : String(
              value ?? ""
            ),
    };
  }
}

/**
 * ============================================================
 * SHARED ENGINE INSTANCE
 * ============================================================
 *
 * The engine is stateless.
 *
 * Repository handles persistence.
 * Context handles request information.
 * Evaluator handles pure condition evaluation.
 */

export const qrRoutingEngine =
  new QRRoutingEngine();