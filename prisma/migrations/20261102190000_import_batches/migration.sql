-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED');

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" UUID NOT NULL,
    "digest" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "baseState" JSONB NOT NULL,
    "plan" JSONB NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMPTZ(3),
    "appliedAt" TIMESTAMPTZ(3),
    "result" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatch_digest_key" ON "ImportBatch"("digest");

-- CreateIndex
CREATE INDEX "ImportBatch_status_createdAt_idx" ON "ImportBatch"("status", "createdAt");

ALTER TABLE "ImportBatch"
  ADD CONSTRAINT "ImportBatch_digest_check" CHECK ("digest" ~ '^[a-f0-9]{64}$'),
  ADD CONSTRAINT "ImportBatch_json_check" CHECK (jsonb_typeof("payload") = 'object' AND jsonb_typeof("baseState") = 'object' AND jsonb_typeof("plan") = 'object'),
  ADD CONSTRAINT "ImportBatch_state_check" CHECK (
    ("status" = 'PENDING' AND "reviewedBy" IS NULL AND "reviewNotes" IS NULL AND "reviewedAt" IS NULL AND "appliedAt" IS NULL AND "result" IS NULL) OR
    ("status" IN ('APPROVED', 'REJECTED') AND "reviewedBy" IS NOT NULL AND "reviewNotes" IS NOT NULL AND length(trim("reviewedBy")) > 0 AND length(trim("reviewNotes")) > 0 AND "reviewedAt" IS NOT NULL AND "appliedAt" IS NULL AND "result" IS NULL) OR
    ("status" = 'APPLIED' AND "reviewedBy" IS NOT NULL AND "reviewNotes" IS NOT NULL AND length(trim("reviewedBy")) > 0 AND length(trim("reviewNotes")) > 0 AND "reviewedAt" IS NOT NULL AND "appliedAt" IS NOT NULL AND "result" IS NOT NULL)
  );

CREATE FUNCTION yogeollo_guard_import_batch() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'import history cannot be deleted' USING ERRCODE = '23514';
  END IF;
  IF NEW."id" IS DISTINCT FROM OLD."id" OR NEW."digest" IS DISTINCT FROM OLD."digest"
    OR NEW."payload" IS DISTINCT FROM OLD."payload" OR NEW."baseState" IS DISTINCT FROM OLD."baseState"
    OR NEW."plan" IS DISTINCT FROM OLD."plan" OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt" THEN
    RAISE EXCEPTION 'staged content and base state are immutable' USING ERRCODE = '23514';
  END IF;
  IF OLD."status" = 'PENDING' AND NEW."status" IN ('APPROVED', 'REJECTED') THEN RETURN NEW; END IF;
  IF OLD."status" = 'APPROVED' AND NEW."status" = 'APPLIED'
    AND NEW."reviewedBy" IS NOT DISTINCT FROM OLD."reviewedBy"
    AND NEW."reviewNotes" IS NOT DISTINCT FROM OLD."reviewNotes"
    AND NEW."reviewedAt" IS NOT DISTINCT FROM OLD."reviewedAt" THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'invalid import state transition' USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER "ImportBatch_history_guard" BEFORE UPDATE OR DELETE ON "ImportBatch"
FOR EACH ROW EXECUTE FUNCTION yogeollo_guard_import_batch();

CREATE FUNCTION yogeollo_guard_source_observation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'source observations are append-only' USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER "SourceObservation_history_guard" BEFORE UPDATE OR DELETE ON "SourceObservation"
FOR EACH ROW EXECUTE FUNCTION yogeollo_guard_source_observation();
