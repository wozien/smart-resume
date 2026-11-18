CREATE TABLE "resume_overviews" (
	"user_id" text PRIMARY KEY NOT NULL,
	"basics" jsonb NOT NULL,
	"work" jsonb NOT NULL,
	"projects" jsonb NOT NULL,
	"education" jsonb NOT NULL,
	"skills" jsonb NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resume_overviews" ADD CONSTRAINT "resume_overviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;