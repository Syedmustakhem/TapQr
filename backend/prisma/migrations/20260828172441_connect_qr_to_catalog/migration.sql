-- AlterTable
ALTER TABLE "QRCode" ADD COLUMN     "catalogId" TEXT;

-- CreateIndex
CREATE INDEX "QRCode_catalogId_idx" ON "QRCode"("catalogId");

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
