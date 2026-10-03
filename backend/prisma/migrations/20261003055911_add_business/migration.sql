-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "reviewFunnelEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "isPrivateFeedback" BOOLEAN NOT NULL DEFAULT false;
