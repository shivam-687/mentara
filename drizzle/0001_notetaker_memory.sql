CREATE TABLE "class_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"mode" varchar(20) DEFAULT 'auto' NOT NULL,
	"auto_generate" boolean DEFAULT true NOT NULL,
	"status" varchar(20) DEFAULT 'idle' NOT NULL,
	"title" varchar(500),
	"summary" text,
	"markdown" text,
	"key_takeaways" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"glossary" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"action_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"timeline" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"generated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "class_notes_class_id_unique" UNIQUE("class_id")
);
--> statement-breakpoint
ALTER TABLE "class_notes" ADD CONSTRAINT "class_notes_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
