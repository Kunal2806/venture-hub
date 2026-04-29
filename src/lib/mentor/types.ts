// Matches MentorProfilesTable schema
export type MentorProfile = {
  id: string;
  userId: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  suspensionReason: string | null;
  isVerified: boolean;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  headline: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  country: string | null;
  city: string | null;
  domains: string[];
  industries: string[];
  yearsOfExperience: number | null;
  previousCompanies: string | null;
  sessionPriceUsd: string | null;
  sessionDurationMinutes: number | null;
  timezone: string | null;
  isAvailable: boolean;
  totalSessions: number;
  averageRating: string | null;
  totalRatings: number;
  totalEarnings: string;
  createdAt: Date;
  updatedAt: Date;
};

// Matches MentorApplicationsTable — source of truth for original data
export type MentorApplication = {
  id: string;
  fullName: string;
  email: string;
  mobile: string | null;
  linkedinUrl: string | null;
  currentRole: string;
  company: string;
  yearsOfExperience: number;
  domains: string[];
  bio: string | null;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  reviewNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Matches UsersTable
export type UserType = {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  role: "ADMIN" | "STARTUP" | "INVESTOR" | "MENTOR";
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// Availability from MentorAvailabilityTable
export type MentorAvailability = {
  id: string;
  mentorId: string;
  dayOfWeek: number; // 0=Sun … 6=Sat
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  isActive: boolean;
  createdAt: Date;
};

export type MentorProfileEditForm = {
  headline: string;
  bio: string;
  currentRole: string;
  company: string;
  yearsOfExperience: number;
  domains: string[];
  industries: string[];
  linkedinUrl: string;
  websiteUrl: string;
  country: string;
  city: string;
  timezone: string;
  sessionPriceUsd: string;
  sessionDurationMinutes: number;
  isAvailable: boolean;
};

export type ProfileCompletionField = {
  label: string;
  filled: boolean;
  weight: number;
};