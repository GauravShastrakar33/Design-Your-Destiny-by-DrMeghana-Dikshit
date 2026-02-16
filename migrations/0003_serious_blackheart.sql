ALTER TABLE "session_banners" ALTER COLUMN "start_at" SET DATA TYPE timestamp with time zone USING "start_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "session_banners" ALTER COLUMN "end_at" SET DATA TYPE timestamp with time zone USING "end_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "session_banners" ALTER COLUMN "live_start_at" SET DATA TYPE timestamp with time zone USING "live_start_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "session_banners" ALTER COLUMN "live_end_at" SET DATA TYPE timestamp with time zone USING "live_end_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "session_banners" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "session_banners" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "session_banners" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "session_banners" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "session_banners" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_default_banner" ON "session_banners" USING btree ("is_default") WHERE "session_banners"."is_default" = true;