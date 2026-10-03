-- TapQR Digital Loyalty Card (Pro feature #3) — already applied on Neon.
ALTER TABLE "BusinessProfile"
  ADD COLUMN IF NOT EXISTS "loyaltyCardEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "BusinessProfile"
  ADD COLUMN IF NOT EXISTS "loyaltyCardTitle" TEXT;

ALTER TABLE "BusinessProfile"
  ADD COLUMN IF NOT EXISTS "loyaltyStampsRequired" INTEGER;

ALTER TABLE "BusinessProfile"
  ADD COLUMN IF NOT EXISTS "loyaltyRewardDescription" TEXT;

UPDATE "Plan"
SET "features" =
  COALESCE("features", '[]'::jsonb) || '"loyalty_card"'::jsonb
WHERE "code" IN ('PRO_MONTHLY', 'PRO_YEARLY')
  AND NOT (COALESCE("features", '[]'::jsonb) ? 'loyalty_card');
