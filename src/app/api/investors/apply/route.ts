

// ── Validation ──────────────────────────────────────────────────────────────

import { db } from "@/db";
import { InvestorApplicationsTable } from "@/db/schema";
import { sendEmail } from "@/lib/mailer";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const investorApplicationSchema = z.object({
  name:  z.string().min(2, "Full name is required").max(60),
  email: z.string().email("Valid email is required"),
  mobile: z.string().optional(),

  firmName:     z.string().optional(),
  designation:  z.string().optional(),
  investorType: z
    .enum(["ANGEL", "VENTURE_CAPITAL", "PRIVATE_EQUITY", "CORPORATE", "FAMILY_OFFICE", "ACCELERATOR"])
    .optional(),
  bio:         z.string().optional(),
  websiteUrl:  z.string().url("Must be a valid URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  country:     z.string().optional(),
  city:        z.string().optional(),

  preferredSectors:     z.array(z.string()).default([]),
  preferredStages:      z.array(z.string()).default([]),
  preferredGeographies: z.array(z.string()).default([]),
  impactFocused:        z.boolean().default(false),
  investmentThesis:     z.string().optional(),

  ticketSizeMin: z.string().optional(),
  ticketSizeMax: z.string().optional(),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseDecimal(value?: string): string | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? String(n) : null;
}

/** Narrow an unknown catch value into a plain Error */
function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  return new Error(String(err));
}

/**
 * Detect common Postgres/Drizzle error codes so we can return
 * meaningful HTTP responses without leaking raw DB messages.
 */
function classifyDbError(err: Error): { status: number; message: string } | null {
  // node-postgres surfaces the PG error code on err.code
  const code = (err as NodeJS.ErrnoException & { code?: string }).code;

  // 23505 = unique_violation  (duplicate key)
  if (code === "23505") {
    return { status: 409, message: "An application with this email already exists." };
  }
  // 23502 = not_null_violation
  if (code === "23502") {
    return { status: 400, message: "A required field is missing. Please review your application." };
  }
  // 23514 = check_violation
  if (code === "23514") {
    return { status: 400, message: "One or more values are outside the allowed range." };
  }
  // Connection / timeout issues
  if (
    err.message.includes("ECONNREFUSED") ||
    err.message.includes("ETIMEDOUT") ||
    err.message.includes("Connection terminated")
  ) {
    return { status: 503, message: "Database is temporarily unavailable. Please try again shortly." };
  }

  return null; // unknown — caller decides
}

// ── Email template ───────────────────────────────────────────────────────────

function buildSubmissionEmail(
  name: string,
  firmName: string | undefined,
  applicationId: string,
  submittedAt: string,
) {
  const firmLine = firmName ? ` from <strong style="color:#2D2D2D;">${firmName}</strong>` : "";
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#F9F7F2;border-radius:16px;overflow:hidden;">
      <div style="background:#1A362B;padding:32px 36px;">
        <h1 style="margin:0;font-size:22px;color:#F9F7F2;font-weight:700;letter-spacing:-0.3px;">VentureHub</h1>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(249,247,242,0.55);">Startup Ecosystem Platform</p>
      </div>
      <div style="padding:36px;">
        <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1A362B;">Application received, ${name}!</p>
        <p style="margin:0 0 24px;font-size:15px;color:#4A5D4E;line-height:1.65;">
          Thank you for applying to join VentureHub as an investor${firmLine}.
          Our team will review your application and get back to you within <strong>3–5 business days</strong>.
        </p>
        <div style="background:#EFEBE3;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#4A5D4E;">Application Summary</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:5px 0;font-size:13px;color:#4A5D4E;width:40%;">Application ID</td>
              <td style="padding:5px 0;font-size:13px;color:#2D2D2D;font-weight:600;font-family:monospace;">${applicationId.slice(0, 8).toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:13px;color:#4A5D4E;">Name</td>
              <td style="padding:5px 0;font-size:13px;color:#2D2D2D;font-weight:600;">${name}</td>
            </tr>
            ${firmName ? `
            <tr>
              <td style="padding:5px 0;font-size:13px;color:#4A5D4E;">Firm</td>
              <td style="padding:5px 0;font-size:13px;color:#2D2D2D;font-weight:600;">${firmName}</td>
            </tr>` : ""}
            <tr>
              <td style="padding:5px 0;font-size:13px;color:#4A5D4E;">Submitted</td>
              <td style="padding:5px 0;font-size:13px;color:#2D2D2D;font-weight:600;">${submittedAt}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:13px;color:#4A5D4E;">Status</td>
              <td style="padding:5px 0;">
                <span style="display:inline-block;background:#dbeafe;color:#1d4ed8;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:0.05em;">SUBMITTED</span>
              </td>
            </tr>
          </table>
        </div>
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#4A5D4E;">What happens next</p>
        <table style="width:100%;border-collapse:collapse;">
          ${[
            ["Our team reviews your application", "3–5 business days"],
            ["Decision emailed to you", "Approve or decline"],
            ["If approved, activate your account via email", "Set your password"],
            ["Complete your investor profile", "Start discovering startups"],
          ].map(([step, detail], i) => `
            <tr>
              <td style="vertical-align:top;padding:8px 12px 8px 0;width:28px;">
                <span style="display:inline-flex;width:22px;height:22px;border-radius:50%;background:#1A362B;color:#F9F7F2;font-size:11px;font-weight:700;align-items:center;justify-content:center;">${i + 1}</span>
              </td>
              <td style="padding:8px 0;">
                <p style="margin:0;font-size:14px;color:#2D2D2D;font-weight:600;">${step}</p>
                <p style="margin:2px 0 0;font-size:12px;color:#4A5D4E;">${detail}</p>
              </td>
            </tr>
          `).join("")}
        </table>
        <p style="margin:28px 0 0;font-size:13px;color:#4A5D4E;line-height:1.6;">
          Questions? Reply to this email or reach us at
          <a href="mailto:support@venturehub.io" style="color:#1A362B;font-weight:600;">support@venturehub.io</a>
        </p>
      </div>
      <div style="padding:20px 36px;border-top:1px solid #EFEBE3;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">
          © ${new Date().getFullYear()} VentureHub · You're receiving this because you applied as an investor at venturehub.io
        </p>
      </div>
    </div>
  `;
}

// ── POST /api/investors/apply ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Parse request body ─────────────────────────────────────────────────
  console.log("API HIT");
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body — expected JSON." },
      { status: 400 }
    );
  }
  console.log("API HIT");
  // ── 2. Validate with Zod ──────────────────────────────────────────────────
  let data: z.infer<typeof investorApplicationSchema>;
  try {
    data = investorApplicationSchema.parse(body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: err.errors.map(e => ({
            field:   e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    // Shouldn't happen, but guard anyway
    return NextResponse.json({ error: "Unexpected validation error." }, { status: 400 });
  }

  const email = data.email.trim().toLowerCase();

  // ── 3. Duplicate check ────────────────────────────────────────────────────
  try {
    const existing = await db.query.InvestorApplicationsTable.findFirst({
      where: eq(InvestorApplicationsTable.email, email),
      columns: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An application with this email already exists.", code: "DUPLICATE_EMAIL" },
        { status: 409 }
      );
    }
  } catch (err) {
    const error = toError(err);
    console.error("[investors/apply] duplicate check failed:", error);

    const classified = classifyDbError(error);
    if (classified) {
      return NextResponse.json({ error: classified.message }, { status: classified.status });
    }
    return NextResponse.json(
      { error: "Unable to process your application right now. Please try again." },
      { status: 503 }
    );
  }

  // ── 4. Insert ─────────────────────────────────────────────────────────────
  let application: { id: string };
  const now = new Date();

  try {
    const [inserted] = await db
      .insert(InvestorApplicationsTable)
      .values({
        id:                   randomUUID(),
        name:                 data.name.trim(),
        email,
        mobile:               data.mobile               || null,
        firmName:             data.firmName?.trim()      || null,
        designation:          data.designation?.trim()   || null,
        investorType:         data.investorType          ?? null,
        bio:                  data.bio?.trim()           || null,
        websiteUrl:           data.websiteUrl            || null,
        linkedinUrl:          data.linkedinUrl           || null,
        country:              data.country               || null,
        city:                 data.city                  || null,
        preferredSectors:     data.preferredSectors,
        preferredStages:      data.preferredStages,
        preferredGeographies: data.preferredGeographies,
        impactFocused:        data.impactFocused,
        investmentThesis:     data.investmentThesis?.trim() || null,
        ticketSizeMin:        parseDecimal(data.ticketSizeMin),
        ticketSizeMax:        parseDecimal(data.ticketSizeMax),
        status:               "SUBMITTED",
        createdAt:            now,
        updatedAt:            now,
      })
      .returning();

    if (!inserted) {
      // .returning() returned nothing — shouldn't happen, but handle it
      throw new Error("Insert returned no rows.");
    }

    application = inserted;
  } catch (err) {
    const error = toError(err);
    console.error("[investors/apply] insert failed:", error);

    const classified = classifyDbError(error);
    if (classified) {
      return NextResponse.json({ error: classified.message }, { status: classified.status });
    }
    return NextResponse.json(
      { error: "Failed to save your application. Please try again." },
      { status: 500 }
    );
  }

  // ── 5. Confirmation email (non-fatal) ─────────────────────────────────────
  try {
    const submittedAt = now.toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
    await sendEmail(
      "VentureHub",
      email,
      `We received your investor application${data.firmName ? ` — ${data.firmName}` : ""}`,
      buildSubmissionEmail(data.name, data.firmName, application.id, submittedAt)
    );
  } catch (emailErr) {
    // Log but never fail the request — the application is already saved
    console.error("[investors/apply] confirmation email failed:", toError(emailErr).message);
  }

  // ── 6. Success ────────────────────────────────────────────────────────────
  return NextResponse.json(
    {
      success: true,
      message: "Application submitted successfully",
      applicationId: application.id,
    },
    { status: 201 }
  );
}

// ── GET /api/investors/apply?email= ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "email query parameter is required." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "email parameter is not a valid address." }, { status: 400 });
  }

  try {
    const application = await db.query.InvestorApplicationsTable.findFirst({
      where: eq(InvestorApplicationsTable.email, email),
      columns: {
        id: true, name: true, firmName: true, status: true,
        createdAt: true, reviewedAt: true, reviewNotes: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (err) {
    const error = toError(err);
    console.error("[investors/apply] status check error:", error);

    const classified = classifyDbError(error);
    if (classified) {
      return NextResponse.json({ error: classified.message }, { status: classified.status });
    }
    return NextResponse.json(
      { error: "Failed to retrieve application status. Please try again." },
      { status: 500 }
    );
  }
}