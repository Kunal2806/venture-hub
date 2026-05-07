import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// =====================================================================
// ENUMS
// =====================================================================

export const UserRole = pgEnum("user_role", [
  "ADMIN",
  "STARTUP",
  "INVESTOR",
  "MENTOR",
]);

export const ApprovalStatus = pgEnum("approval_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
]);

export const FundingStage = pgEnum("funding_stage", [
  "IDEA",
  "PRE_SEED",
  "SEED",
  "SERIES_A",
  "SERIES_B",
  "SERIES_C",
  "GROWTH",
]);

export const InvestorType = pgEnum("investor_type", [
  "ANGEL",
  "VENTURE_CAPITAL",
  "PRIVATE_EQUITY",
  "CORPORATE",
  "FAMILY_OFFICE",
  "ACCELERATOR",
]);

export const EOIStatus = pgEnum("eoi_status", [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
]);

export const DealStage = pgEnum("deal_stage", [
  "EOI_SENT",
  "EOI_ACCEPTED",
  "IN_DISCUSSION",
  "DUE_DILIGENCE",
  "TERM_SHEET",
  "CLOSED",
  "DROPPED",
]);

export const SessionStatus = pgEnum("session_status", [
  "REQUESTED",
  "ACCEPTED",
  "DECLINED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
]);

export const SessionFormat = pgEnum("session_format", [
  "VIDEO_CALL",
  "ASYNC_REVIEW",
  "IN_PERSON",
]);

export const PaymentStatus = pgEnum("payment_status", [
  "CREATED",
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
]);

export const PaymentType = pgEnum("payment_type", [
  "STARTUP_REGISTRATION",
  "INVESTOR_MEMBERSHIP",
  "MENTOR_SESSION",
]);

export const NotificationChannel = pgEnum("notification_channel", [
  "EMAIL",
  "IN_APP",
  "PUSH",
]);

export const NotificationEvent = pgEnum("notification_event", [
  "EOI_RECEIVED",
  "EOI_ACCEPTED",
  "EOI_REJECTED",
  "SESSION_BOOKED",
  "SESSION_ACCEPTED",
  "SESSION_DECLINED",
  "SESSION_COMPLETED",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "PROFILE_APPROVED",
  "PROFILE_REJECTED",
  "MESSAGE_RECEIVED",
  "PROFILE_SUSPENDED",
]);

export const DisputeStatus = pgEnum("dispute_status", [
  "OPEN",
  "UNDER_REVIEW",
  "RESOLVED",
  "CLOSED",
]);

export const ApplicationStatus = pgEnum("application_status", [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
]);

// =====================================================================
// STARTUP APPLICATIONS
// Pre-user state. Admin reviews → on approval, system creates user +
// startup_profile + activation token. Row is kept as audit trail.
// =====================================================================

export const StartupApplicationsTable = pgTable(
  "startup_applications",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),

    founderName:  text("founder_name").notNull(),
    email:        text("email").notNull(),
    mobile:       text("mobile"),
    companyName:  text("company_name").notNull(),
    websiteUrl:   text("website_url"),
    sector:       text("sector").notNull(),
    stage:        FundingStage("stage").notNull(),
    country:      text("country"),
    pitchDeckUrl: text("pitch_deck_url"),

    // ── Formerly concatenated into `description` ──
    impactDescription: text("impact_description"),
    impactMetrics:     text("impact_metrics"),
    useOfFunds:        text("use_of_funds"),
    fundingPeriod:     text("funding_period"),
    capitalRequested:  text("capital_requested"),

    status:        ApplicationStatus("status").default("SUBMITTED").notNull(),
    reviewedBy:    uuid("reviewed_by"),
    reviewNotes:   text("review_notes"),
    reviewedAt:    timestamp("reviewed_at", { mode: "date" }),
    createdUserId: uuid("created_user_id"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("startup_applications_email_key").on(t.email),
    index("startup_applications_status_created_at_idx").on(t.status, t.createdAt),
  ]
);

// =====================================================================
// USERS
// Pure auth + identity. Role-specific data lives in profile tables.
// approval_status removed — profiles carry their own approval lifecycle.
// =====================================================================

export const UsersTable = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    password: text("password").notNull(),
    mobile: text("mobile"),
    role: UserRole("role").notNull(),

    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at", { mode: "date" }),
     mustChangePassword: boolean("must_change_password").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("users_email_key").on(t.email),
    // Admin search by name / email
    index("users_name_idx").on(t.name),
    // Role-based queries (list all investors, etc.)
    index("users_role_idx").on(t.role),
    // Session validation — only active users
    index("users_active_idx").on(t.isActive).where(sql`is_active = true`),
     // Partial index for forced-change queue — tiny, fast
    index("users_must_change_password_idx")
      .on(t.id)
      .where(sql`must_change_password = true`),
  ]
);

// =====================================================================
// AUTH TOKENS — two separate tables, each with a single responsibility
// Expiry checked at app layer; expired rows cleaned by a nightly cron.
// =====================================================================

export const EmailVerificationTokenTable = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    email: text("email").notNull(),
    token: uuid("token").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  },
  (t) => [
    uniqueIndex("email_verification_tokens_email_token_key").on(
      t.email,
      t.token
    ),
    uniqueIndex("email_verification_tokens_token_key").on(t.token),
  ]
);

export const PasswordResetTokenTable = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    email: text("email").notNull(),
    token: uuid("token").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  },
  (t) => [
    uniqueIndex("password_reset_tokens_email_token_key").on(t.email, t.token),
    uniqueIndex("password_reset_tokens_token_key").on(t.token),
  ]
);

// =====================================================================
// STARTUP PROFILE
// approval_status lives here, not on users.
// founders inlined as JSONB — always fetched together, never queried
// individually. Eliminates a JOIN on every profile page load.
//
// founders JSONB shape:
// [{ name, role, bio, linkedinUrl, avatarUrl, isLeadFounder }]
// =====================================================================

export const StartupProfilesTable = pgTable(
  "startup_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => UsersTable.id, { onDelete: "cascade" }),

    // Admin governance (moved from users table)
    approvalStatus: ApprovalStatus("approval_status")
      .default("PENDING")
      .notNull(),
    suspensionReason: text("suspension_reason"),
    isVerified: boolean("is_verified").default(false).notNull(),
    verifiedAt: timestamp("verified_at", { mode: "date" }),
    verifiedBy: uuid("verified_by").references(() => UsersTable.id),
    isFeatured: boolean("is_featured").default(false).notNull(),
    featuredUntil: timestamp("featured_until", { mode: "date" }),
    profileScore: integer("profile_score").default(0).notNull(),

    // Identity
    companyName: text("company_name").notNull(),
    tagline: text("tagline"),
    description: text("description"),
    logoUrl: text("logo_url"),
    websiteUrl: text("website_url"),
    country: text("country"),
    city: text("city"),

    // Classification
    sector: text("sector").notNull(),
    industry: text("industry"),
    stage: FundingStage("stage").notNull(),
    foundedYear: integer("founded_year"),

    // Founders inlined — no JOIN needed on profile load
    // Shape: [{ name, role, bio, linkedinUrl, avatarUrl, isLeadFounder }]
    founders: jsonb("founders").default([]).notNull(),

    // Pitch
    problemStatement: text("problem_statement"),
    solutionDescription: text("solution_description"),
    businessModel: text("business_model"),
    uniqueValueProposition: text("unique_value_proposition"),
    targetMarket: text("target_market"),
    competitiveLandscape: text("competitive_landscape"),

    // Traction
    revenueMonthly: decimal("revenue_monthly", { precision: 15, scale: 2 }),
    revenueAnnual: decimal("revenue_annual", { precision: 15, scale: 2 }),
    userCount: integer("user_count"),
    growthRate: decimal("growth_rate", { precision: 5, scale: 2 }),

    // Funding ask
    // fundingAskMin: decimal("funding_ask_min", { precision: 15, scale: 2 }),
    // fundingAskMax: decimal("funding_ask_max", { precision: 15, scale: 2 }),
    equityOffered: decimal("equity_offered", { precision: 5, scale: 2 }),
    useOfFunds: text("use_of_funds"),
    fundingDeadline: timestamp("funding_deadline", { mode: "date" }),
    previousFundingTotal: decimal("previous_funding_total", {
      precision: 15,
      scale: 2,
    }),

    // Impact
    impactDescription: text("impact_description"),
    sdgGoals: jsonb("sdg_goals").default([]).notNull(), // [3, 7, 13]

    // Denormalized counters — atomic UPDATE col = col + 1, never COUNT(*)
    profileViewCount: integer("profile_view_count").default(0).notNull(),
    eoiReceivedCount: integer("eoi_received_count").default(0).notNull(),
    watchlistCount: integer("watchlist_count").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    // Hot investor search: sector + stage + country
    index("startup_profiles_sector_stage_country_idx").on(
      t.sector,
      t.stage,
      t.country
    ),
    // Approval queue
    index("startup_profiles_approval_status_idx").on(t.approvalStatus),
    // Funding range slider
    // index("startup_profiles_funding_ask_idx").on(
    //   t.fundingAskMin,
    //   t.fundingAskMax
    // ),
    // Featured page — partial (only ~N rows, stays tiny)
    index("startup_profiles_featured_idx")
      .on(t.featuredUntil)
      .where(sql`is_featured = true`),
    // Verified badge filter — partial
    index("startup_profiles_verified_idx")
      .on(t.isVerified)
      .where(sql`is_verified = true`),
    // Leaderboard / recommendation sort
    index("startup_profiles_score_idx").on(t.profileScore),
    // Visibility gate: approved + score threshold check
    index("startup_profiles_approved_score_idx").on(
      t.approvalStatus,
      t.profileScore
    ),
  ]
);

// Documents kept as separate table — individual access control (isPublic)
// and potential per-document actions (delete, replace) justify the table.
export const StartupDocumentsTable = pgTable(
  "startup_documents",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    startupId: uuid("startup_id")
      .notNull()
      .references(() => StartupProfilesTable.id, { onDelete: "cascade" }),
    documentType: text("document_type").notNull(),
    // "PITCH_DECK" | "FINANCIALS" | "LEGAL" | "OTHER"
    title: text("title").notNull(),
    fileUrl: text("file_url").notNull(),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    // false = locked until EOI accepted
    isPublic: boolean("is_public").default(false).notNull(),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  },
  (t) => [
    index("startup_documents_startup_id_idx").on(t.startupId),
  ]
);

// =====================================================================
// ADD TO schema.ts — after StartupApplicationsTable
// =====================================================================

// export const InvestorApplicationsTable = pgTable(
//   "investor_applications",
//   {
//     id: uuid("id").defaultRandom().primaryKey().notNull(),

//     // Identity
//     name:        text("name").notNull(),
//     email:       text("email").notNull(),
//     mobile:      text("mobile"),

//     // Firm
//     firmName:    text("firm_name"),
//     designation: text("designation"),
//     investorType: InvestorType("investor_type"),
//     bio:         text("bio"),
//     websiteUrl:  text("website_url"),
//     linkedinUrl: text("linkedin_url"),
//     country:     text("country"),
//     city:        text("city"),

//     // Investment preferences
//     preferredSectors:     jsonb("preferred_sectors").default([]).notNull(),
//     preferredStages:      jsonb("preferred_stages").default([]).notNull(),
//     preferredGeographies: jsonb("preferred_geographies").default([]).notNull(),
//     impactFocused:        boolean("impact_focused").default(false).notNull(),
//     investmentThesis:     text("investment_thesis"),

//     // Ticket size
//     ticketSizeMin: decimal("ticket_size_min", { precision: 15, scale: 2 }),
//     ticketSizeMax: decimal("ticket_size_max", { precision: 15, scale: 2 }),

//     // Admin review lifecycle — identical to startup_applications
//     status:        ApplicationStatus("status").default("SUBMITTED").notNull(),
//     reviewedBy:    uuid("reviewed_by"),
//     reviewNotes:   text("review_notes"),
//     reviewedAt:    timestamp("reviewed_at", { mode: "date" }),
//     createdUserId: uuid("created_user_id"), // set after admin approves & creates user

//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at").defaultNow().notNull(),
//   },
//   (t) => [
//     uniqueIndex("investor_applications_email_key").on(t.email),
//     index("investor_applications_status_created_at_idx").on(t.status, t.createdAt),
//   ]
// );

// ── Drizzle relation (add to existing relations block) ──────────────
// export const investorApplicationsRelations = relations(
//   InvestorApplicationsTable,
//   ({ many }) => ({
//     payments: many(PaymentsTable),
//   })
// );

// ── TypeScript types ─────────────────────────────────────────────────
// export type InvestorApplication = typeof InvestorApplicationsTable.$inferSelect;
// export type NewInvestorApplication = typeof InvestorApplicationsTable.$inferInsert;

// =====================================================================
// INVESTOR PROFILE
// preferredSectors / preferredStages / preferredGeographies → jsonb[]
// Enables GIN index for @> containment used by matching algorithm.
// =====================================================================


export const InvestorProfilesTable = pgTable(
  "investor_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => UsersTable.id, { onDelete: "cascade" }),

    // Admin governance
    approvalStatus: ApprovalStatus("approval_status")
      .default("APPROVED")
      .notNull(),
    suspensionReason: text("suspension_reason"),
    isVerified: boolean("is_verified").default(false).notNull(),
    verifiedAt: timestamp("verified_at", { mode: "date" }),
    verifiedBy: uuid("verified_by").references(() => UsersTable.id),

    firmName: text("firm_name"),
    designation: text("designation"),
    bio: text("bio"),
    websiteUrl: text("website_url"),
    linkedinUrl: text("linkedin_url"),
    country: text("country"),
    city: text("city"),

    // Preferences — jsonb arrays replace comma-delimited text
    // Enables: WHERE preferred_sectors @> '["Fintech"]'
    investorType: InvestorType("investor_type"),
    preferredSectors: jsonb("preferred_sectors").default([]).notNull(),
    preferredStages: jsonb("preferred_stages").default([]).notNull(),
    preferredGeographies: jsonb("preferred_geographies").default([]).notNull(),
    ticketSizeMin: decimal("ticket_size_min", { precision: 15, scale: 2 }),
    ticketSizeMax: decimal("ticket_size_max", { precision: 15, scale: 2 }),
    investmentThesis: text("investment_thesis"),
    impactFocused: boolean("impact_focused").default(false).notNull(),

    // Portfolio summary — denormalized for dashboard
    totalInvestments: integer("total_investments").default(0).notNull(),
    totalPortfolioValue: decimal("total_portfolio_value", {
      precision: 18,
      scale: 2,
    }),

    membershipExpiresAt: timestamp("membership_expires_at", { mode: "date" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("investor_profiles_approval_status_idx").on(t.approvalStatus),
    index("investor_profiles_type_idx").on(t.investorType),
    index("investor_profiles_verified_idx")
      .on(t.isVerified)
      .where(sql`is_verified = true`),
    // Membership renewal cron
    index("investor_profiles_membership_expires_idx").on(
      t.membershipExpiresAt
    ),
    // GIN index — powers @> containment queries in matching algorithm
    index("investor_profiles_sectors_gin_idx").using(
      "gin",
      t.preferredSectors
    ),
    index("investor_profiles_stages_gin_idx").using(
      "gin",
      t.preferredStages
    ),
  ]
);

export const MentorApplicationsTable = pgTable(
  "mentor_applications",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    fullName:          text("full_name").notNull(),
    email:             text("email").notNull(),
    mobile:            text("mobile"),
    linkedinUrl:       text("linkedin_url"),
    currentRole:       text("current_role").notNull(),
    company:           text("company").notNull(),
    yearsOfExperience: integer("years_of_experience").notNull(),
    domains:           jsonb("domains").default([]).notNull(),
    bio:               text("bio"),
    status:            ApplicationStatus("status").default("SUBMITTED").notNull(),
    reviewNotes:       text("review_notes"),
    reviewedBy:        uuid("reviewed_by"),
    reviewedAt:        timestamp("reviewed_at", { mode: "date" }),
    createdUserId:     uuid("created_user_id"),
    createdAt:         timestamp("created_at").defaultNow().notNull(),
    updatedAt:         timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("mentor_applications_email_key").on(t.email),
    index("mentor_applications_status_created_at_idx").on(t.status, t.createdAt),
  ]
);

export type MentorApplication = typeof MentorApplicationsTable.$inferSelect;
export type NewMentorApplication = typeof MentorApplicationsTable.$inferInsert;

// =====================================================================
// MENTOR PROFILE
// domains / industries → jsonb arrays (same GIN rationale as investor)
// =====================================================================

export const MentorProfilesTable = pgTable(
  "mentor_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => UsersTable.id, { onDelete: "cascade" }),

    // Admin governance
    approvalStatus: ApprovalStatus("approval_status")
      .default("PENDING")
      .notNull(),
    suspensionReason: text("suspension_reason"),
    isVerified: boolean("is_verified").default(false).notNull(),
    verifiedAt: timestamp("verified_at", { mode: "date" }),
    verifiedBy: uuid("verified_by").references(() => UsersTable.id),

    headline: text("headline"),
    bio: text("bio"),
    linkedinUrl: text("linkedin_url"),
    websiteUrl: text("website_url"),
    country: text("country"),
    city: text("city"),

    // Expertise — jsonb arrays replace comma-delimited text
    domains: jsonb("domains").default([]).notNull(),
    industries: jsonb("industries").default([]).notNull(),
    yearsOfExperience: integer("years_of_experience"),
    previousCompanies: text("previous_companies"),

    // Booking
    sessionPriceUsd: decimal("session_price_usd", {
      precision: 10,
      scale: 2,
    }),
    sessionDurationMinutes: integer("session_duration_minutes").default(60),
    timezone: text("timezone"),
    isAvailable: boolean("is_available").default(true).notNull(),

    // Reputation — denormalized, updated via increment after each session
    totalSessions: integer("total_sessions").default(0).notNull(),
    averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
    totalRatings: integer("total_ratings").default(0).notNull(),
    totalEarnings: decimal("total_earnings", {
      precision: 15,
      scale: 2,
    }).default("0"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("mentor_profiles_approval_status_idx").on(t.approvalStatus),
    // Marketplace listing: available mentors sorted by rating — partial
    index("mentor_profiles_available_rating_idx")
      .on(t.averageRating)
      .where(sql`is_available = true`),
    index("mentor_profiles_price_idx").on(t.sessionPriceUsd),
    index("mentor_profiles_verified_idx")
      .on(t.isVerified)
      .where(sql`is_verified = true`),
    // GIN index for domain/industry filtering
    index("mentor_profiles_domains_gin_idx").using("gin", t.domains),
  ]
);

export const MentorAvailabilityTable = pgTable(
  "mentor_availability",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    mentorId: uuid("mentor_id")
      .notNull()
      .references(() => MentorProfilesTable.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0=Sun … 6=Sat
    startTime: text("start_time").notNull(),     // "09:00" UTC
    endTime: text("end_time").notNull(),         // "17:00" UTC
    isActive: boolean("is_active").default(true).notNull(),
    isProBono: boolean("is_pro_bono").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    // Calendar lookup: mentor + specific day
    index("mentor_availability_mentor_day_idx").on(t.mentorId, t.dayOfWeek),
  ]
);

// =====================================================================
// EOI — EXPRESSION OF INTEREST
// Unlocks messaging on acceptance. Core investment workflow.
// =====================================================================

export const EOITable = pgTable(
  "eois",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    investorId: uuid("investor_id")
      .notNull()
      .references(() => InvestorProfilesTable.id, { onDelete: "cascade" }),
    startupId: uuid("startup_id")
      .notNull()
      .references(() => StartupProfilesTable.id, { onDelete: "cascade" }),

    status: EOIStatus("status").default("PENDING").notNull(),
    message: text("message"),
    rejectionReason: text("rejection_reason"),

    dealStage: DealStage("deal_stage").default("EOI_SENT").notNull(),
    proposedAmount: decimal("proposed_amount", { precision: 15, scale: 2 }),
    proposedEquity: decimal("proposed_equity", { precision: 5, scale: 2 }),
    notes: text("notes"),

    sentAt: timestamp("sent_at").defaultNow().notNull(),
    respondedAt: timestamp("responded_at", { mode: "date" }),
    closedAt: timestamp("closed_at", { mode: "date" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    // One EOI per investor+startup pair — enforced at DB level
    uniqueIndex("eois_investor_startup_key").on(t.investorId, t.startupId),
    // Startup inbox: EOIs I received + status filter
    index("eois_startup_status_idx").on(t.startupId, t.status),
    // Investor pipeline: my sent EOIs + deal stage
    index("eois_investor_deal_stage_idx").on(t.investorId, t.dealStage),
    // Notification queue for pending EOIs — partial
    index("eois_pending_sent_at_idx")
      .on(t.sentAt)
      .where(sql`status = 'PENDING'`),
  ]
);

export const InvestorWatchlistTable = pgTable(
  "investor_watchlist",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    investorId: uuid("investor_id")
      .notNull()
      .references(() => InvestorProfilesTable.id, { onDelete: "cascade" }),
    startupId: uuid("startup_id")
      .notNull()
      .references(() => StartupProfilesTable.id, { onDelete: "cascade" }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("investor_watchlist_investor_startup_key").on(
      t.investorId,
      t.startupId
    ),
    index("investor_watchlist_investor_id_idx").on(t.investorId),
  ]
);

// =====================================================================
// MESSAGING — unlocked only after EOI accepted
// =====================================================================

export const ConversationsTable = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    // 1-to-1 with EOI — conversation lifecycle tied to deal lifecycle
    eoiId: uuid("eoi_id")
      .notNull()
      .unique()
      .references(() => EOITable.id, { onDelete: "cascade" }),
    investorUserId: uuid("investor_user_id")
      .notNull()
      .references(() => UsersTable.id),
    startupUserId: uuid("startup_user_id")
      .notNull()
      .references(() => UsersTable.id),
    isActive: boolean("is_active").default(true).notNull(),
    // Denormalized — avoids MAX(created_at) subquery on inbox listing
    lastMessageAt: timestamp("last_message_at", { mode: "date" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    // Inbox sorted by most recent message — covers WHERE + ORDER BY
    index("conversations_investor_last_msg_idx").on(
      t.investorUserId,
      t.lastMessageAt
    ),
    index("conversations_startup_last_msg_idx").on(
      t.startupUserId,
      t.lastMessageAt
    ),
  ]
);

export const MessagesTable = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => ConversationsTable.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => UsersTable.id),
    content: text("content").notNull(),
    attachmentUrl: text("attachment_url"),
    attachmentName: text("attachment_name"),
    attachmentSize: integer("attachment_size"),
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", { mode: "date" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    // Chat window: conversation + pagination by date
    index("messages_conversation_created_at_idx").on(
      t.conversationId,
      t.createdAt
    ),
    // Unread count badge — partial, only unread rows
    index("messages_unread_idx")
      .on(t.conversationId, t.senderId)
      .where(sql`is_read = false`),
  ]
);

// =====================================================================
// MENTOR SESSIONS
// =====================================================================

export const MentorSessionsTable = pgTable(
  "mentor_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    mentorId: uuid("mentor_id")
      .notNull()
      .references(() => MentorProfilesTable.id, { onDelete: "cascade" }),
    startupId: uuid("startup_id")
      .notNull()
      .references(() => StartupProfilesTable.id, { onDelete: "cascade" }),

    status: SessionStatus("status").default("REQUESTED").notNull(),
    format: SessionFormat("format").default("VIDEO_CALL").notNull(),

    requestedAt: timestamp("requested_at").defaultNow().notNull(),
    scheduledAt: timestamp("scheduled_at", { mode: "date" }),
    durationMinutes: integer("duration_minutes").default(60).notNull(),
    videoCallLink: text("video_call_link"),
    rescheduleReason: text("reschedule_reason"),
    rescheduledAt: timestamp("rescheduled_at", { mode: "date" }),

    agendaNote: text("agenda_note"),
    sessionNotes: text("session_notes"),
    deliverables: text("deliverables"),

    // Split stored for payout audit
    amountUsd: decimal("amount_usd", { precision: 10, scale: 2 }).notNull(),
    platformCommission: decimal("platform_commission", {
      precision: 10,
      scale: 2,
    }),
    mentorEarnings: decimal("mentor_earnings", { precision: 10, scale: 2 }),

    // Agora video call integration
    agoraChannel: text("agora_channel"),
    agoraTokenMentor: text("agora_token_mentor"),
    agoraTokenStartup: text("agora_token_startup"),

    completedAt: timestamp("completed_at", { mode: "date" }),
    cancelledAt: timestamp("cancelled_at", { mode: "date" }),
    cancellationReason: text("cancellation_reason"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    // Mentor calendar: upcoming sessions sorted by scheduledAt
    index("mentor_sessions_mentor_scheduled_idx").on(
      t.mentorId,
      t.scheduledAt
    ),
    // Startup dashboard: sessions I've booked + status filter
    index("mentor_sessions_startup_status_idx").on(t.startupId, t.status),
    // Admin earnings report: completed sessions only — partial
    index("mentor_sessions_completed_idx")
      .on(t.completedAt)
      .where(sql`status = 'COMPLETED'`),
  ]
);

// Bidirectional: startup rates mentor AND mentor rates startup
export const SessionRatingsTable = pgTable(
  "session_ratings",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => MentorSessionsTable.id, { onDelete: "cascade" }),
    raterId: uuid("rater_id")
      .notNull()
      .references(() => UsersTable.id),
    rateeId: uuid("ratee_id")
      .notNull()
      .references(() => UsersTable.id),
    rating: integer("rating").notNull(), // 1–5
    review: text("review"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    // One rating per rater per session
    uniqueIndex("session_ratings_session_rater_key").on(
      t.sessionId,
      t.raterId
    ),
    // Reputation query: all ratings for a given ratee
    index("session_ratings_ratee_id_idx").on(t.rateeId),
  ]
);

// =====================================================================
// PAYMENTS (Razorpay)
// Typed FKs replace polymorphic referenceType + referenceId strings.
// Only one FK will be non-null per row (enforced via app-layer check).
// DB gets referential integrity; queries get direct FK joins.
// =====================================================================

export const PaymentsTable = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),

    paymentType: PaymentType("payment_type").notNull(),
    status: PaymentStatus("status").default("CREATED").notNull(),
    amountUsd: decimal("amount_usd", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").default("USD").notNull(),

    // Typed FKs — exactly one is non-null per row
    sessionId: uuid("session_id").references(() => MentorSessionsTable.id, {
      onDelete: "set null",
    }),
    startupApplicationId: uuid("startup_application_id").references(
      () => StartupApplicationsTable.id,
      { onDelete: "set null" }
    ),
    investorProfileId: uuid("investor_profile_id").references(
      () => InvestorProfilesTable.id,
      { onDelete: "set null" }
    ),

    // Razorpay lifecycle
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    razorpaySignature: text("razorpay_signature"),

    receiptUrl: text("receipt_url"),
    receiptSentAt: timestamp("receipt_sent_at", { mode: "date" }),
    paidAt: timestamp("paid_at", { mode: "date" }),
    failureReason: text("failure_reason"),
    refundedAt: timestamp("refunded_at", { mode: "date" }),
    refundReason: text("refund_reason"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    // User payment history — paginated by date
    index("payments_user_created_at_idx").on(t.userId, t.createdAt),
    // Razorpay webhook lookup — must resolve in microseconds
    uniqueIndex("payments_razorpay_order_id_key").on(t.razorpayOrderId),
    // Admin revenue dashboard: type + status + date
    index("payments_type_status_paid_at_idx").on(
      t.paymentType,
      t.status,
      t.paidAt
    ),
    // Session payment lookup (direct FK join replaces polymorphic lookup)
    index("payments_session_id_idx").on(t.sessionId),
    // Pending timeout job — partial
    index("payments_pending_idx")
      .on(t.createdAt)
      .where(sql`status = 'PENDING'`),
  ]
);

// =====================================================================
// NOTIFICATIONS
// =====================================================================

export const NotificationsTable = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    event: NotificationEvent("event").notNull(),
    channel: NotificationChannel("channel").default("IN_APP").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    resourceType: text("resource_type"),
    resourceId: uuid("resource_id"),
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", { mode: "date" }),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    // Notification bell unread count — partial (only unread rows)
    index("notifications_user_unread_idx")
      .on(t.userId, t.createdAt)
      .where(sql`is_read = false`),
    // Full notification history pagination
    index("notifications_user_created_at_idx").on(t.userId, t.createdAt),
  ]
);

// =====================================================================
// ADMIN GOVERNANCE
// =====================================================================

// Immutable audit log — INSERT only, never UPDATE or DELETE
export const AdminActionsTable = pgTable(
  "admin_actions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => UsersTable.id),
    targetUserId: uuid("target_user_id").references(() => UsersTable.id),
    // "APPROVE_USER" | "REJECT_USER" | "SUSPEND_USER" | "FEATURE_STARTUP"
    // "UNFEATURE_STARTUP" | "UPDATE_CONFIG" | "RESOLVE_DISPUTE" | "REFUND_PAYMENT"
    actionType: text("action_type").notNull(),
    targetType: text("target_type"),
    targetId: uuid("target_id"),
    reason: text("reason"),
    metadata: jsonb("metadata"), // replaces text(JSON) — queryable
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("admin_actions_admin_created_at_idx").on(t.adminId, t.createdAt),
    index("admin_actions_target_user_idx").on(t.targetUserId),
    index("admin_actions_action_type_created_at_idx").on(
      t.actionType,
      t.createdAt
    ),
  ]
);

// Replaces platform_fees — simple key-value config store.
// Admin updates a single row; app reads by key. No uniqueness gymnastics.
export const PlatformConfigTable = pgTable(
  "platform_config",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    key: text("key").notNull(),
    // e.g. "startup_registration_fee_usd" | "mentor_commission_percent"
    //      "investor_membership_fee_usd"
    value: text("value").notNull(),   // stored as string, cast at app layer
    description: text("description"),
    updatedBy: uuid("updated_by").references(() => UsersTable.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("platform_config_key_key").on(t.key),
  ]
);

export const DisputesTable = pgTable(
  "disputes",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    raisedBy: uuid("raised_by")
      .notNull()
      .references(() => UsersTable.id),
    againstUserId: uuid("against_user_id").references(() => UsersTable.id),
    subject: text("subject").notNull(),
    description: text("description").notNull(),
    referenceType: text("reference_type"),
    referenceId: uuid("reference_id"),
    status: DisputeStatus("status").default("OPEN").notNull(),
    resolution: text("resolution"),
    resolvedBy: uuid("resolved_by").references(() => UsersTable.id),
    resolvedAt: timestamp("resolved_at", { mode: "date" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("disputes_raised_by_idx").on(t.raisedBy),
    // Admin open queue — partial (only OPEN rows, tiny index)
    index("disputes_open_created_at_idx")
      .on(t.createdAt)
      .where(sql`status = 'OPEN'`),
  ]
);

// =====================================================================
// ANALYTICS EVENTS — append-only event log
// Never aggregates on business tables. Future: partition by created_at.
// =====================================================================

export const AnalyticsEventsTable = pgTable(
  "analytics_events",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").references(() => UsersTable.id, {
      onDelete: "set null",
    }),
    // "STARTUP_PROFILE_VIEW" | "EOI_SENT" | "SESSION_COMPLETED"
    // "SEARCH_PERFORMED" | "WATCHLIST_ADD" | "DOCUMENT_VIEWED"
    eventType: text("event_type").notNull(),
    resourceType: text("resource_type"),
    resourceId: uuid("resource_id"),
    metadata: jsonb("metadata"), // replaces text(JSON) — queryable
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    // Time-series dashboard: type + date range
    index("analytics_events_type_created_at_idx").on(
      t.eventType,
      t.createdAt
    ),
    // Per-resource metrics: profile views, session completions per entity
    index("analytics_events_resource_idx").on(
      t.resourceType,
      t.resourceId,
      t.createdAt
    ),
    // Per-user activity timeline
    index("analytics_events_user_created_at_idx").on(
      t.userId,
      t.createdAt
    ),
  ]
);

// =====================================================================
// DRIZZLE RELATIONS
// Used by db.query.* for type-safe eager loading.
// Relations do NOT create DB constraints — .references() handles that.
// =====================================================================

export const startupApplicationsRelations = relations(
  StartupApplicationsTable,
  ({ many }) => ({
    payments: many(PaymentsTable),
  })
);

export const usersRelations = relations(UsersTable, ({ one, many }) => ({
  startupProfile: one(StartupProfilesTable, {
    fields: [UsersTable.id],
    references: [StartupProfilesTable.userId],
  }),
  investorProfile: one(InvestorProfilesTable, {
    fields: [UsersTable.id],
    references: [InvestorProfilesTable.userId],
  }),
  mentorProfile: one(MentorProfilesTable, {
    fields: [UsersTable.id],
    references: [MentorProfilesTable.userId],
  }),

  emailVerificationTokens: many(EmailVerificationTokenTable),
  passwordResetTokens: many(PasswordResetTokenTable),
  payments: many(PaymentsTable),
  notifications: many(NotificationsTable),

  ratingsMade: many(SessionRatingsTable, { relationName: "rater" }),
  ratingsReceived: many(SessionRatingsTable, { relationName: "ratee" }),

  investorConversations: many(ConversationsTable, {
    relationName: "investorUser",
  }),
  startupConversations: many(ConversationsTable, {
    relationName: "startupUser",
  }),
  messagesSent: many(MessagesTable),

  adminActionsPerformed: many(AdminActionsTable, { relationName: "admin" }),
  adminActionsReceived: many(AdminActionsTable, { relationName: "target" }),

  disputesRaised: many(DisputesTable, { relationName: "raisedByUser" }),
  disputesAgainst: many(DisputesTable, { relationName: "againstUser" }),

  analyticsEvents: many(AnalyticsEventsTable),
}));

export const startupProfilesRelations = relations(
  StartupProfilesTable,
  ({ one, many }) => ({
    user: one(UsersTable, {
      fields: [StartupProfilesTable.userId],
      references: [UsersTable.id],
    }),
    verifier: one(UsersTable, {
      fields: [StartupProfilesTable.verifiedBy],
      references: [UsersTable.id],
    }),
    // founders inlined as JSONB — no relation needed
    documents: many(StartupDocumentsTable),
    eois: many(EOITable),
    watchlistedBy: many(InvestorWatchlistTable),
    mentorSessions: many(MentorSessionsTable),
  })
);

export const startupDocumentsRelations = relations(
  StartupDocumentsTable,
  ({ one }) => ({
    startup: one(StartupProfilesTable, {
      fields: [StartupDocumentsTable.startupId],
      references: [StartupProfilesTable.id],
    }),
  })
);

export const investorProfilesRelations = relations(
  InvestorProfilesTable,
  ({ one, many }) => ({
    user: one(UsersTable, {
      fields: [InvestorProfilesTable.userId],
      references: [UsersTable.id],
    }),
    verifier: one(UsersTable, {
      fields: [InvestorProfilesTable.verifiedBy],
      references: [UsersTable.id],
    }),
    eois: many(EOITable),
    watchlist: many(InvestorWatchlistTable),
    payments: many(PaymentsTable),
  })
);

export const mentorProfilesRelations = relations(
  MentorProfilesTable,
  ({ one, many }) => ({
    user: one(UsersTable, {
      fields: [MentorProfilesTable.userId],
      references: [UsersTable.id],
    }),
    verifier: one(UsersTable, {
      fields: [MentorProfilesTable.verifiedBy],
      references: [UsersTable.id],
    }),
    availability: many(MentorAvailabilityTable),
    sessions: many(MentorSessionsTable),
  })
);

export const mentorAvailabilityRelations = relations(
  MentorAvailabilityTable,
  ({ one }) => ({
    mentor: one(MentorProfilesTable, {
      fields: [MentorAvailabilityTable.mentorId],
      references: [MentorProfilesTable.id],
    }),
  })
);

export const eoiRelations = relations(EOITable, ({ one }) => ({
  investor: one(InvestorProfilesTable, {
    fields: [EOITable.investorId],
    references: [InvestorProfilesTable.id],
  }),
  startup: one(StartupProfilesTable, {
    fields: [EOITable.startupId],
    references: [StartupProfilesTable.id],
  }),
  conversation: one(ConversationsTable, {
    fields: [EOITable.id],
    references: [ConversationsTable.eoiId],
  }),
}));

export const investorWatchlistRelations = relations(
  InvestorWatchlistTable,
  ({ one }) => ({
    investor: one(InvestorProfilesTable, {
      fields: [InvestorWatchlistTable.investorId],
      references: [InvestorProfilesTable.id],
    }),
    startup: one(StartupProfilesTable, {
      fields: [InvestorWatchlistTable.startupId],
      references: [StartupProfilesTable.id],
    }),
  })
);

export const conversationsRelations = relations(
  ConversationsTable,
  ({ one, many }) => ({
    eoi: one(EOITable, {
      fields: [ConversationsTable.eoiId],
      references: [EOITable.id],
    }),
    investorUser: one(UsersTable, {
      fields: [ConversationsTable.investorUserId],
      references: [UsersTable.id],
      relationName: "investorUser",
    }),
    startupUser: one(UsersTable, {
      fields: [ConversationsTable.startupUserId],
      references: [UsersTable.id],
      relationName: "startupUser",
    }),
    messages: many(MessagesTable),
  })
);

export const messagesRelations = relations(MessagesTable, ({ one }) => ({
  conversation: one(ConversationsTable, {
    fields: [MessagesTable.conversationId],
    references: [ConversationsTable.id],
  }),
  sender: one(UsersTable, {
    fields: [MessagesTable.senderId],
    references: [UsersTable.id],
  }),
}));

export const mentorSessionsRelations = relations(
  MentorSessionsTable,
  ({ one, many }) => ({
    mentor: one(MentorProfilesTable, {
      fields: [MentorSessionsTable.mentorId],
      references: [MentorProfilesTable.id],
    }),
    startup: one(StartupProfilesTable, {
      fields: [MentorSessionsTable.startupId],
      references: [StartupProfilesTable.id],
    }),
    ratings: many(SessionRatingsTable),
    payment: one(PaymentsTable, {
      fields: [MentorSessionsTable.id],
      references: [PaymentsTable.sessionId],
    }),
  })
);

export const sessionRatingsRelations = relations(
  SessionRatingsTable,
  ({ one }) => ({
    session: one(MentorSessionsTable, {
      fields: [SessionRatingsTable.sessionId],
      references: [MentorSessionsTable.id],
    }),
    rater: one(UsersTable, {
      fields: [SessionRatingsTable.raterId],
      references: [UsersTable.id],
      relationName: "rater",
    }),
    ratee: one(UsersTable, {
      fields: [SessionRatingsTable.rateeId],
      references: [UsersTable.id],
      relationName: "ratee",
    }),
  })
);

export const paymentsRelations = relations(PaymentsTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [PaymentsTable.userId],
    references: [UsersTable.id],
  }),
  session: one(MentorSessionsTable, {
    fields: [PaymentsTable.sessionId],
    references: [MentorSessionsTable.id],
  }),
  startupApplication: one(StartupApplicationsTable, {
    fields: [PaymentsTable.startupApplicationId],
    references: [StartupApplicationsTable.id],
  }),
  investorProfile: one(InvestorProfilesTable, {
    fields: [PaymentsTable.investorProfileId],
    references: [InvestorProfilesTable.id],
  }),
}));

export const notificationsRelations = relations(
  NotificationsTable,
  ({ one }) => ({
    user: one(UsersTable, {
      fields: [NotificationsTable.userId],
      references: [UsersTable.id],
    }),
  })
);

export const adminActionsRelations = relations(
  AdminActionsTable,
  ({ one }) => ({
    admin: one(UsersTable, {
      fields: [AdminActionsTable.adminId],
      references: [UsersTable.id],
      relationName: "admin",
    }),
    targetUser: one(UsersTable, {
      fields: [AdminActionsTable.targetUserId],
      references: [UsersTable.id],
      relationName: "target",
    }),
  })
);

export const platformConfigRelations = relations(
  PlatformConfigTable,
  ({ one }) => ({
    updatedByUser: one(UsersTable, {
      fields: [PlatformConfigTable.updatedBy],
      references: [UsersTable.id],
    }),
  })
);

export const disputesRelations = relations(DisputesTable, ({ one }) => ({
  raisedByUser: one(UsersTable, {
    fields: [DisputesTable.raisedBy],
    references: [UsersTable.id],
    relationName: "raisedByUser",
  }),
  againstUser: one(UsersTable, {
    fields: [DisputesTable.againstUserId],
    references: [UsersTable.id],
    relationName: "againstUser",
  }),
  resolvedByUser: one(UsersTable, {
    fields: [DisputesTable.resolvedBy],
    references: [UsersTable.id],
  }),
}));

export const analyticsEventsRelations = relations(
  AnalyticsEventsTable,
  ({ one }) => ({
    user: one(UsersTable, {
      fields: [AnalyticsEventsTable.userId],
      references: [UsersTable.id],
    }),
  })
);

// =====================================================================
// INFERRED TYPESCRIPT TYPES — single source of truth
// =====================================================================

export type User = typeof UsersTable.$inferSelect;
export type NewUser = typeof UsersTable.$inferInsert;

export type EmailVerificationToken =
  typeof EmailVerificationTokenTable.$inferSelect;
export type NewEmailVerificationToken =
  typeof EmailVerificationTokenTable.$inferInsert;

export type PasswordResetToken = typeof PasswordResetTokenTable.$inferSelect;
export type NewPasswordResetToken =
  typeof PasswordResetTokenTable.$inferInsert;

export type StartupApplication = typeof StartupApplicationsTable.$inferSelect;
export type NewStartupApplication =
  typeof StartupApplicationsTable.$inferInsert;

export type StartupProfile = typeof StartupProfilesTable.$inferSelect;
export type NewStartupProfile = typeof StartupProfilesTable.$inferInsert;

export type StartupDocument = typeof StartupDocumentsTable.$inferSelect;
export type NewStartupDocument = typeof StartupDocumentsTable.$inferInsert;

export type InvestorProfile = typeof InvestorProfilesTable.$inferSelect;
export type NewInvestorProfile = typeof InvestorProfilesTable.$inferInsert;

export type MentorProfile = typeof MentorProfilesTable.$inferSelect;
export type NewMentorProfile = typeof MentorProfilesTable.$inferInsert;

export type MentorAvailability = typeof MentorAvailabilityTable.$inferSelect;
export type NewMentorAvailability =
  typeof MentorAvailabilityTable.$inferInsert;

export type EOI = typeof EOITable.$inferSelect;
export type NewEOI = typeof EOITable.$inferInsert;

export type InvestorWatchlist = typeof InvestorWatchlistTable.$inferSelect;
export type NewInvestorWatchlist = typeof InvestorWatchlistTable.$inferInsert;

export type Conversation = typeof ConversationsTable.$inferSelect;
export type NewConversation = typeof ConversationsTable.$inferInsert;

export type Message = typeof MessagesTable.$inferSelect;
export type NewMessage = typeof MessagesTable.$inferInsert;

export type MentorSession = typeof MentorSessionsTable.$inferSelect;
export type NewMentorSession = typeof MentorSessionsTable.$inferInsert;

export type SessionRating = typeof SessionRatingsTable.$inferSelect;
export type NewSessionRating = typeof SessionRatingsTable.$inferInsert;

export type Payment = typeof PaymentsTable.$inferSelect;
export type NewPayment = typeof PaymentsTable.$inferInsert;

export type Notification = typeof NotificationsTable.$inferSelect;
export type NewNotification = typeof NotificationsTable.$inferInsert;

export type AdminAction = typeof AdminActionsTable.$inferSelect;
export type NewAdminAction = typeof AdminActionsTable.$inferInsert;

export type PlatformConfig = typeof PlatformConfigTable.$inferSelect;
export type NewPlatformConfig = typeof PlatformConfigTable.$inferInsert;

export type Dispute = typeof DisputesTable.$inferSelect;
export type NewDispute = typeof DisputesTable.$inferInsert;

export type AnalyticsEvent = typeof AnalyticsEventsTable.$inferSelect;
export type NewAnalyticsEvent = typeof AnalyticsEventsTable.$inferInsert;

// =====================================================================
// JSONB SHAPE TYPES
// Validated at app layer (Zod). Kept here for documentation.
// =====================================================================

export type FounderEntry = {
  name: string;
  role: string;         // "CEO" | "CTO" | "COO" | ...
  bio?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  isLeadFounder: boolean;
};
// Usage: (profile.founders as FounderEntry[])