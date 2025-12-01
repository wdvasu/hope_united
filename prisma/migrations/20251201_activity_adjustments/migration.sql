-- Create ActivityAdjustment table for absolute per-day category overrides
CREATE TABLE "ActivityAdjustment" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "day" TIMESTAMP WITH TIME ZONE NOT NULL,
  "category" TEXT NOT NULL,
  "value" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ActivityAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ActivityAdjustment_day_category_key" ON "ActivityAdjustment" ("day", "category");

-- Trigger to auto-update updatedAt on row modification (Postgres)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_activityadjustment_updated_at
BEFORE UPDATE ON "ActivityAdjustment"
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();
