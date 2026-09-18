-- AlterTable
ALTER TABLE "QRCode" ADD COLUMN     "campaignId" TEXT;

-- CreateIndex
CREATE INDEX "QRCode_campaignId_idx" ON "QRCode"("campaignId");

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
