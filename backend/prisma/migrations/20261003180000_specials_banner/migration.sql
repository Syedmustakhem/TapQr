-- TapQR Today's Specials Banner (Pro feature #2) — already applied on Neon.
ALTER TABLE "BusinessProfile"
  ADD COLUMN IF NOT EXISTS "specialsBannerEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "BusinessProfile"
  ADD COLUMN IF NOT EXISTS "specialsTitle" TEXT;

ALTER TABLE "BusinessProfile"
  ADD COLUMN IF NOT EXISTS "specialsDescription" TEXT;

ALTER TABLE "BusinessProfile"
  ADD COLUMN IF NOT EXISTS "specialsValidUntil" TIMESTAMPTZ;

UPDATE "Plan"
SET "features" =
  COALESCE("features", '[]'::jsonb) || '"specials_banner"'::jsonb
WHERE "code" IN ('PRO_MONTHLY', 'PRO_YEARLY')
  AND NOT (COALESCE("features", '[]'::jsonb) ? 'specials_banner');
