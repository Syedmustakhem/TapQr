-- CreateEnum
CREATE TYPE "QRRuleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QRRuleConditionType" AS ENUM ('TIME', 'DATE', 'DAY_OF_WEEK', 'BUSINESS_HOURS', 'DEVICE', 'OPERATING_SYSTEM', 'LOCATION', 'SCAN_COUNT', 'CAMPAIGN', 'CUSTOMER_STATE');

-- CreateEnum
CREATE TYPE "QRRuleOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'IN', 'NOT_IN', 'BETWEEN', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH');

-- CreateEnum
CREATE TYPE "QRRuleLogic" AS ENUM ('AND', 'OR');

-- CreateEnum
CREATE TYPE "QRRuleActionType" AS ENUM ('EXPERIENCE', 'REDIRECT', 'CATALOG', 'MENU', 'SERVICES', 'PRODUCTS', 'CONTACT');

-- CreateEnum
CREATE TYPE "QRRuleVersionStatus" AS ENUM ('DRAFT', 'TESTING', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "QRRule" (
    "id" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "QRRuleStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "logic" "QRRuleLogic" NOT NULL DEFAULT 'AND',
    "actionType" "QRRuleActionType" NOT NULL,
    "actionValue" TEXT NOT NULL,
    "fallbackActionType" "QRRuleActionType",
    "fallbackActionValue" TEXT,
    "matchCount" INTEGER NOT NULL DEFAULT 0,
    "lastMatchedAt" TIMESTAMP(3),
    "publishedVersion" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRRuleCondition" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "type" "QRRuleConditionType" NOT NULL,
    "operator" "QRRuleOperator" NOT NULL,
    "value" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRRuleCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRRuleVersion" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "QRRuleVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "snapshot" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRRuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QRRule_qrCodeId_idx" ON "QRRule"("qrCodeId");

-- CreateIndex
CREATE INDEX "QRRule_qrCodeId_status_idx" ON "QRRule"("qrCodeId", "status");

-- CreateIndex
CREATE INDEX "QRRule_qrCodeId_priority_idx" ON "QRRule"("qrCodeId", "priority");

-- CreateIndex
CREATE INDEX "QRRule_status_idx" ON "QRRule"("status");

-- CreateIndex
CREATE INDEX "QRRule_startsAt_idx" ON "QRRule"("startsAt");

-- CreateIndex
CREATE INDEX "QRRule_endsAt_idx" ON "QRRule"("endsAt");

-- CreateIndex
CREATE INDEX "QRRuleCondition_ruleId_idx" ON "QRRuleCondition"("ruleId");

-- CreateIndex
CREATE INDEX "QRRuleCondition_ruleId_sortOrder_idx" ON "QRRuleCondition"("ruleId", "sortOrder");

-- CreateIndex
CREATE INDEX "QRRuleCondition_type_idx" ON "QRRuleCondition"("type");

-- CreateIndex
CREATE INDEX "QRRuleVersion_ruleId_idx" ON "QRRuleVersion"("ruleId");

-- CreateIndex
CREATE INDEX "QRRuleVersion_ruleId_status_idx" ON "QRRuleVersion"("ruleId", "status");

-- CreateIndex
CREATE INDEX "QRRuleVersion_createdAt_idx" ON "QRRuleVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QRRuleVersion_ruleId_version_key" ON "QRRuleVersion"("ruleId", "version");

-- AddForeignKey
ALTER TABLE "QRRule" ADD CONSTRAINT "QRRule_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRRuleCondition" ADD CONSTRAINT "QRRuleCondition_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "QRRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRRuleVersion" ADD CONSTRAINT "QRRuleVersion_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "QRRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
