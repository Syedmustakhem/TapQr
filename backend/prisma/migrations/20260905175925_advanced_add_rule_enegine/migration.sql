-- CreateEnum
CREATE TYPE "QRRuleOverrideType" AS ENUM ('EMERGENCY', 'BUSINESS', 'CAMPAIGN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "QRRuleOverrideStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'DISABLED');

-- CreateEnum
CREATE TYPE "QRExperimentStatus" AS ENUM ('DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QRExperimentAllocationType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "QRRuleMatchStatus" AS ENUM ('MATCHED', 'NOT_MATCHED', 'FALLBACK', 'ERROR');

-- CreateEnum
CREATE TYPE "QRRuleAuditAction" AS ENUM ('CREATED', 'UPDATED', 'ACTIVATED', 'PAUSED', 'PUBLISHED', 'ROLLED_BACK', 'ARCHIVED', 'DELETED', 'PRIORITY_CHANGED', 'OVERRIDE_CREATED', 'OVERRIDE_DISABLED');

-- AlterTable
ALTER TABLE "QRRule" ADD COLUMN     "experimentId" TEXT;

-- AlterTable
ALTER TABLE "QRRuleCondition" ADD COLUMN     "groupId" TEXT;

-- AlterTable
ALTER TABLE "QRRuleVersion" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "publishedBy" TEXT,
ADD COLUMN     "rollbackFromVersion" INTEGER;

-- CreateTable
CREATE TABLE "QRRuleConditionGroup" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "parentGroupId" TEXT,
    "logic" "QRRuleLogic" NOT NULL DEFAULT 'AND',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRRuleConditionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRExperiment" (
    "id" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "QRExperimentStatus" NOT NULL DEFAULT 'DRAFT',
    "allocationType" "QRExperimentAllocationType" NOT NULL DEFAULT 'PERCENTAGE',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "conversionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRExperiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRExperimentVariant" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allocation" INTEGER NOT NULL,
    "actionType" "QRRuleActionType" NOT NULL,
    "actionValue" TEXT NOT NULL,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "conversionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRExperimentVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRExperimentAssignment" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "firstAssignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRExperimentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRRuleMatch" (
    "id" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "ruleId" TEXT,
    "ruleVersion" INTEGER,
    "status" "QRRuleMatchStatus" NOT NULL,
    "actionType" "QRRuleActionType",
    "actionValue" TEXT,
    "experimentId" TEXT,
    "variantId" TEXT,
    "device" TEXT,
    "operatingSystem" TEXT,
    "browser" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "language" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "sourceType" TEXT,
    "visitorKey" TEXT,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRRuleMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRConversion" (
    "id" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "ruleId" TEXT,
    "ruleVersion" INTEGER,
    "experimentId" TEXT,
    "variantId" TEXT,
    "conversionType" TEXT NOT NULL,
    "externalId" TEXT,
    "value" DECIMAL(12,2),
    "currency" TEXT,
    "visitorKey" TEXT,
    "convertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRRuleOverride" (
    "id" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "ruleId" TEXT,
    "type" "QRRuleOverrideType" NOT NULL,
    "status" "QRRuleOverrideStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 10000,
    "reason" TEXT NOT NULL,
    "actionType" "QRRuleActionType" NOT NULL,
    "actionValue" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRRuleOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRRuleAuditLog" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "action" "QRRuleAuditAction" NOT NULL,
    "actorId" TEXT,
    "previousState" JSONB,
    "newState" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRRuleAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QRRuleConditionGroup_ruleId_idx" ON "QRRuleConditionGroup"("ruleId");

-- CreateIndex
CREATE INDEX "QRRuleConditionGroup_parentGroupId_idx" ON "QRRuleConditionGroup"("parentGroupId");

-- CreateIndex
CREATE INDEX "QRRuleConditionGroup_ruleId_sortOrder_idx" ON "QRRuleConditionGroup"("ruleId", "sortOrder");

-- CreateIndex
CREATE INDEX "QRExperiment_qrCodeId_idx" ON "QRExperiment"("qrCodeId");

-- CreateIndex
CREATE INDEX "QRExperiment_qrCodeId_status_idx" ON "QRExperiment"("qrCodeId", "status");

-- CreateIndex
CREATE INDEX "QRExperiment_startsAt_idx" ON "QRExperiment"("startsAt");

-- CreateIndex
CREATE INDEX "QRExperiment_endsAt_idx" ON "QRExperiment"("endsAt");

-- CreateIndex
CREATE INDEX "QRExperimentVariant_experimentId_idx" ON "QRExperimentVariant"("experimentId");

-- CreateIndex
CREATE INDEX "QRExperimentAssignment_experimentId_idx" ON "QRExperimentAssignment"("experimentId");

-- CreateIndex
CREATE INDEX "QRExperimentAssignment_variantId_idx" ON "QRExperimentAssignment"("variantId");

-- CreateIndex
CREATE INDEX "QRExperimentAssignment_visitorKey_idx" ON "QRExperimentAssignment"("visitorKey");

-- CreateIndex
CREATE UNIQUE INDEX "QRExperimentAssignment_experimentId_visitorKey_key" ON "QRExperimentAssignment"("experimentId", "visitorKey");

-- CreateIndex
CREATE INDEX "QRRuleMatch_qrCodeId_idx" ON "QRRuleMatch"("qrCodeId");

-- CreateIndex
CREATE INDEX "QRRuleMatch_qrCodeId_matchedAt_idx" ON "QRRuleMatch"("qrCodeId", "matchedAt");

-- CreateIndex
CREATE INDEX "QRRuleMatch_ruleId_idx" ON "QRRuleMatch"("ruleId");

-- CreateIndex
CREATE INDEX "QRRuleMatch_experimentId_idx" ON "QRRuleMatch"("experimentId");

-- CreateIndex
CREATE INDEX "QRRuleMatch_variantId_idx" ON "QRRuleMatch"("variantId");

-- CreateIndex
CREATE INDEX "QRRuleMatch_status_idx" ON "QRRuleMatch"("status");

-- CreateIndex
CREATE INDEX "QRRuleMatch_sourceType_idx" ON "QRRuleMatch"("sourceType");

-- CreateIndex
CREATE INDEX "QRConversion_qrCodeId_idx" ON "QRConversion"("qrCodeId");

-- CreateIndex
CREATE INDEX "QRConversion_ruleId_idx" ON "QRConversion"("ruleId");

-- CreateIndex
CREATE INDEX "QRConversion_experimentId_idx" ON "QRConversion"("experimentId");

-- CreateIndex
CREATE INDEX "QRConversion_variantId_idx" ON "QRConversion"("variantId");

-- CreateIndex
CREATE INDEX "QRConversion_conversionType_idx" ON "QRConversion"("conversionType");

-- CreateIndex
CREATE INDEX "QRConversion_convertedAt_idx" ON "QRConversion"("convertedAt");

-- CreateIndex
CREATE INDEX "QRConversion_externalId_idx" ON "QRConversion"("externalId");

-- CreateIndex
CREATE INDEX "QRRuleOverride_qrCodeId_idx" ON "QRRuleOverride"("qrCodeId");

-- CreateIndex
CREATE INDEX "QRRuleOverride_qrCodeId_status_idx" ON "QRRuleOverride"("qrCodeId", "status");

-- CreateIndex
CREATE INDEX "QRRuleOverride_qrCodeId_priority_idx" ON "QRRuleOverride"("qrCodeId", "priority");

-- CreateIndex
CREATE INDEX "QRRuleOverride_startsAt_idx" ON "QRRuleOverride"("startsAt");

-- CreateIndex
CREATE INDEX "QRRuleOverride_endsAt_idx" ON "QRRuleOverride"("endsAt");

-- CreateIndex
CREATE INDEX "QRRuleAuditLog_ruleId_idx" ON "QRRuleAuditLog"("ruleId");

-- CreateIndex
CREATE INDEX "QRRuleAuditLog_actorId_idx" ON "QRRuleAuditLog"("actorId");

-- CreateIndex
CREATE INDEX "QRRuleAuditLog_createdAt_idx" ON "QRRuleAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "QRRuleAuditLog_action_idx" ON "QRRuleAuditLog"("action");

-- CreateIndex
CREATE INDEX "QRRule_experimentId_idx" ON "QRRule"("experimentId");

-- CreateIndex
CREATE INDEX "QRRuleCondition_groupId_idx" ON "QRRuleCondition"("groupId");

-- AddForeignKey
ALTER TABLE "QRRule" ADD CONSTRAINT "QRRule_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "QRExperiment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRRuleCondition" ADD CONSTRAINT "QRRuleCondition_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "QRRuleConditionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRRuleConditionGroup" ADD CONSTRAINT "QRRuleConditionGroup_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "QRRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRRuleConditionGroup" ADD CONSTRAINT "QRRuleConditionGroup_parentGroupId_fkey" FOREIGN KEY ("parentGroupId") REFERENCES "QRRuleConditionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRExperiment" ADD CONSTRAINT "QRExperiment_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRExperimentVariant" ADD CONSTRAINT "QRExperimentVariant_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "QRExperiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRExperimentAssignment" ADD CONSTRAINT "QRExperimentAssignment_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "QRExperiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRExperimentAssignment" ADD CONSTRAINT "QRExperimentAssignment_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "QRExperimentVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRRuleMatch" ADD CONSTRAINT "QRRuleMatch_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRRuleMatch" ADD CONSTRAINT "QRRuleMatch_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "QRRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRConversion" ADD CONSTRAINT "QRConversion_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRConversion" ADD CONSTRAINT "QRConversion_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "QRRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRRuleOverride" ADD CONSTRAINT "QRRuleOverride_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRRuleOverride" ADD CONSTRAINT "QRRuleOverride_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "QRRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRRuleAuditLog" ADD CONSTRAINT "QRRuleAuditLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "QRRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
