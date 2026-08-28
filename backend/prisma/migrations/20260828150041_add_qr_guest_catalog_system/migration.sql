-- CreateEnum
CREATE TYPE "QRExperienceType" AS ENUM ('BUSINESS', 'CATALOG', 'MENU', 'SERVICES', 'PRODUCTS', 'CONTACT', 'REDIRECT');

-- CreateEnum
CREATE TYPE "CatalogType" AS ENUM ('GENERAL', 'MENU', 'PRODUCTS', 'SERVICES', 'PACKAGES', 'OFFERS');

-- CreateEnum
CREATE TYPE "CatalogItemType" AS ENUM ('PRODUCT', 'MENU_ITEM', 'SERVICE', 'PACKAGE', 'OFFER');

-- AlterTable
ALTER TABLE "QRCode" ADD COLUMN     "enabledSections" JSONB,
ADD COLUMN     "experienceType" "QRExperienceType" NOT NULL DEFAULT 'BUSINESS',
ALTER COLUMN "destinationUrl" DROP NOT NULL;

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'India',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "openingHours" JSONB,
    "socialLinks" JSONB,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRBranding" (
    "id" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "backgroundColor" TEXT,
    "qrForegroundColor" TEXT,
    "qrBackgroundColor" TEXT,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "buttonStyle" TEXT,
    "fontFamily" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRBranding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Catalog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CatalogType" NOT NULL DEFAULT 'GENERAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogCategory" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CatalogItemType" NOT NULL DEFAULT 'PRODUCT',
    "price" DECIMAL(12,2),
    "compareAtPrice" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "image" TEXT,
    "gallery" JSONB,
    "sku" TEXT,
    "unit" TEXT,
    "stock" DECIMAL(12,3),
    "durationMinutes" INTEGER,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItemVariant" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2),
    "compareAtPrice" DECIMAL(12,2),
    "sku" TEXT,
    "stock" DECIMAL(12,3),
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItemVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItemOptionGroup" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItemOptionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItemOption" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItemOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_businessId_key" ON "BusinessProfile"("businessId");

-- CreateIndex
CREATE INDEX "BusinessProfile_city_idx" ON "BusinessProfile"("city");

-- CreateIndex
CREATE INDEX "BusinessProfile_state_idx" ON "BusinessProfile"("state");

-- CreateIndex
CREATE UNIQUE INDEX "QRBranding_qrCodeId_key" ON "QRBranding"("qrCodeId");

-- CreateIndex
CREATE INDEX "Catalog_businessId_idx" ON "Catalog"("businessId");

-- CreateIndex
CREATE INDEX "Catalog_businessId_isActive_idx" ON "Catalog"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "Catalog_businessId_sortOrder_idx" ON "Catalog"("businessId", "sortOrder");

-- CreateIndex
CREATE INDEX "CatalogCategory_catalogId_idx" ON "CatalogCategory"("catalogId");

-- CreateIndex
CREATE INDEX "CatalogCategory_catalogId_isActive_idx" ON "CatalogCategory"("catalogId", "isActive");

-- CreateIndex
CREATE INDEX "CatalogCategory_catalogId_sortOrder_idx" ON "CatalogCategory"("catalogId", "sortOrder");

-- CreateIndex
CREATE INDEX "CatalogItem_categoryId_idx" ON "CatalogItem"("categoryId");

-- CreateIndex
CREATE INDEX "CatalogItem_categoryId_isAvailable_idx" ON "CatalogItem"("categoryId", "isAvailable");

-- CreateIndex
CREATE INDEX "CatalogItem_type_idx" ON "CatalogItem"("type");

-- CreateIndex
CREATE INDEX "CatalogItem_sku_idx" ON "CatalogItem"("sku");

-- CreateIndex
CREATE INDEX "CatalogItem_createdAt_idx" ON "CatalogItem"("createdAt");

-- CreateIndex
CREATE INDEX "CatalogItemVariant_itemId_idx" ON "CatalogItemVariant"("itemId");

-- CreateIndex
CREATE INDEX "CatalogItemVariant_itemId_isAvailable_idx" ON "CatalogItemVariant"("itemId", "isAvailable");

-- CreateIndex
CREATE INDEX "CatalogItemVariant_sku_idx" ON "CatalogItemVariant"("sku");

-- CreateIndex
CREATE INDEX "CatalogItemOptionGroup_itemId_idx" ON "CatalogItemOptionGroup"("itemId");

-- CreateIndex
CREATE INDEX "CatalogItemOption_groupId_idx" ON "CatalogItemOption"("groupId");

-- CreateIndex
CREATE INDEX "AuthProvider_providerUserId_idx" ON "AuthProvider"("providerUserId");

-- CreateIndex
CREATE INDEX "Business_createdAt_idx" ON "Business"("createdAt");

-- CreateIndex
CREATE INDEX "BusinessMember_status_idx" ON "BusinessMember"("status");

-- CreateIndex
CREATE INDEX "OtpVerification_consumed_idx" ON "OtpVerification"("consumed");

-- CreateIndex
CREATE INDEX "QRCode_experienceType_idx" ON "QRCode"("experienceType");

-- CreateIndex
CREATE INDEX "QRCode_businessId_status_idx" ON "QRCode"("businessId", "status");

-- CreateIndex
CREATE INDEX "ScanEvent_qrCodeId_scannedAt_idx" ON "ScanEvent"("qrCodeId", "scannedAt");

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRBranding" ADD CONSTRAINT "QRBranding_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catalog" ADD CONSTRAINT "Catalog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogCategory" ADD CONSTRAINT "CatalogCategory_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CatalogCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItemVariant" ADD CONSTRAINT "CatalogItemVariant_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItemOptionGroup" ADD CONSTRAINT "CatalogItemOptionGroup_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItemOption" ADD CONSTRAINT "CatalogItemOption_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CatalogItemOptionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
