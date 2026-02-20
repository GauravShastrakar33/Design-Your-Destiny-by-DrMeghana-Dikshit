CREATE TABLE "goldmine_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"r2_key" text NOT NULL,
	"thumbnail_key" text NOT NULL,
	"duration_sec" integer,
	"size_mb" integer,
	"tags" varchar[] DEFAULT '{}' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_goldmine_videos_created_at" ON "goldmine_videos" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_goldmine_videos_is_published" ON "goldmine_videos" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "idx_goldmine_videos_tags" ON "goldmine_videos" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "idx_notification_logs_user_unread" ON "notification_logs" USING btree ("user_id","is_read");