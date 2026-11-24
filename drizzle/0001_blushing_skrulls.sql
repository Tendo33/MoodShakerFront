ALTER TABLE "drinks" ADD COLUMN "mood" text;--> statement-breakpoint
UPDATE "drinks" SET "mood" = "order"->>'mood' WHERE "mood" IS NULL;--> statement-breakpoint
ALTER TABLE "drinks" ALTER COLUMN "mood" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "drinks_mood_idx" ON "drinks" USING btree ("mood");
