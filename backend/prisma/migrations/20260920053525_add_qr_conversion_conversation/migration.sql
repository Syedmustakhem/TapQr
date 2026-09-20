-- CreateIndex
CREATE INDEX "QRConversion_conversationId_idx" ON "QRConversion"("conversationId");

-- AddForeignKey
ALTER TABLE "QRConversion" ADD CONSTRAINT "QRConversion_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
