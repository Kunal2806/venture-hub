CREATE TYPE "public"."application_status" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."deal_stage" AS ENUM('EOI_SENT', 'EOI_ACCEPTED', 'IN_DISCUSSION', 'DUE_DILIGENCE', 'TERM_SHEET', 'CLOSED', 'DROPPED');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."eoi_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."funding_stage" AS ENUM('IDEA', 'PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'GROWTH');--> statement-breakpoint
CREATE TYPE "public"."investor_type" AS ENUM('ANGEL', 'VENTURE_CAPITAL', 'PRIVATE_EQUITY', 'CORPORATE', 'FAMILY_OFFICE', 'ACCELERATOR');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('EMAIL', 'IN_APP', 'PUSH');--> statement-breakpoint
CREATE TYPE "public"."notification_event" AS ENUM('EOI_RECEIVED', 'EOI_ACCEPTED', 'EOI_REJECTED', 'SESSION_BOOKED', 'SESSION_ACCEPTED', 'SESSION_DECLINED', 'SESSION_COMPLETED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PROFILE_APPROVED', 'PROFILE_REJECTED', 'MESSAGE_RECEIVED', 'PROFILE_SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('STARTUP_REGISTRATION', 'INVESTOR_MEMBERSHIP', 'MENTOR_SESSION');--> statement-breakpoint
CREATE TYPE "public"."session_format" AS ENUM('VIDEO_CALL', 'ASYNC_REVIEW', 'IN_PERSON');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('REQUESTED', 'ACCEPTED', 'DECLINED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'STARTUP', 'INVESTOR', 'MENTOR');--> statement-breakpoint
CREATE TABLE "admin_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"target_user_id" uuid,
	"action_type" text NOT NULL,
	"target_type" text,
	"target_id" uuid,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"event_type" text NOT NULL,
	"resource_type" text,
	"resource_id" uuid,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"eoi_id" uuid NOT NULL,
	"investor_user_id" uuid NOT NULL,
	"startup_user_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_eoi_id_unique" UNIQUE("eoi_id")
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raised_by" uuid NOT NULL,
	"against_user_id" uuid,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"status" "dispute_status" DEFAULT 'OPEN' NOT NULL,
	"resolution" text,
	"resolved_by" uuid,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eois" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"investor_id" uuid NOT NULL,
	"startup_id" uuid NOT NULL,
	"status" "eoi_status" DEFAULT 'PENDING' NOT NULL,
	"message" text,
	"rejection_reason" text,
	"deal_stage" "deal_stage" DEFAULT 'EOI_SENT' NOT NULL,
	"proposed_amount" numeric(15, 2),
	"proposed_equity" numeric(5, 2),
	"notes" text,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" uuid NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"approval_status" "approval_status" DEFAULT 'APPROVED' NOT NULL,
	"suspension_reason" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"verified_by" uuid,
	"firm_name" text,
	"designation" text,
	"bio" text,
	"website_url" text,
	"linkedin_url" text,
	"country" text,
	"city" text,
	"investor_type" "investor_type",
	"preferred_sectors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preferred_stages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preferred_geographies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ticket_size_min" numeric(15, 2),
	"ticket_size_max" numeric(15, 2),
	"investment_thesis" text,
	"impact_focused" boolean DEFAULT false NOT NULL,
	"total_investments" integer DEFAULT 0 NOT NULL,
	"total_portfolio_value" numeric(18, 2),
	"membership_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "investor_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "investor_watchlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"investor_id" uuid NOT NULL,
	"startup_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentor_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"mobile" text,
	"linkedin_url" text,
	"current_role" text NOT NULL,
	"company" text NOT NULL,
	"years_of_experience" integer NOT NULL,
	"domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bio" text,
	"status" "application_status" DEFAULT 'SUBMITTED' NOT NULL,
	"review_notes" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"created_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentor_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_pro_bono" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"approval_status" "approval_status" DEFAULT 'PENDING' NOT NULL,
	"suspension_reason" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"verified_by" uuid,
	"headline" text,
	"bio" text,
	"linkedin_url" text,
	"website_url" text,
	"country" text,
	"city" text,
	"domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"industries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"years_of_experience" integer,
	"previous_companies" text,
	"session_price_usd" numeric(10, 2),
	"session_duration_minutes" integer DEFAULT 60,
	"timezone" text,
	"is_available" boolean DEFAULT true NOT NULL,
	"total_sessions" integer DEFAULT 0 NOT NULL,
	"average_rating" numeric(3, 2),
	"total_ratings" integer DEFAULT 0 NOT NULL,
	"total_earnings" numeric(15, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mentor_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "mentor_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_id" uuid NOT NULL,
	"startup_id" uuid NOT NULL,
	"status" "session_status" DEFAULT 'REQUESTED' NOT NULL,
	"format" "session_format" DEFAULT 'VIDEO_CALL' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"scheduled_at" timestamp,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"video_call_link" text,
	"reschedule_reason" text,
	"rescheduled_at" timestamp,
	"agenda_note" text,
	"session_notes" text,
	"deliverables" text,
	"amount_usd" numeric(10, 2) NOT NULL,
	"platform_commission" numeric(10, 2),
	"mentor_earnings" numeric(10, 2),
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"attachment_url" text,
	"attachment_name" text,
	"attachment_size" integer,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event" "notification_event" NOT NULL,
	"channel" "notification_channel" DEFAULT 'IN_APP' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"resource_type" text,
	"resource_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" uuid NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"payment_type" "payment_type" NOT NULL,
	"status" "payment_status" DEFAULT 'CREATED' NOT NULL,
	"amount_usd" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"session_id" uuid,
	"startup_application_id" uuid,
	"investor_profile_id" uuid,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"razorpay_signature" text,
	"receipt_url" text,
	"receipt_sent_at" timestamp,
	"paid_at" timestamp,
	"failure_reason" text,
	"refunded_at" timestamp,
	"refund_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"rater_id" uuid NOT NULL,
	"ratee_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "startup_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_name" text NOT NULL,
	"email" text NOT NULL,
	"mobile" text,
	"company_name" text NOT NULL,
	"website_url" text,
	"sector" text NOT NULL,
	"stage" "funding_stage" NOT NULL,
	"country" text,
	"pitch_deck_url" text,
	"impact_description" text,
	"impact_metrics" text,
	"use_of_funds" text,
	"funding_period" text,
	"capital_requested" text,
	"status" "application_status" DEFAULT 'SUBMITTED' NOT NULL,
	"reviewed_by" uuid,
	"review_notes" text,
	"reviewed_at" timestamp,
	"created_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "startup_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"startup_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"title" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "startup_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"approval_status" "approval_status" DEFAULT 'PENDING' NOT NULL,
	"suspension_reason" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"verified_by" uuid,
	"is_featured" boolean DEFAULT false NOT NULL,
	"featured_until" timestamp,
	"profile_score" integer DEFAULT 0 NOT NULL,
	"company_name" text NOT NULL,
	"tagline" text,
	"description" text,
	"logo_url" text,
	"website_url" text,
	"country" text,
	"city" text,
	"sector" text NOT NULL,
	"industry" text,
	"stage" "funding_stage" NOT NULL,
	"founded_year" integer,
	"founders" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"problem_statement" text,
	"solution_description" text,
	"business_model" text,
	"unique_value_proposition" text,
	"target_market" text,
	"competitive_landscape" text,
	"revenue_monthly" numeric(15, 2),
	"revenue_annual" numeric(15, 2),
	"user_count" integer,
	"growth_rate" numeric(5, 2),
	"equity_offered" numeric(5, 2),
	"use_of_funds" text,
	"funding_deadline" timestamp,
	"previous_funding_total" numeric(15, 2),
	"impact_description" text,
	"sdg_goals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"profile_view_count" integer DEFAULT 0 NOT NULL,
	"eoi_received_count" integer DEFAULT 0 NOT NULL,
	"watchlist_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "startup_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"password" text NOT NULL,
	"mobile" text,
	"role" "user_role" NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_eoi_id_eois_id_fk" FOREIGN KEY ("eoi_id") REFERENCES "public"."eois"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_investor_user_id_users_id_fk" FOREIGN KEY ("investor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_startup_user_id_users_id_fk" FOREIGN KEY ("startup_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_raised_by_users_id_fk" FOREIGN KEY ("raised_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_against_user_id_users_id_fk" FOREIGN KEY ("against_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eois" ADD CONSTRAINT "eois_investor_id_investor_profiles_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."investor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eois" ADD CONSTRAINT "eois_startup_id_startup_profiles_id_fk" FOREIGN KEY ("startup_id") REFERENCES "public"."startup_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_profiles" ADD CONSTRAINT "investor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_profiles" ADD CONSTRAINT "investor_profiles_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_watchlist" ADD CONSTRAINT "investor_watchlist_investor_id_investor_profiles_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."investor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_watchlist" ADD CONSTRAINT "investor_watchlist_startup_id_startup_profiles_id_fk" FOREIGN KEY ("startup_id") REFERENCES "public"."startup_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_availability" ADD CONSTRAINT "mentor_availability_mentor_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_sessions" ADD CONSTRAINT "mentor_sessions_mentor_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_sessions" ADD CONSTRAINT "mentor_sessions_startup_id_startup_profiles_id_fk" FOREIGN KEY ("startup_id") REFERENCES "public"."startup_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_session_id_mentor_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."mentor_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_startup_application_id_startup_applications_id_fk" FOREIGN KEY ("startup_application_id") REFERENCES "public"."startup_applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_investor_profile_id_investor_profiles_id_fk" FOREIGN KEY ("investor_profile_id") REFERENCES "public"."investor_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_config" ADD CONSTRAINT "platform_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_ratings" ADD CONSTRAINT "session_ratings_session_id_mentor_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."mentor_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_ratings" ADD CONSTRAINT "session_ratings_rater_id_users_id_fk" FOREIGN KEY ("rater_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_ratings" ADD CONSTRAINT "session_ratings_ratee_id_users_id_fk" FOREIGN KEY ("ratee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "startup_documents" ADD CONSTRAINT "startup_documents_startup_id_startup_profiles_id_fk" FOREIGN KEY ("startup_id") REFERENCES "public"."startup_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "startup_profiles" ADD CONSTRAINT "startup_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "startup_profiles" ADD CONSTRAINT "startup_profiles_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_actions_admin_created_at_idx" ON "admin_actions" USING btree ("admin_id","created_at");--> statement-breakpoint
CREATE INDEX "admin_actions_target_user_idx" ON "admin_actions" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "admin_actions_action_type_created_at_idx" ON "admin_actions" USING btree ("action_type","created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_type_created_at_idx" ON "analytics_events" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_resource_idx" ON "analytics_events" USING btree ("resource_type","resource_id","created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_user_created_at_idx" ON "analytics_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "conversations_investor_last_msg_idx" ON "conversations" USING btree ("investor_user_id","last_message_at");--> statement-breakpoint
CREATE INDEX "conversations_startup_last_msg_idx" ON "conversations" USING btree ("startup_user_id","last_message_at");--> statement-breakpoint
CREATE INDEX "disputes_raised_by_idx" ON "disputes" USING btree ("raised_by");--> statement-breakpoint
CREATE INDEX "disputes_open_created_at_idx" ON "disputes" USING btree ("created_at") WHERE status = 'OPEN';--> statement-breakpoint
CREATE UNIQUE INDEX "eois_investor_startup_key" ON "eois" USING btree ("investor_id","startup_id");--> statement-breakpoint
CREATE INDEX "eois_startup_status_idx" ON "eois" USING btree ("startup_id","status");--> statement-breakpoint
CREATE INDEX "eois_investor_deal_stage_idx" ON "eois" USING btree ("investor_id","deal_stage");--> statement-breakpoint
CREATE INDEX "eois_pending_sent_at_idx" ON "eois" USING btree ("sent_at") WHERE status = 'PENDING';--> statement-breakpoint
CREATE UNIQUE INDEX "email_verification_tokens_email_token_key" ON "email_verification_tokens" USING btree ("email","token");--> statement-breakpoint
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "investor_profiles_approval_status_idx" ON "investor_profiles" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "investor_profiles_type_idx" ON "investor_profiles" USING btree ("investor_type");--> statement-breakpoint
CREATE INDEX "investor_profiles_verified_idx" ON "investor_profiles" USING btree ("is_verified") WHERE is_verified = true;--> statement-breakpoint
CREATE INDEX "investor_profiles_membership_expires_idx" ON "investor_profiles" USING btree ("membership_expires_at");--> statement-breakpoint
CREATE INDEX "investor_profiles_sectors_gin_idx" ON "investor_profiles" USING gin ("preferred_sectors");--> statement-breakpoint
CREATE INDEX "investor_profiles_stages_gin_idx" ON "investor_profiles" USING gin ("preferred_stages");--> statement-breakpoint
CREATE UNIQUE INDEX "investor_watchlist_investor_startup_key" ON "investor_watchlist" USING btree ("investor_id","startup_id");--> statement-breakpoint
CREATE INDEX "investor_watchlist_investor_id_idx" ON "investor_watchlist" USING btree ("investor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mentor_applications_email_key" ON "mentor_applications" USING btree ("email");--> statement-breakpoint
CREATE INDEX "mentor_applications_status_created_at_idx" ON "mentor_applications" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "mentor_availability_mentor_day_idx" ON "mentor_availability" USING btree ("mentor_id","day_of_week");--> statement-breakpoint
CREATE INDEX "mentor_profiles_approval_status_idx" ON "mentor_profiles" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "mentor_profiles_available_rating_idx" ON "mentor_profiles" USING btree ("average_rating") WHERE is_available = true;--> statement-breakpoint
CREATE INDEX "mentor_profiles_price_idx" ON "mentor_profiles" USING btree ("session_price_usd");--> statement-breakpoint
CREATE INDEX "mentor_profiles_verified_idx" ON "mentor_profiles" USING btree ("is_verified") WHERE is_verified = true;--> statement-breakpoint
CREATE INDEX "mentor_profiles_domains_gin_idx" ON "mentor_profiles" USING gin ("domains");--> statement-breakpoint
CREATE INDEX "mentor_sessions_mentor_scheduled_idx" ON "mentor_sessions" USING btree ("mentor_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "mentor_sessions_startup_status_idx" ON "mentor_sessions" USING btree ("startup_id","status");--> statement-breakpoint
CREATE INDEX "mentor_sessions_completed_idx" ON "mentor_sessions" USING btree ("completed_at") WHERE status = 'COMPLETED';--> statement-breakpoint
CREATE INDEX "messages_conversation_created_at_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_unread_idx" ON "messages" USING btree ("conversation_id","sender_id") WHERE is_read = false;--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","created_at") WHERE is_read = false;--> statement-breakpoint
CREATE INDEX "notifications_user_created_at_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_tokens_email_token_key" ON "password_reset_tokens" USING btree ("email","token");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "payments_user_created_at_idx" ON "payments" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_razorpay_order_id_key" ON "payments" USING btree ("razorpay_order_id");--> statement-breakpoint
CREATE INDEX "payments_type_status_paid_at_idx" ON "payments" USING btree ("payment_type","status","paid_at");--> statement-breakpoint
CREATE INDEX "payments_session_id_idx" ON "payments" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "payments_pending_idx" ON "payments" USING btree ("created_at") WHERE status = 'PENDING';--> statement-breakpoint
CREATE UNIQUE INDEX "platform_config_key_key" ON "platform_config" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "session_ratings_session_rater_key" ON "session_ratings" USING btree ("session_id","rater_id");--> statement-breakpoint
CREATE INDEX "session_ratings_ratee_id_idx" ON "session_ratings" USING btree ("ratee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "startup_applications_email_key" ON "startup_applications" USING btree ("email");--> statement-breakpoint
CREATE INDEX "startup_applications_status_created_at_idx" ON "startup_applications" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "startup_documents_startup_id_idx" ON "startup_documents" USING btree ("startup_id");--> statement-breakpoint
CREATE INDEX "startup_profiles_sector_stage_country_idx" ON "startup_profiles" USING btree ("sector","stage","country");--> statement-breakpoint
CREATE INDEX "startup_profiles_approval_status_idx" ON "startup_profiles" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "startup_profiles_featured_idx" ON "startup_profiles" USING btree ("featured_until") WHERE is_featured = true;--> statement-breakpoint
CREATE INDEX "startup_profiles_verified_idx" ON "startup_profiles" USING btree ("is_verified") WHERE is_verified = true;--> statement-breakpoint
CREATE INDEX "startup_profiles_score_idx" ON "startup_profiles" USING btree ("profile_score");--> statement-breakpoint
CREATE INDEX "startup_profiles_approved_score_idx" ON "startup_profiles" USING btree ("approval_status","profile_score");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_name_idx" ON "users" USING btree ("name");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("is_active") WHERE is_active = true;--> statement-breakpoint
CREATE INDEX "users_must_change_password_idx" ON "users" USING btree ("id") WHERE must_change_password = true;