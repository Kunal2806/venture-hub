// types/mentor.ts
// These types mirror the API response shape from /api/mentors
// NOT the raw DB schema — that lives in lib/db/schema.ts

export type EngagementType = "PAID" | "PRO_BONO" | "BOTH";

export type SessionFormat = "VIDEO_CALL" | "ASYNC_REVIEW" | "IN_PERSON";

export type SessionStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "DECLINED"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

// ── Mentor (API response from GET /api/mentors and GET /api/mentors/:id) ──
export interface Mentor {
  id: string;                        // MentorProfilesTable.id (not userId)
  name: string;                      // from UsersTable
  avatarUrl: string | null;          // from UsersTable
  designation: string;               // from MentorProfilesTable.headline
  organization: string;              // first entry in previousCompanies
  bio: string;
  expertiseDomains: string[];        // MentorProfilesTable.domains (jsonb)
  industries: string[];              // MentorProfilesTable.industries (jsonb)
  yearsOfExperience: number;
  averageRating: number;             // cast from decimal string
  totalReviews: number;              // MentorProfilesTable.totalRatings
  totalSessions: number;
  engagementType: EngagementType;    // derived: null/0 price = PRO_BONO
  sessionPrice: number | null;       // INR/USD per session; null = free
  sessionDurationMinutes: number;
  availabilityHoursPerMonth: number; // computed from MentorAvailabilityTable
  isAvailable: boolean;
  isVerified: boolean;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  country: string | null;
  city: string | null;
  timezone: string | null;
  createdAt: string;
  reviews?: {
  id: string;
  rating: number;
  review: string | null;
  createdAt: string;
  raterName: string;
}[];
}

// ── Session request payload (POST /api/mentor-sessions body) ─────────────
export interface CreateSessionPayload {
  mentorProfileId: string;          
  topic: string;
  description?: string;
  format?: SessionFormat;
}

export interface MentorSessionItem {
  id: string;
  status: SessionStatus;
  format: SessionFormat;
  agendaNote: string | null;
  sessionNotes: string | null;
  scheduledAt: string | null;
  durationMinutes: number;
  amountUsd: string;
  completedAt: string | null;
  cancelledAt: string | null;
  requestedAt: string;
  videoCallLink: string | null;
  mentorId: string;
  mentorHeadline: string | null;
  mentorName: string;
  mentorAvatar: string | null;
  startupId?: string;
  startupName?: string | null;
  startupLogo?: string | null;
  mentorEarnings: string | null;    
  platformCommission: string | null;
  mentorUserId: string;   
  startupUserId?: string
  hasRated?: boolean;
  rating?: number | null;
}

// ── Client-side filter state (FilterPanel) ───────────────────────────────
export interface FilterState {
  search: string;
  expertise: string[];               
  engagementType: EngagementType | "";
  sortBy: "rating" | "experience" | "";
}

// ── API meta (pagination) ─────────────────────────────────────────────────
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}