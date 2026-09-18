/*
  Warnings:

  - The values [LOCATION] on the enum `QRRuleConditionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QRRuleActionType" ADD VALUE 'CAMPAIGN';
ALTER TYPE "QRRuleActionType" ADD VALUE 'CUSTOM';

-- AlterEnum
BEGIN;
CREATE TYPE "QRRuleConditionType_new" AS ENUM ('TIME', 'DATE', 'DAY_OF_WEEK', 'BUSINESS_HOURS', 'DEVICE', 'OPERATING_SYSTEM', 'BROWSER', 'LANGUAGE', 'COUNTRY', 'STATE', 'CITY', 'GEO_RADIUS', 'REFERRER', 'UTM_SOURCE', 'UTM_MEDIUM', 'UTM_CAMPAIGN', 'UTM_TERM', 'UTM_CONTENT', 'QR_SOURCE', 'QR_PLACEMENT', 'QR_LOCATION', 'CAMPAIGN', 'SCAN_COUNT', 'VISITOR_TYPE', 'CUSTOMER_STATE', 'CUSTOMER_SEGMENT', 'AUTHENTICATION_STATE', 'BUSINESS_STATE', 'CATALOG_STATE', 'PRODUCT_AVAILABILITY', 'SUBSCRIPTION_PLAN', 'CUSTOM');
ALTER TABLE "QRRuleCondition" ALTER COLUMN "type" TYPE "QRRuleConditionType_new" USING ("type"::text::"QRRuleConditionType_new");
ALTER TYPE "QRRuleConditionType" RENAME TO "QRRuleConditionType_old";
ALTER TYPE "QRRuleConditionType_new" RENAME TO "QRRuleConditionType";
DROP TYPE "public"."QRRuleConditionType_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QRRuleOperator" ADD VALUE 'NOT_BETWEEN';
ALTER TYPE "QRRuleOperator" ADD VALUE 'NOT_CONTAINS';
ALTER TYPE "QRRuleOperator" ADD VALUE 'EXISTS';
ALTER TYPE "QRRuleOperator" ADD VALUE 'NOT_EXISTS';

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Campaign_businessId_idx" ON "Campaign"("businessId");

-- CreateIndex
CREATE INDEX "Campaign_businessId_status_idx" ON "Campaign"("businessId", "status");

-- CreateIndex
CREATE INDEX "Campaign_startsAt_idx" ON "Campaign"("startsAt");

-- CreateIndex
CREATE INDEX "Campaign_endsAt_idx" ON "Campaign"("endsAt");

-- CreateIndex
CREATE INDEX "Campaign_createdAt_idx" ON "Campaign"("createdAt");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
