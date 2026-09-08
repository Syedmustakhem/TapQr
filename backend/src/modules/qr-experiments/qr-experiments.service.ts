import {
  QRExperimentAllocationType,
  QRExperimentStatus,
  QRRuleActionType,
} from "@prisma/client";

import { AppError } from "../../cores/errors/AppError";
import { QRExperimentsRepository } from "./qr-experiments.repository";

type CreateInput = {
  qrCodeId: string;
  name: string;
  description?: string | null;
  allocationType?: QRExperimentAllocationType;
  startsAt?: string | null;
  endsAt?: string | null;
};

type UpdateInput = Partial<Omit<CreateInput, "qrCodeId">>;

type VariantInput = {
  name: string;
  allocation: number;
  actionType: QRRuleActionType;
  actionValue: string;
};

export class QRExperimentsService {
  private readonly repository = new QRExperimentsRepository();

  private parseDate(value?: string | null) {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new AppError("Invalid experiment date.", 400, "INVALID_DATE");
    }

    return date;
  }

  private validateDateRange(
    startsAt?: string | null,
    endsAt?: string | null
  ) {
    const start = this.parseDate(startsAt);
    const end = this.parseDate(endsAt);

    if (start && end && start > end) {
      throw new AppError(
        "Experiment end time cannot be before start time.",
        400,
        "INVALID_DATE_RANGE"
      );
    }
  }

  private async getOwnedExperiment(
    ownerId: string,
    id: string
  ) {
    const experiment =
      await this.repository.findExperimentForOwner(id, ownerId);

    if (!experiment) {
      throw new AppError(
        "Experiment not found or access denied.",
        404,
        "EXPERIMENT_NOT_FOUND"
      );
    }

    return experiment;
  }

  private async validateAllocations(
    experimentId: string,
    allocationType: QRExperimentAllocationType
  ) {
    const allocations =
      await this.repository.getVariantAllocations(experimentId);

    if (allocations.length < 2) {
      throw new AppError(
        "An experiment requires at least two variants.",
        409,
        "EXPERIMENT_NEEDS_VARIANTS"
      );
    }

    const total = allocations.reduce(
      (sum, item) => sum + item.allocation,
      0
    );

    if (total <= 0) {
      throw new AppError(
        "Variant allocation must be greater than zero.",
        409,
        "INVALID_ALLOCATION"
      );
    }

    if (
      allocationType === QRExperimentAllocationType.PERCENTAGE &&
      total !== 100
    ) {
      throw new AppError(
        "Percentage allocations must total exactly 100.",
        409,
        "INVALID_PERCENTAGE_ALLOCATION"
      );
    }
  }

  async create(ownerId: string, input: CreateInput) {
    this.validateDateRange(input.startsAt, input.endsAt);

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

    return this.repository.createExperiment({
      qrCodeId: input.qrCodeId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      allocationType:
        input.allocationType ??
        QRExperimentAllocationType.PERCENTAGE,
      startsAt: this.parseDate(input.startsAt),
      endsAt: this.parseDate(input.endsAt),
      status: QRExperimentStatus.DRAFT,
    });
  }

  async list(ownerId: string, qrCodeId?: string) {
    if (qrCodeId) {
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
    }

    return this.repository.listExperimentsForOwner(
      ownerId,
      qrCodeId
    );
  }

  async get(ownerId: string, id: string) {
    return this.getOwnedExperiment(ownerId, id);
  }

  async update(
    ownerId: string,
    id: string,
    input: UpdateInput
  ) {
    const experiment =
      await this.getOwnedExperiment(ownerId, id);

    if (
      experiment.status === QRExperimentStatus.RUNNING ||
      experiment.status === QRExperimentStatus.COMPLETED ||
      experiment.status === QRExperimentStatus.ARCHIVED
    ) {
      throw new AppError(
        "Only draft or paused experiments can be edited.",
        409,
        "EXPERIMENT_NOT_EDITABLE"
      );
    }

    this.validateDateRange(input.startsAt, input.endsAt);

    return this.repository.updateExperiment(id, {
      ...(input.name !== undefined
        ? { name: input.name.trim() }
        : {}),
      ...(input.description !== undefined
        ? {
            description:
              input.description?.trim() || null,
          }
        : {}),
      ...(input.allocationType !== undefined
        ? { allocationType: input.allocationType }
        : {}),
      ...(input.startsAt !== undefined
        ? { startsAt: this.parseDate(input.startsAt) }
        : {}),
      ...(input.endsAt !== undefined
        ? { endsAt: this.parseDate(input.endsAt) }
        : {}),
    });
  }

  async archive(ownerId: string, id: string) {
    const experiment =
      await this.getOwnedExperiment(ownerId, id);

    if (experiment.status === QRExperimentStatus.RUNNING) {
      throw new AppError(
        "Pause the experiment before archiving it.",
        409,
        "EXPERIMENT_RUNNING"
      );
    }

    return this.repository.archiveExperiment(id);
  }

  async start(ownerId: string, id: string) {
    const experiment =
      await this.getOwnedExperiment(ownerId, id);

    if (
      experiment.status !== QRExperimentStatus.DRAFT &&
      experiment.status !== QRExperimentStatus.PAUSED
    ) {
      throw new AppError(
        "Only draft or paused experiments can be started.",
        409,
        "EXPERIMENT_NOT_STARTABLE"
      );
    }

    this.validateDateRange(
      experiment.startsAt?.toISOString(),
      experiment.endsAt?.toISOString()
    );

    await this.validateAllocations(
      experiment.id,
      experiment.allocationType
    );

    return this.repository.updateExperiment(id, {
      status: QRExperimentStatus.RUNNING,
    });
  }

  async pause(ownerId: string, id: string) {
    const experiment =
      await this.getOwnedExperiment(ownerId, id);

    if (experiment.status !== QRExperimentStatus.RUNNING) {
      throw new AppError(
        "Only running experiments can be paused.",
        409,
        "EXPERIMENT_NOT_RUNNING"
      );
    }

    return this.repository.updateExperiment(id, {
      status: QRExperimentStatus.PAUSED,
    });
  }

  async complete(ownerId: string, id: string) {
    const experiment =
      await this.getOwnedExperiment(ownerId, id);

    if (experiment.status !== QRExperimentStatus.RUNNING) {
      throw new AppError(
        "Only running experiments can be completed.",
        409,
        "EXPERIMENT_NOT_RUNNING"
      );
    }

    return this.repository.updateExperiment(id, {
      status: QRExperimentStatus.COMPLETED,
    });
  }

  async createVariant(
    ownerId: string,
    experimentId: string,
    input: VariantInput
  ) {
    const experiment =
      await this.getOwnedExperiment(ownerId, experimentId);

    if (
      experiment.status === QRExperimentStatus.RUNNING ||
      experiment.status === QRExperimentStatus.COMPLETED ||
      experiment.status === QRExperimentStatus.ARCHIVED
    ) {
      throw new AppError(
        "Variants cannot be changed while an experiment is live or completed.",
        409,
        "VARIANT_NOT_EDITABLE"
      );
    }

    return this.repository.createVariant({
      experimentId,
      name: input.name.trim(),
      allocation: input.allocation,
      actionType: input.actionType,
      actionValue: input.actionValue.trim(),
    });
  }

  async updateVariant(
    ownerId: string,
    experimentId: string,
    variantId: string,
    input: Partial<VariantInput>
  ) {
    const experiment =
      await this.getOwnedExperiment(ownerId, experimentId);

    if (
      experiment.status === QRExperimentStatus.RUNNING ||
      experiment.status === QRExperimentStatus.COMPLETED ||
      experiment.status === QRExperimentStatus.ARCHIVED
    ) {
      throw new AppError(
        "Variants cannot be changed while an experiment is live or completed.",
        409,
        "VARIANT_NOT_EDITABLE"
      );
    }

    const variant =
      await this.repository.findVariantForExperiment(
        experimentId,
        variantId
      );

    if (!variant) {
      throw new AppError(
        "Variant not found.",
        404,
        "VARIANT_NOT_FOUND"
      );
    }

    return this.repository.updateVariant(variantId, {
      ...(input.name !== undefined
        ? { name: input.name.trim() }
        : {}),
      ...(input.allocation !== undefined
        ? { allocation: input.allocation }
        : {}),
      ...(input.actionType !== undefined
        ? { actionType: input.actionType }
        : {}),
      ...(input.actionValue !== undefined
        ? { actionValue: input.actionValue.trim() }
        : {}),
    });
  }

  async deleteVariant(
    ownerId: string,
    experimentId: string,
    variantId: string
  ) {
    const experiment =
      await this.getOwnedExperiment(ownerId, experimentId);

    if (
      experiment.status === QRExperimentStatus.RUNNING ||
      experiment.status === QRExperimentStatus.COMPLETED ||
      experiment.status === QRExperimentStatus.ARCHIVED
    ) {
      throw new AppError(
        "Variants cannot be deleted while an experiment is live or completed.",
        409,
        "VARIANT_NOT_EDITABLE"
      );
    }

    const count =
      await this.repository.countVariants(experimentId);

    if (count <= 2) {
      throw new AppError(
        "An experiment must keep at least two variants.",
        409,
        "MINIMUM_VARIANTS"
      );
    }

    const variant =
      await this.repository.findVariantForExperiment(
        experimentId,
        variantId
      );

    if (!variant) {
      throw new AppError(
        "Variant not found.",
        404,
        "VARIANT_NOT_FOUND"
      );
    }

    await this.repository.deleteVariant(variantId);

    return { id: variantId };
  }

  async createConversion(
    ownerId: string | null,
    input: {
      qrCodeId: string;
      conversionType: string;
      externalId?: string | null;
      value?: number | null;
      currency?: string | null;
      visitorKey?: string | null;
      experimentId?: string | null;
      variantId?: string | null;
      ruleId?: string | null;
      ruleVersion?: number | null;
    }
  ) {
    const qr =
      ownerId
        ? await this.repository.findQRCodeForOwner(
            input.qrCodeId,
            ownerId
          )
        : null;

    if (ownerId && !qr) {
      throw new AppError(
        "QR Code not found or access denied.",
        404,
        "QR_CODE_NOT_FOUND"
      );
    }

    if (!ownerId) {
      throw new AppError(
        "Public conversion attribution requires a verified server-side integration.",
        401,
        "CONVERSION_AUTH_REQUIRED"
      );
    }

    let experimentId = input.experimentId ?? null;
    let variantId = input.variantId ?? null;

    if (experimentId && variantId) {
      const experiment =
        await this.getOwnedExperiment(ownerId, experimentId);

      if (experiment.qrCodeId !== input.qrCodeId) {
        throw new AppError(
          "Experiment does not belong to the supplied QR code.",
          409,
          "CONVERSION_CONTEXT_MISMATCH"
        );
      }

      const variant =
        await this.repository.findVariantForExperiment(
          experimentId,
          variantId
        );

      if (!variant) {
        throw new AppError(
          "Variant does not belong to the supplied experiment.",
          409,
          "CONVERSION_CONTEXT_MISMATCH"
        );
      }
    }

    if (input.externalId) {
      const existing =
        await this.repository.findConversionByExternalId(
          input.qrCodeId,
          input.externalId
        );

      if (existing) {
        return existing;
      }
    }

    const conversion =
      await this.repository.createConversion({
        qrCodeId: input.qrCodeId,
        ruleId: input.ruleId ?? null,
        ruleVersion: input.ruleVersion ?? null,
        experimentId,
        variantId,
        conversionType: input.conversionType.trim(),
        externalId: input.externalId ?? null,
        value: input.value ?? null,
        currency: input.currency ?? null,
        visitorKey: input.visitorKey ?? null,
      });

    if (experimentId && variantId) {
      await this.repository.incrementConversion(
        experimentId,
        variantId
      );
    }

    return conversion;
  }
}
