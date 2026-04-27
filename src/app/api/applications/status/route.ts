import { NextRequest, NextResponse } from "next/server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { MentorApplicationsTable, StartupApplicationsTable } from "@/db/schema";

// ─── Validation ───────────────────────────────────────────────────────────────

const querySchema = z.object({
  email: z.string().email("Invalid email address"),
});

// ─── GET /api/applications/status?email= ─────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = { email: searchParams.get("email") ?? "" };

  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email address." },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  try {
    // Query both tables in parallel
    const [startupRows, mentorRows] = await Promise.all([
      db
        .select({
          id:          StartupApplicationsTable.id,
          name:        StartupApplicationsTable.founderName,
          email:       StartupApplicationsTable.email,
          status:      StartupApplicationsTable.status,
          submittedAt: StartupApplicationsTable.createdAt,
          reviewNotes: StartupApplicationsTable.reviewNotes,
        })
        .from(StartupApplicationsTable)
        .where(eq(StartupApplicationsTable.email, email.toLowerCase())),

      db
        .select({
          id:          MentorApplicationsTable.id,
          name:        MentorApplicationsTable.fullName,
          email:       MentorApplicationsTable.email,
          status:      MentorApplicationsTable.status,
          submittedAt: MentorApplicationsTable.createdAt,
          reviewNotes: MentorApplicationsTable.reviewNotes,
        })
        .from(MentorApplicationsTable)
        .where(eq(MentorApplicationsTable.email, email.toLowerCase())),
    ]);

    // Shape into a unified response
    const applications = [
      ...startupRows.map((row) => ({
        id:          row.id,
        type:        "startup" as const,
        name:        row.name,
        email:       row.email,
        status:      row.status,
        submittedAt: row.submittedAt.toISOString(),
        // Only expose review notes as rejection reason when REJECTED
        reason:      row.status === "REJECTED" ? (row.reviewNotes ?? undefined) : undefined,
      })),
      ...mentorRows.map((row) => ({
        id:          row.id,
        type:        "mentor" as const,
        name:        row.name,
        email:       row.email,
        status:      row.status,
        submittedAt: row.submittedAt.toISOString(),
        reason:      row.status === "REJECTED" ? (row.reviewNotes ?? undefined) : undefined,
      })),
    ];

    // Sort newest first
    applications.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    return NextResponse.json({ applications });
  } catch (err) {
    console.error("[application-status] DB error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}