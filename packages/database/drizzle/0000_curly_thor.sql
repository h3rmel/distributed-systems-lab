CREATE TABLE "webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(255) NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "provider_idx" ON "webhook_events" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "event_id_idx" ON "webhook_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "timestamp_idx" ON "webhook_events" USING btree ("timestamp");