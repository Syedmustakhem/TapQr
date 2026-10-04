-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "upiPayEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "upiPayeeName" TEXT,
ADD COLUMN     "upiPresetAmounts" JSONB,
ADD COLUMN     "upiVpa" TEXT;
