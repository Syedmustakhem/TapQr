/*
  Warnings:

  - The `sourceTypeSnapshot` column on the `ScanEvent` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ScanEvent" DROP COLUMN "sourceTypeSnapshot",
ADD COLUMN     "sourceTypeSnapshot" "QRSourceType";

-- CreateIndex
CREATE INDEX "ScanEvent_sourceTypeSnapshot_idx" ON "ScanEvent"("sourceTypeSnapshot");
