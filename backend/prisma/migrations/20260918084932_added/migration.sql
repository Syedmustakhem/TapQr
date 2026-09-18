-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "businessType" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'India',
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subcategory" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
ADD COLUMN     "website" TEXT,
ADD COLUMN     "whatsapp" TEXT;

-- CreateIndex
CREATE INDEX "Business_industry_idx" ON "Business"("industry");

-- CreateIndex
CREATE INDEX "Business_category_idx" ON "Business"("category");

-- CreateIndex
CREATE INDEX "Business_country_idx" ON "Business"("country");

-- CreateIndex
CREATE INDEX "Business_isVerified_idx" ON "Business"("isVerified");

-- CreateIndex
CREATE INDEX "Business_isPublished_idx" ON "Business"("isPublished");

-- CreateIndex
CREATE INDEX "Business_onboardingCompleted_idx" ON "Business"("onboardingCompleted");

-- CreateIndex
CREATE INDEX "BusinessProfile_country_idx" ON "BusinessProfile"("country");
