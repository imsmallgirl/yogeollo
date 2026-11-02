-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'STALE', 'REJECTED');

-- CreateEnum
CREATE TYPE "DomesticAvailability" AS ENUM ('UNKNOWN', 'LISTED', 'IN_STOCK', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('UNKNOWN', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "KoreanEdition" AS ENUM ('UNKNOWN', 'CONFIRMED', 'NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "LanguageDependency" AS ENUM ('UNKNOWN', 'NONE', 'LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'EASY', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "MoodTag" AS ENUM ('PARTY', 'STRATEGY', 'DEDUCTION', 'COOPERATIVE', 'RELAXED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('DOMESTIC_DISTRIBUTOR', 'PUBLISHER', 'PUBLIC_DATA', 'BGG');

-- CreateEnum
CREATE TYPE "UsageStatus" AS ENUM ('FACTS_ONLY', 'PERMISSION_GRANTED', 'OPEN_LICENSE', 'UNCONFIRMED');

-- CreateTable
CREATE TABLE "BoardGame" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "nameKo" TEXT NOT NULL,
    "nameEn" TEXT,
    "editionNote" TEXT NOT NULL,
    "minPlayers" INTEGER NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "minPlayTime" INTEGER NOT NULL,
    "maxPlayTime" INTEGER NOT NULL,
    "averagePlayTime" INTEGER,
    "complexity" DECIMAL(4,2),
    "complexityScale" TEXT,
    "koreanEdition" "KoreanEdition" NOT NULL DEFAULT 'UNKNOWN',
    "domesticAvailability" "DomesticAvailability" NOT NULL DEFAULT 'UNKNOWN',
    "domesticPlayStatus" "EvidenceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "domesticPopularityStatus" "EvidenceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "lastVerifiedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "BoardGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameEditorial" (
    "id" UUID NOT NULL,
    "boardGameId" UUID NOT NULL,
    "bestPlayers" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mechanics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "moodTags" "MoodTag"[] DEFAULT ARRAY[]::"MoodTag"[],
    "difficulty" "Difficulty",
    "languageDependency" "LanguageDependency" NOT NULL DEFAULT 'UNKNOWN',
    "descriptionKo" TEXT,
    "setupKo" TEXT,
    "howToPlayKo" TEXT,
    "victoryKo" TEXT,
    "recommendedForKo" TEXT,
    "cautionsKo" TEXT,
    "rationaleKo" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GameEditorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSource" (
    "id" UUID NOT NULL,
    "boardGameId" UUID NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "verifiedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GameSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceObservation" (
    "id" UUID NOT NULL,
    "gameSourceId" UUID NOT NULL,
    "verifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "checkedFields" TEXT[],
    "observedFacts" JSONB NOT NULL,
    "collectionMethod" TEXT NOT NULL,
    "reviewedBy" TEXT NOT NULL,
    "evidenceNoteKo" TEXT NOT NULL,
    "usageStatus" "UsageStatus" NOT NULL DEFAULT 'UNCONFIRMED',
    "usageNoteKo" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalGameId" (
    "id" UUID NOT NULL,
    "boardGameId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,

    CONSTRAINT "ExternalGameId_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BoardGame_slug_key" ON "BoardGame"("slug");

-- CreateIndex
CREATE INDEX "BoardGame_verificationStatus_domesticAvailability_idx" ON "BoardGame"("verificationStatus", "domesticAvailability");

-- CreateIndex
CREATE INDEX "BoardGame_minPlayers_maxPlayers_idx" ON "BoardGame"("minPlayers", "maxPlayers");

-- CreateIndex
CREATE INDEX "BoardGame_minPlayTime_maxPlayTime_idx" ON "BoardGame"("minPlayTime", "maxPlayTime");

-- CreateIndex
CREATE UNIQUE INDEX "GameEditorial_boardGameId_key" ON "GameEditorial"("boardGameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameSource_boardGameId_sourceUrl_key" ON "GameSource"("boardGameId", "sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "SourceObservation_gameSourceId_verifiedAt_key" ON "SourceObservation"("gameSourceId", "verifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalGameId_provider_externalId_key" ON "ExternalGameId"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalGameId_boardGameId_provider_key" ON "ExternalGameId"("boardGameId", "provider");

-- AddForeignKey
ALTER TABLE "GameEditorial" ADD CONSTRAINT "GameEditorial_boardGameId_fkey" FOREIGN KEY ("boardGameId") REFERENCES "BoardGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSource" ADD CONSTRAINT "GameSource_boardGameId_fkey" FOREIGN KEY ("boardGameId") REFERENCES "BoardGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceObservation" ADD CONSTRAINT "SourceObservation_gameSourceId_fkey" FOREIGN KEY ("gameSourceId") REFERENCES "GameSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalGameId" ADD CONSTRAINT "ExternalGameId_boardGameId_fkey" FOREIGN KEY ("boardGameId") REFERENCES "BoardGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain constraints are intentionally maintained in SQL, not just in Zod.
ALTER TABLE "BoardGame"
  ADD CONSTRAINT "BoardGame_players_check" CHECK ("minPlayers" > 0 AND "maxPlayers" >= "minPlayers"),
  ADD CONSTRAINT "BoardGame_time_check" CHECK ("minPlayTime" > 0 AND "maxPlayTime" >= "minPlayTime"),
  ADD CONSTRAINT "BoardGame_average_check" CHECK ("averagePlayTime" IS NULL OR "averagePlayTime" BETWEEN "minPlayTime" AND "maxPlayTime"),
  ADD CONSTRAINT "BoardGame_complexity_check" CHECK (
    (("complexity" IS NULL) = ("complexityScale" IS NULL)) AND
    ("complexity" IS NULL OR ("complexity" > 0 AND "complexity" <> 'NaN'::numeric AND length(trim("complexityScale")) > 0))
  ),
  ADD CONSTRAINT "BoardGame_verified_date_check" CHECK ("verificationStatus" <> 'VERIFIED' OR "lastVerifiedAt" IS NOT NULL),
  ADD CONSTRAINT "BoardGame_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ADD CONSTRAINT "BoardGame_name_check" CHECK (length(trim("nameKo")) > 0 AND length(trim("editionNote")) > 0);

ALTER TABLE "GameEditorial"
  ALTER COLUMN "bestPlayers" SET NOT NULL,
  ALTER COLUMN "categories" SET NOT NULL,
  ALTER COLUMN "mechanics" SET NOT NULL,
  ALTER COLUMN "moodTags" SET NOT NULL,
  ADD CONSTRAINT "GameEditorial_verified_date_check" CHECK ("verificationStatus" <> 'VERIFIED' OR "reviewedAt" IS NOT NULL);

ALTER TABLE "SourceObservation"
  ALTER COLUMN "checkedFields" SET NOT NULL,
  ADD CONSTRAINT "SourceObservation_fields_check" CHECK (cardinality("checkedFields") > 0 AND array_position("checkedFields", NULL) IS NULL),
  ADD CONSTRAINT "SourceObservation_facts_check" CHECK (jsonb_typeof("observedFacts") = 'object');

-- Both sides enforce the player invariant, including later edits of game limits.
CREATE FUNCTION yogeollo_valid_best_players(players integer[], minimum integer, maximum integer)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(bool_and(player BETWEEN minimum AND maximum), true)
    AND count(*) = count(DISTINCT player)
  FROM unnest(players) AS player;
$$;

CREATE FUNCTION yogeollo_check_editorial_players() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE minimum integer; maximum integer;
BEGIN
  SELECT "minPlayers", "maxPlayers" INTO minimum, maximum
    FROM "BoardGame" WHERE "id" = NEW."boardGameId" FOR UPDATE;
  IF NOT yogeollo_valid_best_players(NEW."bestPlayers", minimum, maximum) THEN
    RAISE EXCEPTION 'bestPlayers must be distinct and within the player range' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "GameEditorial_players_check"
BEFORE INSERT OR UPDATE OF "bestPlayers", "boardGameId" ON "GameEditorial"
FOR EACH ROW EXECUTE FUNCTION yogeollo_check_editorial_players();

CREATE FUNCTION yogeollo_check_game_players() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "GameEditorial" WHERE "boardGameId" = NEW."id"
      AND NOT yogeollo_valid_best_players("bestPlayers", NEW."minPlayers", NEW."maxPlayers")
  ) THEN
    RAISE EXCEPTION 'player range would invalidate bestPlayers' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "BoardGame_editorial_players_check"
BEFORE UPDATE OF "minPlayers", "maxPlayers" ON "BoardGame"
FOR EACH ROW EXECUTE FUNCTION yogeollo_check_game_players();
