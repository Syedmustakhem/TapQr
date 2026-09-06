import {
  Prisma,
  QRRuleActionType,
  QRRuleConditionType,
  QRRuleLogic,
  QRRuleOperator,
  QRRuleStatus,
  QRRuleVersionStatus,
  QRRuleOverrideStatus,
  QRExperimentStatus,
  QRRuleMatchStatus,
} from "@prisma/client";;
import { randomUUID } from "crypto";
import { prisma } from "../../config/prisma";

export class QRRulesRepository {
  /**
   * Load the QR required by the routing engine.
   */
  async findQRCodeForRouting(qrCodeId: string) {
    return prisma.qRCode.findFirst({
      where: {
        id: qrCodeId,
        deletedAt: null,
      },
      include: {
        branding: true,
        business: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  /**
   * Load a QR by short code.
   *
   * Useful for the public /r/:shortCode flow.
   */
  async findQRCodeByShortCode(shortCode: string) {
    return prisma.qRCode.findFirst({
      where: {
        shortCode,
        deletedAt: null,
      },
      include: {
        branding: true,
        business: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  /**
   * Load only currently active rules.
   *
   * Rules are sorted by priority so the engine can
   * evaluate higher-priority rules first.
   */
  async findActiveRules(
    qrCodeId: string,
    now: Date
  ) {
    return prisma.qRRule.findMany({
      where: {
        qrCodeId,

        status: QRRuleStatus.ACTIVE,

        OR: [
          {
            startsAt: null,
          },
          {
            startsAt: {
              lte: now,
            },
          },
        ],

        AND: [
          {
            OR: [
              {
                endsAt: null,
              },
              {
                endsAt: {
                  gte: now,
                },
              },
            ],
          },
        ],
      },

      include: {
  conditions: {
    orderBy: {
      sortOrder: "asc",
    },
  },

  qrruleConditionGroups: {
    include: {
      conditions: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    orderBy: {
      sortOrder: "asc",
    },
  },

  versions: {
          where: {
            status:
              QRRuleVersionStatus.PUBLISHED,
          },
          orderBy: {
            version: "desc",
          },
          take: 1,
        },

        experiment: {
          include: {
            variants: true,
          },
        },
      },

      orderBy: [
        {
          priority: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
    });
  }

  /**
   * Load nested condition groups separately.
   *
   * Prisma does not recursively include an unlimited
   * condition tree automatically, so the routing layer
   * assembles the tree.
   */
  async findConditionGroups(
    ruleIds: string[]
  ) {
    if (!ruleIds.length) {
      return [];
    }

    return prisma.qRRuleConditionGroup.findMany({
      where: {
        ruleId: {
          in: ruleIds,
        },
      },

      include: {
        conditions: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
      ],
    });
  }

  /**
   * Emergency/business/system overrides.
   *
   * Overrides are evaluated before normal rules.
   */
  async findActiveOverrides(
    qrCodeId: string,
    now: Date
  ) {
    return prisma.qRRuleOverride.findMany({
      where: {
        qrCodeId,

        status:
          QRRuleOverrideStatus.ACTIVE,

        OR: [
          {
            startsAt: null,
          },
          {
            startsAt: {
              lte: now,
            },
          },
        ],

        AND: [
          {
            OR: [
              {
                endsAt: null,
              },
              {
                endsAt: {
                  gte: now,
                },
              },
            ],
          },
        ],
      },

      orderBy: [
        {
          priority: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
    });
  }

  /**
   * Load a single rule.
   */
  async findRuleById(
    ruleId: string
  ) {
    return prisma.qRRule.findUnique({
      where: {
        id: ruleId,
      },

      include: {
        conditions: {
          orderBy: {
            sortOrder: "asc",
          },
        },

        qrruleConditionGroups: {
          include: {
            conditions: {
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
          orderBy: {
            sortOrder: "asc",
          },
        },

        versions: {
          orderBy: {
            version: "desc",
          },
        },

        experiment: {
          include: {
            variants: true,
          },
        },
      },
    });
  }

  /**
   * Increment runtime match statistics.
   *
   * This is intentionally atomic.
   */
  async incrementRuleMatch(
    ruleId: string,
    now: Date
  ) {
    return prisma.qRRule.update({
      where: {
        id: ruleId,
      },

      data: {
        matchCount: {
          increment: 1,
        },

        lastMatchedAt: now,
      },
    });
  }

  /**
   * Create rule-match analytics.
   */
  async createRuleMatch(
    data: Prisma.QRRuleMatchUncheckedCreateInput
  ) {
    return prisma.qRRuleMatch.create({
      data,
    });
  }

  /**
   * Record a conversion.
   */
  async createConversion(
    data: Prisma.QRConversionUncheckedCreateInput
  ) {
    return prisma.qRConversion.create({
      data,
    });
  }

  /**
   * Create audit log.
   */
  async createAuditLog(
    data: Prisma.QRRuleAuditLogUncheckedCreateInput
  ) {
    return prisma.qRRuleAuditLog.create({
      data,
    });
  }

  /**
   * Find experiment assignment for a visitor.
   */
  async findExperimentAssignment(
    experimentId: string,
    visitorKey: string
  ) {
    return prisma.qRExperimentAssignment.findUnique(
      {
        where: {
          experimentId_visitorKey: {
            experimentId,
            visitorKey,
          },
        },

        include: {
          variant: true,
        },
      }
    );
  }

  /**
   * Create experiment assignment.
   */
  async createExperimentAssignment(
    data: Prisma.QRExperimentAssignmentUncheckedCreateInput
  ) {
    return prisma.qRExperimentAssignment.create({
      data,
      include: {
        variant: true,
      },
    });
  }

  /**
   * Increment experiment participant count.
   */
  async incrementExperimentParticipants(
    experimentId: string,
    variantId: string
  ) {
    return prisma.$transaction([
      prisma.qRExperiment.update({
        where: {
          id: experimentId,
        },

        data: {
          participantCount: {
            increment: 1,
          },
        },
      }),

      prisma.qRExperimentVariant.update({
        where: {
          id: variantId,
        },

        data: {
          participantCount: {
            increment: 1,
          },
        },
      }),
    ]);
  }

  /**
   * Increment experiment conversion count.
   */
  async incrementExperimentConversion(
    experimentId: string,
    variantId: string
  ) {
    return prisma.$transaction([
      prisma.qRExperiment.update({
        where: {
          id: experimentId,
        },

        data: {
          conversionCount: {
            increment: 1,
          },
        },
      }),

      prisma.qRExperimentVariant.update({
        where: {
          id: variantId,
        },

        data: {
          conversionCount: {
            increment: 1,
          },
        },
      }),
    ]);
  }

  /**
   * Find active experiment.
   */
  async findActiveExperiment(
    experimentId: string,
    now: Date
  ) {
    return prisma.qRExperiment.findFirst({
      where: {
        id: experimentId,

        status:
          QRExperimentStatus.RUNNING,

        OR: [
          {
            startsAt: null,
          },
          {
            startsAt: {
              lte: now,
            },
          },
        ],

        AND: [
          {
            OR: [
              {
                endsAt: null,
              },
              {
                endsAt: {
                  gte: now,
                },
              },
            ],
          },
        ],
      },

      include: {
        variants: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

    /**
   * ============================================================
   * MANAGEMENT — FIND QR FOR OWNER
   * ============================================================
   */

  async findQRCodeForOwner(
    qrCodeId: string,
    ownerId: string
  ) {
    return prisma.qRCode.findFirst({
      where: {
        id: qrCodeId,
        deletedAt: null,
        business: {
          ownerId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
        businessId: true,
        scanCount: true,
        catalogId: true,
        sourceType: true,
        placementLabel: true,
        locationLabel: true,
        campaignName: true,
        business: {
          select: {
            id: true,
            ownerId: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * ============================================================
   * MANAGEMENT — FIND RULE FOR OWNER
   * ============================================================
   */

  async findRuleForOwner(
    ruleId: string,
    ownerId: string
  ) {
    return prisma.qRRule.findFirst({
      where: {
        id: ruleId,
        qrCode: {
          deletedAt: null,
          business: {
            ownerId,
            deletedAt: null,
          },
        },
      },

      include: {
        conditions: {
          orderBy: {
            sortOrder: "asc",
          },
        },

        qrruleConditionGroups: {
          include: {
            conditions: {
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
          orderBy: {
            sortOrder: "asc",
          },
        },

        versions: {
          orderBy: {
            version: "desc",
          },
        },

        experiment: {
          include: {
            variants: true,
          },
        },

        auditLogs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },

        overrides: {
          orderBy: [
            {
              priority: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
        },

        qrCode: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            status: true,
            businessId: true,
          },
        },
      },
    });
  }

  /**
   * ============================================================
   * MANAGEMENT — LIST RULES
   * ============================================================
   */

  async listRulesForQRCode(
    qrCodeId: string,
    ownerId: string
  ) {
    return prisma.qRRule.findMany({
      where: {
        qrCodeId,

        qrCode: {
          deletedAt: null,

          business: {
            ownerId,
            deletedAt: null,
          },
        },
      },

      include: {
        conditions: {
          orderBy: {
            sortOrder: "asc",
          },
        },

        qrruleConditionGroups: {
          include: {
            conditions: {
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
          orderBy: {
            sortOrder: "asc",
          },
        },

        versions: {
          orderBy: {
            version: "desc",
          },
          take: 1,
        },

        experiment: {
          include: {
            variants: true,
          },
        },
      },

      orderBy: [
        {
          priority: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
    });
  }

  /**
   * ============================================================
   * MANAGEMENT — CREATE RULE
   * ============================================================
   */

  async createRule(data: {
    qrCodeId: string;
    name: string;
    description?: string | null;
    priority: number;
    startsAt?: Date | null;
    endsAt?: Date | null;
    logic: QRRuleLogic;
    actionType: QRRuleActionType;
    actionValue: string;
    fallbackActionType?: QRRuleActionType | null;
    fallbackActionValue?: string | null;
    experimentId?: string | null;
    conditions: Array<{
      id: string;
      type: QRRuleConditionType;
      operator: QRRuleOperator;
      value: Prisma.InputJsonValue;
      sortOrder: number;
    }>;
    groups: Array<{
      id: string;
      parentGroupId?: string | null;
      logic: QRRuleLogic;
      sortOrder: number;
      conditions: Array<{
        id: string;
        type: QRRuleConditionType;
        operator: QRRuleOperator;
        value: Prisma.InputJsonValue;
        sortOrder: number;
      }>;
    }>;
    versionSnapshot: Prisma.InputJsonValue;
    actorId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const rule = await tx.qRRule.create({
        data: {
          qrCodeId: data.qrCodeId,
          name: data.name,
          description: data.description ?? null,
          priority: data.priority,
          startsAt: data.startsAt ?? null,
          endsAt: data.endsAt ?? null,
          logic: data.logic,
          actionType: data.actionType,
          actionValue: data.actionValue,
          fallbackActionType:
            data.fallbackActionType ?? null,
          fallbackActionValue:
            data.fallbackActionValue ?? null,
          experimentId: data.experimentId ?? null,
        },
      });

      if (data.conditions.length) {
        await tx.qRRuleCondition.createMany({
          data: data.conditions.map((condition) => ({
            id: condition.id,
            ruleId: rule.id,
            groupId: null,
            type: condition.type,
            operator: condition.operator,
            value: condition.value,
            sortOrder: condition.sortOrder,
          })),
        });
      }

      if (data.groups.length) {
        await tx.qRRuleConditionGroup.createMany({
          data: data.groups.map((group) => ({
            id: group.id,
            ruleId: rule.id,
            parentGroupId:
              group.parentGroupId ?? null,
            logic: group.logic,
            sortOrder: group.sortOrder,
          })),
        });

        const groupedConditions =
          data.groups.flatMap((group) =>
            group.conditions.map((condition) => ({
              id: condition.id,
              ruleId: rule.id,
              groupId: group.id,
              type: condition.type,
              operator: condition.operator,
              value: condition.value,
              sortOrder: condition.sortOrder,
            }))
          );

        if (groupedConditions.length) {
          await tx.qRRuleCondition.createMany({
            data: groupedConditions,
          });
        }
      }

      const version =
        await tx.qRRuleVersion.create({
          data: {
            ruleId: rule.id,
            version: 1,
            status: QRRuleVersionStatus.DRAFT,
            snapshot: data.versionSnapshot,
            createdBy: data.actorId,
          },
        });

      await tx.qRRuleAuditLog.create({
        data: {
          ruleId: rule.id,
          action: "CREATED",
          actorId: data.actorId,
          newState: data.versionSnapshot,
        },
      });

      return {
        ruleId: rule.id,
        versionId: version.id,
      };
    });
  }

  /**
   * ============================================================
   * MANAGEMENT — UPDATE RULE
   * ============================================================
   */

  async updateRule(
    ruleId: string,
    data: {
      name?: string;
      description?: string | null;
      priority?: number;
      startsAt?: Date | null;
      endsAt?: Date | null;
      logic?: QRRuleLogic;
      actionType?: QRRuleActionType;
      actionValue?: string;
      fallbackActionType?: QRRuleActionType | null;
      fallbackActionValue?: string | null;
      experimentId?: string | null;
      conditions?: Array<{
        id: string;
        type: QRRuleConditionType;
        operator: QRRuleOperator;
        value: Prisma.InputJsonValue;
        sortOrder: number;
      }>;
      groups?: Array<{
        id: string;
        parentGroupId?: string | null;
        logic: QRRuleLogic;
        sortOrder: number;
        conditions: Array<{
          id: string;
          type: QRRuleConditionType;
          operator: QRRuleOperator;
          value: Prisma.InputJsonValue;
          sortOrder: number;
        }>;
      }>;
      versionSnapshot: Prisma.InputJsonValue;
      actorId: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const previous =
        await tx.qRRule.findUnique({
          where: {
            id: ruleId,
          },
          include: {
            conditions: true,
          },
        });

      if (!previous) {
        throw new Error("QR rule not found.");
      }

      const rule =
        await tx.qRRule.update({
          where: {
            id: ruleId,
          },

          data: {
            ...(data.name !== undefined
              ? { name: data.name }
              : {}),

            ...(data.description !== undefined
              ? { description: data.description }
              : {}),

            ...(data.priority !== undefined
              ? { priority: data.priority }
              : {}),

            ...(data.startsAt !== undefined
              ? { startsAt: data.startsAt }
              : {}),

            ...(data.endsAt !== undefined
              ? { endsAt: data.endsAt }
              : {}),

            ...(data.logic !== undefined
              ? { logic: data.logic }
              : {}),

            ...(data.actionType !== undefined
              ? {
                  actionType:
                    data.actionType,
                }
              : {}),

            ...(data.actionValue !== undefined
              ? {
                  actionValue:
                    data.actionValue,
                }
              : {}),

            ...(data.fallbackActionType !== undefined
              ? {
                  fallbackActionType:
                    data.fallbackActionType,
                }
              : {}),

            ...(data.fallbackActionValue !== undefined
              ? {
                  fallbackActionValue:
                    data.fallbackActionValue,
                }
              : {}),

            ...(data.experimentId !== undefined
              ? {
                  experimentId:
                    data.experimentId,
                }
              : {}),
          },
        });

      /**
       * If conditions/groups were supplied,
       * replace the rule condition tree.
       */

      if (
        data.conditions !== undefined ||
        data.groups !== undefined
      ) {
        await tx.qRRuleCondition.deleteMany({
          where: {
            ruleId,
          },
        });

        await tx.qRRuleConditionGroup.deleteMany({
          where: {
            ruleId,
          },
        });

        const conditions =
          data.conditions ?? [];

        if (conditions.length) {
          await tx.qRRuleCondition.createMany({
            data: conditions.map(
              (condition) => ({
                id: condition.id,
                ruleId,
                groupId: null,
                type: condition.type,
                operator:
                  condition.operator,
                value: condition.value,
                sortOrder:
                  condition.sortOrder,
              })
            ),
          });
        }

        const groups =
          data.groups ?? [];

        if (groups.length) {
          await tx.qRRuleConditionGroup.createMany({
            data: groups.map(
              (group) => ({
                id: group.id,
                ruleId,
                parentGroupId:
                  group.parentGroupId ??
                  null,
                logic: group.logic,
                sortOrder:
                  group.sortOrder,
              })
            ),
          });

          const groupedConditions =
            groups.flatMap((group) =>
              group.conditions.map(
                (condition) => ({
                  id: condition.id,
                  ruleId,
                  groupId: group.id,
                  type: condition.type,
                  operator:
                    condition.operator,
                  value: condition.value,
                  sortOrder:
                    condition.sortOrder,
                })
              )
            );

          if (groupedConditions.length) {
            await tx.qRRuleCondition.createMany({
              data: groupedConditions,
            });
          }
        }
      }

      const latest =
        await tx.qRRuleVersion.findFirst({
          where: {
            ruleId,
          },
          orderBy: {
            version: "desc",
          },
        });

      const nextVersion =
        (latest?.version ?? 0) + 1;

      const version =
        await tx.qRRuleVersion.create({
          data: {
            ruleId,
            version: nextVersion,
            status: QRRuleVersionStatus.DRAFT,
            snapshot:
              data.versionSnapshot,
            createdBy: data.actorId,
          },
        });

      await tx.qRRuleAuditLog.create({
        data: {
          ruleId,
          action: "UPDATED",
          actorId: data.actorId,
          previousState: {
            id: previous.id,
            qrCodeId: previous.qrCodeId,
            name: previous.name,
            description: previous.description,
            priority: previous.priority,
            startsAt: previous.startsAt?.toISOString() ?? null,
            endsAt: previous.endsAt?.toISOString() ?? null,
            logic: previous.logic,
            actionType: previous.actionType,
            actionValue: previous.actionValue,
            fallbackActionType: previous.fallbackActionType,
            fallbackActionValue: previous.fallbackActionValue,
            experimentId: previous.experimentId,
            status: previous.status,
            publishedVersion: previous.publishedVersion,
            conditions: previous.conditions.map((condition) => ({
              id: condition.id,
              type: condition.type,
              operator: condition.operator,
              value: condition.value,
              sortOrder: condition.sortOrder,
            })),
          },
          newState: data.versionSnapshot,
        },
      });

      return {
        rule,
        version,
      };
    });
  }

  /**
   * ============================================================
   * MANAGEMENT — ARCHIVE
   * ============================================================
   */

  async archiveRule(
    ruleId: string,
    actorId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const rule =
        await tx.qRRule.update({
          where: {
            id: ruleId,
          },

          data: {
            status: QRRuleStatus.ARCHIVED,
          },
        });

      await tx.qRRuleAuditLog.create({
        data: {
          ruleId,
          action: "ARCHIVED",
          actorId,
        },
      });

      return rule;
    });
  }

  /**
   * ============================================================
   * MANAGEMENT — ACTIVATE / PAUSE
   * ============================================================
   */

  async setRuleStatus(
    ruleId: string,
    status: QRRuleStatus,
    actorId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const rule =
        await tx.qRRule.update({
          where: {
            id: ruleId,
          },

          data: {
            status,
          },
        });

      await tx.qRRuleAuditLog.create({
        data: {
          ruleId,
          action:
            status === QRRuleStatus.ACTIVE
              ? "ACTIVATED"
              : "PAUSED",
          actorId,
        },
      });

      return rule;
    });
  }

  /**
   * ============================================================
   * MANAGEMENT — PUBLISH
   * ============================================================
   */

  async publishRule(
    ruleId: string,
    actorId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const rule =
        await tx.qRRule.findUnique({
          where: {
            id: ruleId,
          },
        });

      if (!rule) {
        throw new Error("QR rule not found.");
      }

      const draft =
        await tx.qRRuleVersion.findFirst({
          where: {
            ruleId,
            status:
              QRRuleVersionStatus.DRAFT,
          },
          orderBy: {
            version: "desc",
          },
        });

      if (!draft) {
        throw new Error(
          "No draft version available to publish."
        );
      }

      await tx.qRRuleVersion.updateMany({
        where: {
          ruleId,
          status:
            QRRuleVersionStatus.PUBLISHED,
        },

        data: {
          status:
            QRRuleVersionStatus.ARCHIVED,
        },
      });

      const published =
        await tx.qRRuleVersion.update({
          where: {
            id: draft.id,
          },

          data: {
            status:
              QRRuleVersionStatus.PUBLISHED,
            publishedBy: actorId,
            publishedAt: new Date(),
          },
        });

      const updatedRule =
        await tx.qRRule.update({
          where: {
            id: ruleId,
          },

          data: {
            status: QRRuleStatus.ACTIVE,
            publishedVersion:
              published.version,
          },
        });

      await tx.qRRuleAuditLog.create({
        data: {
          ruleId,
          action: "PUBLISHED",
          actorId,
          newState: {
            version: published.version,
          },
        },
      });

      return {
        rule: updatedRule,
        version: published,
      };
    });
  }

  /**
   * ============================================================
   * MANAGEMENT — ROLLBACK
   * ============================================================
   */

 /**
 * ============================================================
 * MANAGEMENT — ROLLBACK
 * ============================================================
 *
 * Restores the selected immutable version snapshot into the
 * live QR rule configuration and creates a new published
 * version representing that rollback.
 */
async rollbackRule(
  ruleId: string,
  versionNumber: number,
  actorId: string
) {
  return prisma.$transaction(async (tx) => {
    /**
     * --------------------------------------------------------
     * 1. Load the source version
     * --------------------------------------------------------
     */
    const source =
      await tx.qRRuleVersion.findFirst({
        where: {
          ruleId,
          version: versionNumber,
        },
      });

    if (!source) {
      throw new Error("Rule version not found.");
    }

    /**
     * --------------------------------------------------------
     * 2. Load the current live rule
     * --------------------------------------------------------
     *
     * Used for audit history.
     */
    const currentRule =
      await tx.qRRule.findUnique({
        where: {
          id: ruleId,
        },
        include: {
          conditions: true,
          qrruleConditionGroups: {
            include: {
              conditions: true,
            },
          },
        },
      });

    if (!currentRule) {
      throw new Error("QR rule not found.");
    }

    /**
     * --------------------------------------------------------
     * 3. Read immutable snapshot
     * --------------------------------------------------------
     */
    if (
      source.snapshot === null ||
      typeof source.snapshot !== "object" ||
      Array.isArray(source.snapshot)
    ) {
      throw new Error(
        "Rule version snapshot is invalid."
      );
    }

    const snapshot =
      source.snapshot as Prisma.JsonObject;

    /**
     * --------------------------------------------------------
     * 4. Extract snapshot fields
     * --------------------------------------------------------
     */

    const qrCodeId =
      typeof snapshot.qrCodeId === "string"
        ? snapshot.qrCodeId
        : currentRule.qrCodeId;

    const name =
      typeof snapshot.name === "string"
        ? snapshot.name
        : currentRule.name;

    const description =
      snapshot.description === null ||
      typeof snapshot.description === "string"
        ? snapshot.description
        : currentRule.description;

    const priority =
      typeof snapshot.priority === "number"
        ? snapshot.priority
        : currentRule.priority;

    const startsAt =
      typeof snapshot.startsAt === "string"
        ? new Date(snapshot.startsAt)
        : null;

    const endsAt =
      typeof snapshot.endsAt === "string"
        ? new Date(snapshot.endsAt)
        : null;

    const logic =
      snapshot.logic === "AND" ||
      snapshot.logic === "OR"
        ? snapshot.logic
        : currentRule.logic;

    const actionType =
      typeof snapshot.actionType === "string"
        ? snapshot.actionType as QRRuleActionType
        : currentRule.actionType;

    const actionValue =
      typeof snapshot.actionValue === "string"
        ? snapshot.actionValue
        : currentRule.actionValue;

    const fallbackActionType =
      snapshot.fallbackActionType === null ||
      typeof snapshot.fallbackActionType === "string"
        ? snapshot.fallbackActionType as
            | QRRuleActionType
            | null
        : currentRule.fallbackActionType;

    const fallbackActionValue =
      snapshot.fallbackActionValue === null ||
      typeof snapshot.fallbackActionValue === "string"
        ? snapshot.fallbackActionValue
        : currentRule.fallbackActionValue;

    const experimentId =
      snapshot.experimentId === null ||
      typeof snapshot.experimentId === "string"
        ? snapshot.experimentId
        : currentRule.experimentId;

    /**
     * --------------------------------------------------------
     * 5. Read conditions/groups from snapshot
     * --------------------------------------------------------
     */

    const snapshotConditions =
      Array.isArray(snapshot.conditions)
        ? snapshot.conditions
        : [];

    const snapshotGroups =
      Array.isArray(snapshot.groups)
        ? snapshot.groups
        : [];

    /**
     * --------------------------------------------------------
     * 6. Create the next version number
     * --------------------------------------------------------
     */
    const latest =
      await tx.qRRuleVersion.findFirst({
        where: {
          ruleId,
        },
        orderBy: {
          version: "desc",
        },
      });

    const nextVersion =
      (latest?.version ?? 0) + 1;

    /**
     * --------------------------------------------------------
     * 7. Create the new published rollback version
     * --------------------------------------------------------
     */
    const rollbackVersion =
      await tx.qRRuleVersion.create({
        data: {
          ruleId,
          version: nextVersion,
          status:
            QRRuleVersionStatus.PUBLISHED,

          snapshot:
            source.snapshot as Prisma.InputJsonValue,

          createdBy: actorId,
          publishedBy: actorId,
          publishedAt: new Date(),
          rollbackFromVersion:
            source.version,
        },
      });

    /**
     * --------------------------------------------------------
     * 8. Archive the previous published version
     * --------------------------------------------------------
     */
    await tx.qRRuleVersion.updateMany({
      where: {
        ruleId,
        id: {
          not: rollbackVersion.id,
        },
        status:
          QRRuleVersionStatus.PUBLISHED,
      },
      data: {
        status:
          QRRuleVersionStatus.ARCHIVED,
      },
    });

    /**
     * --------------------------------------------------------
     * 9. Restore LIVE QR rule fields
     * --------------------------------------------------------
     */
    const updatedRule =
      await tx.qRRule.update({
        where: {
          id: ruleId,
        },
        data: {
          qrCodeId,

          name,

          description,

          priority,

          startsAt,

          endsAt,

          logic:
            logic as QRRuleLogic,

          actionType,

          actionValue,

          fallbackActionType,

          fallbackActionValue,

          experimentId,

          status:
            QRRuleStatus.ACTIVE,

          publishedVersion:
            rollbackVersion.version,
        },
      });

    /**
     * --------------------------------------------------------
     * 10. Remove current condition tree
     * --------------------------------------------------------
     *
     * Conditions reference groups, therefore conditions are
     * removed first.
     */
    await tx.qRRuleCondition.deleteMany({
      where: {
        ruleId,
      },
    });

    await tx.qRRuleConditionGroup.deleteMany({
      where: {
        ruleId,
      },
    });

    /**
     * --------------------------------------------------------
     * 11. Restore direct conditions
     * --------------------------------------------------------
     */
    const directConditions =
      snapshotConditions
        .filter(
          (condition): condition is Prisma.JsonObject =>
            typeof condition === "object" &&
            condition !== null &&
            !Array.isArray(condition)
        )
        .map((condition) => ({
          id:
            typeof condition.id === "string"
              ? condition.id
              : undefined,

          ruleId,

          groupId: null,

          type:
            condition.type as QRRuleConditionType,

          operator:
            condition.operator as QRRuleOperator,

          value:
            condition.value as Prisma.InputJsonValue,

          sortOrder:
            typeof condition.sortOrder === "number"
              ? condition.sortOrder
              : 0,
        }));

    if (directConditions.length) {
      await tx.qRRuleCondition.createMany({
        data: directConditions.map(
          (condition) => ({
            ...condition,
            id:
              condition.id ??
              randomUUID(),
          })
        ),
      });
    }

    /**
     * --------------------------------------------------------
     * 12. Restore condition groups
     * --------------------------------------------------------
     */
    const groups =
      snapshotGroups
        .filter(
          (group): group is Prisma.JsonObject =>
            typeof group === "object" &&
            group !== null &&
            !Array.isArray(group)
        )
        .map((group) => ({
          id:
            typeof group.id === "string"
              ? group.id
              : randomUUID(),

          ruleId,

          parentGroupId:
            typeof group.parentGroupId === "string"
              ? group.parentGroupId
              : null,

          logic:
            group.logic === "OR"
              ? QRRuleLogic.OR
              : QRRuleLogic.AND,

          sortOrder:
            typeof group.sortOrder === "number"
              ? group.sortOrder
              : 0,

          conditions:
            Array.isArray(group.conditions)
              ? group.conditions
              : [],
        }));

    if (groups.length) {
      /**
       * ------------------------------------------------------
       * Create groups
       * ------------------------------------------------------
       */
      await tx.qRRuleConditionGroup.createMany({
        data: groups.map((group) => ({
          id: group.id,
          ruleId,
          parentGroupId:
            group.parentGroupId,
          logic: group.logic,
          sortOrder:
            group.sortOrder,
        })),
      });

      /**
       * ------------------------------------------------------
       * Create grouped conditions
       * ------------------------------------------------------
       */
      const groupedConditions =
        groups.flatMap((group) =>
          group.conditions
            .filter(
              (condition): condition is Prisma.JsonObject =>
                typeof condition === "object" &&
                condition !== null &&
                !Array.isArray(condition)
            )
            .map((condition) => ({
              id:
                typeof condition.id === "string"
                  ? condition.id
                  : randomUUID(),

              ruleId,

              groupId: group.id,

              type:
                condition.type as QRRuleConditionType,

              operator:
                condition.operator as QRRuleOperator,

              value:
                condition.value as Prisma.InputJsonValue,

              sortOrder:
                typeof condition.sortOrder === "number"
                  ? condition.sortOrder
                  : 0,
            }))
        );

      if (groupedConditions.length) {
        await tx.qRRuleCondition.createMany({
          data: groupedConditions,
        });
      }
    }

    /**
     * --------------------------------------------------------
     * 13. Audit rollback
     * --------------------------------------------------------
     */
    await tx.qRRuleAuditLog.create({
      data: {
        ruleId,

        action: "ROLLED_BACK",

        actorId,

        previousState: {
          version:
            currentRule.publishedVersion,
          name: currentRule.name,
          actionType:
            currentRule.actionType,
          actionValue:
            currentRule.actionValue,
        },

        newState: {
          version:
            rollbackVersion.version,

          rollbackFromVersion:
            source.version,

          name,

          actionType,

          actionValue,
        },

        metadata: {
          sourceVersion:
            source.version,
        },
      },
    });

    return {
      rule: updatedRule,
      version: rollbackVersion,
    };
  });
}
  /**
   * Retrieve rule-match analytics.
   */
  async listRuleMatches(
    qrCodeId: string,
    options?: {
      ruleId?: string;
      status?: QRRuleMatchStatus;
      from?: Date;
      to?: Date;
      limit?: number;
      offset?: number;
    }
  ) {
    const limit = Math.min(
      options?.limit ?? 100,
      500
    );

    return prisma.qRRuleMatch.findMany({
      where: {
        qrCodeId,

        ...(options?.ruleId
          ? {
              ruleId: options.ruleId,
            }
          : {}),

        ...(options?.status
          ? {
              status: options.status,
            }
          : {}),

        ...(options?.from ||
        options?.to
          ? {
              matchedAt: {
                ...(options.from
                  ? {
                      gte: options.from,
                    }
                  : {}),

                ...(options.to
                  ? {
                      lte: options.to,
                    }
                  : {}),
              },
            }
          : {}),
      },

      orderBy: {
        matchedAt: "desc",
      },

      take: limit,

      skip: options?.offset ?? 0,
    });
  }
  
}