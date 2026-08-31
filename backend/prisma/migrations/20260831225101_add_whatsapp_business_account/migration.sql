-- CreateTable
CREATE TABLE "WhatsAppBusinessAccount" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "businessAccountId" TEXT,
    "displayPhoneNumber" TEXT,
    "verifiedName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppBusinessAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsAppBusinessAccount_businessId_idx" ON "WhatsAppBusinessAccount"("businessId");

-- CreateIndex
CREATE INDEX "WhatsAppBusinessAccount_businessAccountId_idx" ON "WhatsAppBusinessAccount"("businessAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppBusinessAccount_phoneNumberId_key" ON "WhatsAppBusinessAccount"("phoneNumberId");

-- AddForeignKey
ALTER TABLE "WhatsAppBusinessAccount" ADD CONSTRAINT "WhatsAppBusinessAccount_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
