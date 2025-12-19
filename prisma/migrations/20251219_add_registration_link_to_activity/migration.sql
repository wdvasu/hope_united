-- Add link from Activity to Registration (nullable for existing rows)
ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "registrationId" TEXT;

-- Foreign key to Registration
DO 48585 BEGIN
  ALTER TABLE "Activity" ADD CONSTRAINT "Activity_registrationId_fkey"
    FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END 48585;

-- Helpful indexes for reporting
CREATE INDEX IF NOT EXISTS "Activity_createdAt_idx" ON "Activity" ("createdAt");
CREATE INDEX IF NOT EXISTS "Activity_registrationId_createdAt_idx" ON "Activity" ("registrationId", "createdAt");
