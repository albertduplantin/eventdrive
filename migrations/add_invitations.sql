CREATE TABLE IF NOT EXISTS "festival_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"festival_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"role" "user_role",
	"max_uses" integer DEFAULT 0,
	"used_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "festival_invitations_code_unique" UNIQUE("code"),
	CONSTRAINT "festival_invitations_festival_id_festivals_id_fk" FOREIGN KEY ("festival_id") REFERENCES "public"."festivals"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "festival_invitations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action
);
CREATE INDEX IF NOT EXISTS "invitation_festival_id_idx" ON "festival_invitations" USING btree ("festival_id");
CREATE INDEX IF NOT EXISTS "invitation_code_idx" ON "festival_invitations" USING btree ("code");
