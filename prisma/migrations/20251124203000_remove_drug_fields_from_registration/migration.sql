-- Drop drug-related columns from Registration
ALTER TABLE "Registration" DROP COLUMN IF EXISTS "drugs";
ALTER TABLE "Registration" DROP COLUMN IF EXISTS "drugOther";
