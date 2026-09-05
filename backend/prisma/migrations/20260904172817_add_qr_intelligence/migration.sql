-- CreateEnum
CREATE TYPE "QRSourceType" AS ENUM ('TABLE', 'COUNTER', 'TAKEAWAY', 'PACKAGING', 'POSTER', 'FLYER', 'BUSINESS_CARD', 'RECEIPT', 'WEBSITE', 'SOCIAL_MEDIA', 'ADVERTISEMENT', 'EVENT', 'OTHER');

-- AlterTable
ALTER TABLE "QRCode" ADD COLUMN     "campaignName" TEXT,
ADD COLUMN     "lastScannedAt" TIMESTAMP(3),
ADD COLUMN     "locationLabel" TEXT,
ADD COLUMN     "placementLabel" TEXT,
ADD COLUMN     "sourceType" "QRSourceType" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "ScanEvent" ADD COLUMN     "sourceTypeSnapshot" TEXT;

-- CreateIndex
CREATE INDEX "QRCode_businessId_sourceType_idx" ON "QRCode"("businessId", "sourceType");

-- CreateIndex
CREATE INDEX "QRCode_lastScannedAt_idx" ON "QRCode"("lastScannedAt");
