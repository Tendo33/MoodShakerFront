-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PRIVATE', 'PUBLISHED');

-- CreateTable
CREATE TABLE "recommendation_sessions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "edit_token" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "agent_type" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "base_spirits" TEXT[],
    "special_requests" TEXT,
    "cocktail_payload" JSONB NOT NULL,
    "image" TEXT,
    "thumbnail" TEXT,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PRIVATE',
    "published_cocktail_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_sessions_edit_token_key" ON "recommendation_sessions"("edit_token");

-- CreateIndex
CREATE INDEX "idx_recommendation_session_session_id" ON "recommendation_sessions"("session_id");

-- CreateIndex
CREATE INDEX "idx_recommendation_session_status_created_at" ON "recommendation_sessions"("status", "created_at");

-- AddForeignKey
ALTER TABLE "recommendation_sessions"
ADD CONSTRAINT "recommendation_sessions_published_cocktail_id_fkey"
FOREIGN KEY ("published_cocktail_id") REFERENCES "cocktails"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
