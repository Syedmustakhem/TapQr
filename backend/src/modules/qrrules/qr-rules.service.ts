import {
  QRRuleActionType,
  QRRuleConditionType,
  QRRuleLogic,
  QRRuleOperator,
  QRRuleStatus,
  QRRuleMatchStatus,
} from "@prisma/client";
import { Request } from "express";
import {
  buildQRRoutingContext,
} from "./qr-rules.context";

import {
  QRRoutingEngine,
} from "./qr-rules.engine";

import {
  SimulateQRRuleInput,
} from "./qr-rules.validation";
import { AppError } from "../../cores/errors/AppError";
import { QRRulesRepository } from "./qr-rules.repository";

import {
  CreateQRRuleInput,
  UpdateQRRuleInput,
  RollbackQRRuleInput,
} from "./qr-rules.validation";

import { randomUUID } from "crypto";

export class QRRulesService {
  private readonly repository =
    new QRRulesRepository();
private readonly routingEngine =
  new QRRoutingEngine();
  async simulateRule(
  ownerId: string,
  input: SimulateQRRuleInput
) {
  const qr =
    await this.repository.findQRCodeForOwner(
      input.qrCodeId,
      ownerId
    );

  if (!qr) {
    throw new AppError(
      "QR Code not found or access denied.",
      404,
      "QR_CODE_NOT_FOUND"
    );
  }

  if (qr.status !== "ACTIVE") {
    throw new AppError(
      "QR Code is not active.",
      409,
      "QR_CODE_INACTIVE"
    );
  }

  const headers: Record<string, string> =
    input.headers ?? {};

  const query: Record<string, string> =
    input.query ?? {};

  const fakeRequest = {
    headers,
    query,
    ip:
      headers["x-forwarded-for"] ??
      headers["x-real-ip"] ??
      "127.0.0.1",
  } as unknown as Request;

  const context =
    buildQRRoutingContext({
      req: fakeRequest,

      qrCodeId: qr.id,

      businessId: qr.businessId,

      scanCount: qr.scanCount ?? 0,

      sourceType:
        qr.sourceType,

      placementLabel:
        qr.placementLabel,

      locationLabel:
        qr.locationLabel,

      campaignName:
        qr.campaignName,

      visitorKey:
        input.visitorKey,

      customerId:
        input.customerId,

      custom:
        input.custom,
    });

  const result =
    await this.routingEngine.resolve({
      qrCodeId: qr.id,

      context,

      options: {
        includeTrace: true,
      },
    });

  return {
    simulatedAt: new Date(),

    qrCodeId: qr.id,

    context,

    result,
  };
}
  /**
   * ============================================================
   * CREATE
   * ============================================================
   */

  async createRule(
    ownerId: string,
    input: CreateQRRuleInput
  ) {
    this.validateDateRange(
      input.startsAt,
      input.endsAt
    );

    this.validateAction(
      input.actionType,
      input.actionValue
    );

    this.validateFallback(
      input.fallbackActionType,
      input.fallbackActionValue
    );

    const qr =
      await this.repository.findQRCodeForOwner(
        input.qrCodeId,
        ownerId
      );

    if (!qr) {
      throw new AppError(
        "QR Code not found or access denied.",
        404,
        "QR_CODE_NOT_FOUND"
      );
    }

    if (qr.status !== "ACTIVE") {
      throw new AppError(
        "QR Code is not active.",
        409,
        "QR_CODE_INACTIVE"
      );
    }

    const conditions =
      this.normalizeConditions(
        input.conditions
      );

    const groups =
      this.normalizeGroups(
        input.groups
      );

    const snapshot =
      this.buildSnapshot({
        ...input,
        conditions,
        groups,
      });

    const result =
      await this.repository.createRule({
        qrCodeId: input.qrCodeId,
        name: input.name,
        description:
          input.description ?? null,
        priority: input.priority,
        startsAt:
          input.startsAt ?? null,
        endsAt:
          input.endsAt ?? null,
        logic: input.logic,
        actionType:
          input.actionType,
        actionValue:
          input.actionValue,
        fallbackActionType:
          input.fallbackActionType ??
          null,
        fallbackActionValue:
          input.fallbackActionValue ??
          null,
        experimentId:
          input.experimentId ??
          null,
        conditions,
        groups,
        versionSnapshot:
          snapshot,
        actorId: ownerId,
      });

    return this.repository.findRuleForOwner(
      result.ruleId,
      ownerId
    );
  }

  /**
   * ============================================================
   * LIST
   * ============================================================
   */

  async listRules(
    ownerId: string,
    qrCodeId: string
  ) {
    const qr =
      await this.repository.findQRCodeForOwner(
        qrCodeId,
        ownerId
      );

    if (!qr) {
      throw new AppError(
        "QR Code not found or access denied.",
        404,
        "QR_CODE_NOT_FOUND"
      );
    }

    return this.repository.listRulesForQRCode(
      qrCodeId,
      ownerId
    );
  }

  /**
   * ============================================================
   * GET ONE
   * ============================================================
   */

  async getRule(
    ownerId: string,
    ruleId: string
  ) {
    const rule =
      await this.repository.findRuleForOwner(
        ruleId,
        ownerId
      );

    if (!rule) {
      throw new AppError(
        "QR rule not found or access denied.",
        404,
        "QR_RULE_NOT_FOUND"
      );
    }

    return rule;
  }
async listRuleMatches(
  ownerId: string,
  input: {
    qrCodeId: string;
    ruleId?: string;
    status?: QRRuleMatchStatus;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }
) {
  const qr =
    await this.repository.findQRCodeForOwner(
      input.qrCodeId,
      ownerId
    );

  if (!qr) {
    throw new AppError(
      "QR Code not found or access denied.",
      404,
      "QR_CODE_NOT_FOUND"
    );
  }

  if (
    input.from &&
    input.to &&
    input.from > input.to
  ) {
    throw new AppError(
      "From date cannot be after to date.",
      400,
      "INVALID_DATE_RANGE"
    );
  }

  return this.repository.listRuleMatches(
    input.qrCodeId,
    {
      ruleId: input.ruleId,
      status: input.status,
      from: input.from,
      to: input.to,
      limit: input.limit,
      offset: input.offset,
    }
  );
}
  /**
   * ============================================================
   * UPDATE
   * ============================================================
   */

  async updateRule(
    ownerId: string,
    ruleId: string,
    input: UpdateQRRuleInput
  ) {
    const existing =
      await this.repository.findRuleForOwner(
        ruleId,
        ownerId
      );

    if (!existing) {
      throw new AppError(
        "QR rule not found or access denied.",
        404,
        "QR_RULE_NOT_FOUND"
      );
    }

    if (
      existing.status ===
      QRRuleStatus.ARCHIVED
    ) {
      throw new AppError(
        "Archived rules cannot be edited.",
        409,
        "QR_RULE_ARCHIVED"
      );
    }

    const startsAt =
      input.startsAt !== undefined
        ? input.startsAt
        : existing.startsAt;

    const endsAt =
      input.endsAt !== undefined
        ? input.endsAt
        : existing.endsAt;

    this.validateDateRange(
      startsAt,
      endsAt
    );

    if (
      input.actionType !== undefined ||
      input.actionValue !== undefined
    ) {
      this.validateAction(
        input.actionType ??
          existing.actionType,
        input.actionValue ??
          existing.actionValue
      );
    }

    const fallbackType =
      input.fallbackActionType !==
      undefined
        ? input.fallbackActionType
        : existing.fallbackActionType;

    const fallbackValue =
      input.fallbackActionValue !==
      undefined
        ? input.fallbackActionValue
        : existing.fallbackActionValue;

    this.validateFallback(
      fallbackType,
      fallbackValue
    );

    const conditions =
      input.conditions !== undefined
        ? this.normalizeConditions(
            input.conditions
          )
        : undefined;

    const groups =
      input.groups !== undefined
        ? this.normalizeGroups(
            input.groups
          )
        : undefined;

    const snapshot =
      this.buildSnapshot({
        qrCodeId: existing.qrCodeId,
        name:
          input.name ??
          existing.name,
        description:
          input.description !== undefined
            ? input.description
            : existing.description,
        priority:
          input.priority ??
          existing.priority,
        startsAt,
        endsAt,
        logic:
          input.logic ??
          existing.logic,
        actionType:
          input.actionType ??
          existing.actionType,
        actionValue:
          input.actionValue ??
          existing.actionValue,
        fallbackActionType:
          fallbackType,
        fallbackActionValue:
          fallbackValue,
        experimentId:
          input.experimentId !== undefined
            ? input.experimentId
            : existing.experimentId,
        conditions:
          conditions ??
          existing.conditions.map(
            (condition) => ({
              id: condition.id,
              type: condition.type,
              operator:
                condition.operator,
              value:
                condition.value,
              sortOrder:
                condition.sortOrder,
            })
          ),
        groups:
          groups ??
          existing.qrruleConditionGroups.map((group) => ({
            id: group.id,
            parentGroupId: group.parentGroupId,
            logic: group.logic,
            sortOrder: group.sortOrder,
            conditions: group.conditions.map((condition) => ({
              id: condition.id,
              type: condition.type,
              operator: condition.operator,
              value: condition.value,
              sortOrder: condition.sortOrder,
            })),
          })),
      });

    await this.repository.updateRule(
      ruleId,
      {
        name: input.name,
        description:
          input.description,
        priority:
          input.priority,
        startsAt:
          input.startsAt,
        endsAt:
          input.endsAt,
        logic:
          input.logic,
        actionType:
          input.actionType,
        actionValue:
          input.actionValue,
        fallbackActionType:
          input.fallbackActionType,
        fallbackActionValue:
          input.fallbackActionValue,
        experimentId:
          input.experimentId,
        conditions,
        groups,
        versionSnapshot:
          snapshot,
        actorId: ownerId,
      }
    );

    return this.repository.findRuleForOwner(
      ruleId,
      ownerId
    );
  }

  /**
   * ============================================================
   * DELETE / ARCHIVE
   * ============================================================
   */

  async deleteRule(
    ownerId: string,
    ruleId: string
  ) {
    const existing =
      await this.repository.findRuleForOwner(
        ruleId,
        ownerId
      );

    if (!existing) {
      throw new AppError(
        "QR rule not found or access denied.",
        404,
        "QR_RULE_NOT_FOUND"
      );
    }

    if (
      existing.status ===
      QRRuleStatus.ARCHIVED
    ) {
      return existing;
    }

    return this.repository.archiveRule(
      ruleId,
      ownerId
    );
  }

  /**
   * ============================================================
   * ACTIVATE
   * ============================================================
   */

  async activateRule(
    ownerId: string,
    ruleId: string
  ) {
    const rule =
      await this.requireRule(
        ownerId,
        ruleId
      );

    if (
      rule.status ===
      QRRuleStatus.ARCHIVED
    ) {
      throw new AppError(
        "Archived rules cannot be activated.",
        409,
        "QR_RULE_ARCHIVED"
      );
    }

    if (!rule.publishedVersion) {
      throw new AppError(
        "Publish the rule before activating it.",
        409,
        "QR_RULE_NOT_PUBLISHED"
      );
    }

    return this.repository.setRuleStatus(
      ruleId,
      QRRuleStatus.ACTIVE,
      ownerId
    );
  }

  /**
   * ============================================================
   * PAUSE
   * ============================================================
   */

  async pauseRule(
    ownerId: string,
    ruleId: string
  ) {
    const rule = await this.requireRule(
      ownerId,
      ruleId
    );

    if (rule.status === QRRuleStatus.ARCHIVED) {
      throw new AppError(
        "Archived rules cannot be paused.",
        409,
        "QR_RULE_ARCHIVED"
      );
    }

    return this.repository.setRuleStatus(
      ruleId,
      QRRuleStatus.PAUSED,
      ownerId
    );
  }

  /**
   * ============================================================
   * PUBLISH
   * ============================================================
   */

  async publishRule(
    ownerId: string,
    ruleId: string
  ) {
    const rule =
      await this.requireRule(
        ownerId,
        ruleId
      );

    if (
      rule.status ===
      QRRuleStatus.ARCHIVED
    ) {
      throw new AppError(
        "Archived rules cannot be published.",
        409,
        "QR_RULE_ARCHIVED"
      );
    }

    return this.repository.publishRule(
      ruleId,
      ownerId
    );
  }

  /**
   * ============================================================
   * ROLLBACK
   * ============================================================
   */

  async rollbackRule(
    ownerId: string,
    ruleId: string,
    input: RollbackQRRuleInput
  ) {
    const rule =
      await this.requireRule(
        ownerId,
        ruleId
      );

    if (
      rule.status ===
      QRRuleStatus.ARCHIVED
    ) {
      throw new AppError(
        "Archived rules cannot be rolled back.",
        409,
        "QR_RULE_ARCHIVED"
      );
    }

    const version =
      rule.versions.find(
        (item) =>
          item.version ===
          input.version
      );

    if (!version) {
      throw new AppError(
        "Requested rule version was not found.",
        404,
        "QR_RULE_VERSION_NOT_FOUND"
      );
    }

    return this.repository.rollbackRule(
      ruleId,
      input.version,
      ownerId
    );
  }

  /**
   * ============================================================
   * HELPERS
   * ============================================================
   */

  private async requireRule(
    ownerId: string,
    ruleId: string
  ) {
    const rule =
      await this.repository.findRuleForOwner(
        ruleId,
        ownerId
      );

    if (!rule) {
      throw new AppError(
        "QR rule not found or access denied.",
        404,
        "QR_RULE_NOT_FOUND"
      );
    }

    return rule;
  }

  private validateDateRange(
    startsAt?: Date | null,
    endsAt?: Date | null
  ) {
    if (
      startsAt &&
      endsAt &&
      startsAt > endsAt
    ) {
      throw new AppError(
        "Rule start time cannot be after the end time.",
        400,
        "QR_RULE_INVALID_DATE_RANGE"
      );
    }
  }

  private validateAction(
    type: QRRuleActionType,
    value: string
  ) {
    if (!value?.trim()) {
      throw new AppError(
        "Action value is required.",
        400,
        "QR_RULE_ACTION_VALUE_REQUIRED"
      );
    }

    if (
      type === QRRuleActionType.REDIRECT
    ) {
      try {
        const url = new URL(value);

        if (
          url.protocol !== "http:" &&
          url.protocol !== "https:"
        ) {
          throw new Error();
        }
      } catch {
        throw new AppError(
          "Redirect action must contain a valid HTTP or HTTPS URL.",
          400,
          "QR_RULE_INVALID_REDIRECT"
        );
      }
    }
  }

  private validateFallback(
    type?: QRRuleActionType | null,
    value?: string | null
  ) {
    if (type && !value?.trim()) {
      throw new AppError(
        "Fallback action value is required when a fallback action is configured.",
        400,
        "QR_RULE_FALLBACK_VALUE_REQUIRED"
      );
    }
  }

  private normalizeConditions(
    conditions: CreateQRRuleInput["conditions"]
  ) {
    return conditions.map(
      (condition) => ({
        id:
          condition.id ??
          randomUUID(),
        type: condition.type,
        operator:
          condition.operator,
        value:
          condition.value as any,
        sortOrder:
          condition.sortOrder,
      })
    );
  }

  private normalizeGroups(
    groups: CreateQRRuleInput["groups"]
  ) {
    const result: Array<{
      id: string;
      parentGroupId:
        | string
        | null;
      logic: QRRuleLogic;
      sortOrder: number;
      conditions: Array<{
        id: string;
        type: QRRuleConditionType;
        operator: QRRuleOperator;
        value: any;
        sortOrder: number;
      }>;
    }> = [];

    const flatten = (
      group: any,
      parentGroupId:
        | string
        | null = null
    ) => {
      const id =
        group.id ??
        randomUUID();

      result.push({
        id,
        parentGroupId,
        logic:
          group.logic ??
          QRRuleLogic.AND,
        sortOrder:
          group.sortOrder ?? 0,
        conditions:
          (group.conditions ??
            []).map(
            (condition: any) => ({
              id:
                condition.id ??
                randomUUID(),
              type:
                condition.type,
              operator:
                condition.operator,
              value:
                condition.value,
              sortOrder:
                condition.sortOrder ??
                0,
            })
          ),
      });

      for (
        const child of group.children ??
        []
      ) {
        flatten(child, id);
      }
    };

    for (const group of groups) {
      flatten(group);
    }

    return result;
  }

  private buildSnapshot(
    input: any
  ) {
    return {
      qrCodeId: input.qrCodeId,

      name: input.name,

      description:
        input.description ?? null,

      priority:
        input.priority,

      startsAt:
        input.startsAt
          ? input.startsAt.toISOString()
          : null,

      endsAt:
        input.endsAt
          ? input.endsAt.toISOString()
          : null,

      logic:
        input.logic,

      actionType:
        input.actionType,

      actionValue:
        input.actionValue,

      fallbackActionType:
        input.fallbackActionType ??
        null,

      fallbackActionValue:
        input.fallbackActionValue ??
        null,

      experimentId:
        input.experimentId ??
        null,

      conditions:
        input.conditions,

      groups:
        input.groups,
    };
  }
}