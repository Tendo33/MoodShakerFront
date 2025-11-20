-- CreateTable
CREATE TABLE "cocktails" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "english_name" TEXT,
    "description" TEXT NOT NULL,
    "english_description" TEXT,
    "match_reason" TEXT,
    "english_match_reason" TEXT,
    "base_spirit" TEXT NOT NULL,
    "english_base_spirit" TEXT,
    "alcohol_level" TEXT NOT NULL,
    "english_alcohol_level" TEXT,
    "serving_glass" TEXT NOT NULL,
    "english_serving_glass" TEXT,
    "time_required" TEXT NOT NULL,
    "english_time_required" TEXT,
    "flavor_profiles" TEXT[],
    "english_flavor_profiles" TEXT[],
    "ingredients" JSONB NOT NULL,
    "tools" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cocktails_pkey" PRIMARY KEY ("id")
);
