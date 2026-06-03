CREATE TYPE "public"."application_status" AS ENUM('applied', 'interview', 'rejected', 'no_response');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"job_title" text NOT NULL,
	"job_description" text NOT NULL,
	"job_url" text,
	"job_hash" text NOT NULL,
	"status" "application_status" DEFAULT 'applied' NOT NULL,
	"match_score" integer DEFAULT 0 NOT NULL,
	"cv_sent" text NOT NULL,
	"cover_letter" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"master_cv_text" text DEFAULT '' NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_cv" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" text NOT NULL,
	"storage_path" text NOT NULL,
	"extracted_text" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
