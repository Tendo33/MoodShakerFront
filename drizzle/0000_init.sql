CREATE TABLE "drinks" (
	"id" text PRIMARY KEY NOT NULL,
	"edit_token_hash" text,
	"order" jsonb,
	"recipe" jsonb NOT NULL,
	"base_spirit" text NOT NULL,
	"image_url" text,
	"thumbnail_url" text,
	"slug" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drinks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "drinks_published_idx" ON "drinks" USING btree ("published_at" DESC NULLS LAST,"id" DESC NULLS LAST) WHERE "drinks"."published_at" is not null;--> statement-breakpoint
CREATE INDEX "drinks_base_spirit_idx" ON "drinks" USING btree ("base_spirit");--> statement-breakpoint
CREATE INDEX "rate_limits_reset_at_idx" ON "rate_limits" USING btree ("reset_at");