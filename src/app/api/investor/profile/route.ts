
import { auth } from "@/auth";
import { db } from "@/db";
import { InvestorProfilesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// ── Allowed investor types ──────────────────────────────────────────────────
const ALLOWED_INVESTOR_TYPES = [
  "ANGEL",
  "VENTURE_CAPITAL",
  "PRIVATE_EQUITY",
  "CORPORATE",
  "FAMILY_OFFICE",
  "ACCELERATOR",
] as const;

type AllowedInvestorType = (typeof ALLOWED_INVESTOR_TYPES)[number];

// ── Shared auth helper ──────────────────────────────────────────────────────
async function requireInvestor() {
  const session = await auth();

  if (!session?.user) {
    return {
      userId: null,
      error: NextResponse.json(
        { success: false, message: "Unauthorized: not logged in." },
        { status: 401 }
      ),
    };
  }

  if (session.user.role !== "INVESTOR") {
    return {
      userId: null,
      error: NextResponse.json(
        { success: false, message: "Forbidden: investor role required." },
        { status: 403 }
      ),
    };
  }

  return { userId: session.user.id as string, error: null };
}

// ============================================================
// GET /api/investor/profile
// Returns the current investor's profile or 404 if not found.
// ============================================================
export async function GET() {
  const { userId, error } = await requireInvestor();
  if (error) return error;

  const [profile] = await db
    .select()
    .from(InvestorProfilesTable)
    .where(eq(InvestorProfilesTable.userId, userId!))
    .limit(1);

  if (!profile) {
    return NextResponse.json(
      { success: false, message: "Profile not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: profile }, { status: 200 });
}

// ============================================================
// PUT /api/investor/profile
// Body (JSON): { firmName, investorType, preferredSectors?, preferredStages? }
// Upserts — inserts on first call, updates on subsequent calls.
// Admin-managed fields (approvalStatus, isVerified, etc.) are
// never touched by this endpoint.
// ============================================================
export async function PUT(req: NextRequest) {
  const { userId, error } = await requireInvestor();
  if (error) return error;

  // ── Parse body ────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { success: false, message: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  const raw = body as Record<string, unknown>;

  const firmName =
    typeof raw.firmName === "string" ? raw.firmName.trim() : "";
  const investorType =
    typeof raw.investorType === "string" ? raw.investorType.trim() : "";

  // ── Field validation ──────────────────────────────────────
  const errors: Record<string, string> = {};

  if (!firmName) {
    errors.firmName = "Firm name is required.";
  }

  if (!investorType) {
    errors.investorType = "Investor type is required.";
  } else if (
    !ALLOWED_INVESTOR_TYPES.includes(investorType as AllowedInvestorType)
  ) {
    errors.investorType = `Invalid investor type. Allowed: ${ALLOWED_INVESTOR_TYPES.join(", ")}.`;
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { success: false, errors },
      { status: 422 }
    );
  }

  // ── Sanitise JSON arrays ──────────────────────────────────
  // Accept arrays directly; reject anything else gracefully.
  const preferredSectors: string[] = Array.isArray(raw.preferredSectors)
    ? raw.preferredSectors.filter((s): s is string => typeof s === "string")
    : [];

  const preferredStages: string[] = Array.isArray(raw.preferredStages)
    ? raw.preferredStages.filter((s): s is string => typeof s === "string")
    : [];

  // ── UPSERT ────────────────────────────────────────────────
  // Targets the unique userId column.
  // Admin fields are intentionally excluded from `set:`.
  try {
    const [upserted] = await db
      .insert(InvestorProfilesTable)
      .values({
        userId: userId!,
        firmName,
        investorType: investorType as AllowedInvestorType,
        preferredSectors,
        preferredStages,
        preferredGeographies: [],
      })
      .onConflictDoUpdate({
        target: InvestorProfilesTable.userId,
        set: {
          firmName,
          investorType: investorType as AllowedInvestorType,
          preferredSectors,
          preferredStages,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json(
      { success: true, message: "Profile saved successfully.", data: upserted },
      { status: 200 }
    );
  } catch (err) {
    console.error("[PUT /api/investor/profile] DB error:", err);
    return NextResponse.json(
      { success: false, message: "Database error. Please try again." },
      { status: 500 }
    );
  }
}