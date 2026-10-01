-- CreateTable
CREATE TABLE "WhatsAppBotConfig" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "autoReplyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "aiReplyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "welcomeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "menuEnabled" BOOLEAN NOT NULL DEFAULT true,
    "humanHandoffEnabled" BOOLEAN NOT NULL DEFAULT true,
    "otpEnabled" BOOLEAN NOT NULL DEFAULT true,
    "welcomeMessage" TEXT,
    "fallbackMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppBotConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppBotConfig_businessId_key" ON "WhatsAppBotConfig"("businessId");

-- CreateIndex
CREATE INDEX "WhatsAppBotConfig_businessId_idx" ON "WhatsAppBotConfig"("businessId");

-- CreateIndex
CREATE INDEX "WhatsAppBotConfig_enabled_idx" ON "WhatsAppBotConfig"("enabled");

-- AddForeignKey
ALTER TABLE "WhatsAppBotConfig" ADD CONSTRAINT "WhatsAppBotConfig_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
