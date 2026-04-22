import { db } from "@/db";
import { InvestorApplicationsTable } from "@/db/schema";
import { investorApplicationSchema } from "@/lib/investor/Investorschema ";
import { sendEmail } from "@/lib/mailer";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

// ─── Security headers ──────────────────────────────────────────────────────────

const SEC = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options":        "DENY",
  "Referrer-Policy":        "strict-origin-when-cross-origin",
};

function secureJson(body: unknown, init?: ResponseInit): NextResponse {
  const res = NextResponse.json(body, init);
  for (const [k, v] of Object.entries(SEC)) res.headers.set(k, v);
  return res;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parseDecimal(value?: string): string | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? String(n) : null;
}

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

/** Map Postgres error codes to safe HTTP responses. */
function classifyDbError(err: Error): { status: number; message: string } | null {
  const code = (err as NodeJS.ErrnoException & { code?: string }).code;
  if (code === "23505") return { status: 409, message: "An application with this email already exists." };
  if (code === "23502") return { status: 400, message: "A required field is missing." };
  if (code === "23514") return { status: 400, message: "One or more values are outside the allowed range." };
  if (
    err.message.includes("ECONNREFUSED") ||
    err.message.includes("ETIMEDOUT") ||
    err.message.includes("Connection terminated")
  ) return { status: 503, message: "Database is temporarily unavailable. Please try again shortly." };
  return null;
}

// ─── Email template ────────────────────────────────────────────────────────────

function buildSubmissionEmail(
  name: string,
  firmName: string | undefined,
  applicationId: string,
  submittedAt: string,
) {
  const firmLine = firmName
    ? ` from <strong style="color:#2D2D2D;">${firmName}</strong>`
    : "";
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#F9F7F2;border-radius:16px;overflow:hidden;">
      <div style="background:#1A362B;padding:32px 36px;">
        <h1 style="margin:0;font-size:22px;color:#F9F7F2;font-weight:700;">VentureHub</h1>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(249,247,242,0.55);">Startup Ecosystem Platform</p>
      </div>
      <div style="padding:36px;">
        <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1A362B;">Application received, ${name}!</p>
        <p style="margin:0 0 24px;font-size:15px;color:#4A5D4E;line-height:1.65;">
          Thank you for applying to join VentureHub as an investor${firmLine}.
          Our team will review your application within <strong>3–5 business days</strong>.
        </p>
        <div style="background:#EFEBE3;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#4A5D4E;">Application Summary</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:5px 0;font-size:13px;color:#4A5D4E;width:40%;">Application ID</td>
                <td style="padding:5px 0;font-size:13px;color:#2D2D2D;font-weight:600;font-family:monospace;">${applicationId.slice(0, 8).toUpperCase()}</td></tr>
            <tr><td style="padding:5px 0;font-size:13px;color:#4A5D4E;">Name</td>
                <td style="padding:5px 0;font-size:13px;color:#2D2D2D;font-weight:600;">${name}</td></tr>
            ${firmName ? `<tr><td style="padding:5px 0;font-size:13px;color:#4A5D4E;">Firm</td>
                <td style="padding:5px 0;font-size:13px;color:#2D2D2D;font-weight:600;">${firmName}</td></tr>` : ""}
            <tr><td style="padding:5px 0;font-size:13px;color:#4A5D4E;">Submitted</td>
                <td style="padding:5px 0;font-size:13px;color:#2D2D2D;font-weight:600;">${submittedAt}</td></tr>
            <tr><td style="padding:5px 0;font-size:13px;color:#4A5D4E;">Status</td>
                <td style="padding:5px 0;"><span style="background:#dbeafe;color:#1d4ed8;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">SUBMITTED</span></td></tr>
          </table>
        </div>
        <p style="margin:28px 0 0;font-size:13px;color:#4A5D4E;line-height:1.6;">
          Questions? <a href="mailto:support@venturehub.io" style="color:#1A362B;font-weight:600;">support@venturehub.io</a>
        </p>
      </div>
      <div style="padding:20px 36px;border-top:1px solid #EFEBE3;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} VentureHub</p>
      </div>
    </div>
  `;
}

// ─── POST /api/investors/apply ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {

  // ── 1. Rate limit: 5 submissions per IP per hour ──────────────────────────
  const ip = getClientIp(req);
  const rl = await rateLimit(`investor-apply:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return secureJson(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  // ── 2. Parse JSON body ────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return secureJson({ error: "Invalid request body — expected JSON." }, { status: 400 });
  }

  // ── 3. Validate with the shared schema ────────────────────────────────────
  let data: ReturnType<typeof investorApplicationSchema.parse>;
  try {
    data = investorApplicationSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return secureJson(
        {
          error: "Validation failed",
          details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
        },
        { status: 400 }
      );
    }
    return secureJson({ error: "Unexpected validation error." }, { status: 400 });
  }

  const email = data.email; // already trimmed + lowercased by schema

  // ── 4. Pre-flight duplicate check (race guard is the DB UNIQUE constraint) ─
  try {
    const existing = await db.query.InvestorApplicationsTable.findFirst({
      where: eq(InvestorApplicationsTable.email, email),
      columns: { id: true },
    });
    if (existing) {
      return secureJson(
        { error: "An application with this email already exists.", code: "DUPLICATE_EMAIL" },
        { status: 409 }
      );
    }
  } catch (err) {
    const error = toError(err);
    console.error("[investors/apply] duplicate check failed:", error);
    const classified = classifyDbError(error);
    if (classified) return secureJson({ error: classified.message }, { status: classified.status });
    return secureJson({ error: "Unable to process your application. Please try again." }, { status: 503 });
  }

  // ── 5. Insert — unique constraint catches any residual race condition ──────
  let application: { id: string };
  const now = new Date();

  try {
    const [inserted] = await db
      .insert(InvestorApplicationsTable)
      .values({
        id:                   randomUUID(),
        name:                 data.name,
        email,
        mobile:               data.mobile               || null,
        firmName:             data.firmName             || null,
        designation:          data.designation          || null,
        investorType:         data.investorType         ?? null,
        bio:                  data.bio                  || null,
        websiteUrl:           data.websiteUrl           || null,
        linkedinUrl:          data.linkedinUrl          || null,
        country:              data.country              || null,
        city:                 data.city                 || null,
        preferredSectors:     data.preferredSectors,
        preferredStages:      data.preferredStages,
        preferredGeographies: data.preferredGeographies,
        impactFocused:        data.impactFocused,
        investmentThesis:     data.investmentThesis     || null,
        ticketSizeMin:        parseDecimal(data.ticketSizeMin),
        ticketSizeMax:        parseDecimal(data.ticketSizeMax),
        status:               "SUBMITTED",
        createdAt:            now,
        updatedAt:            now,
      })
      .returning({ id: InvestorApplicationsTable.id });

    if (!inserted) throw new Error("Insert returned no rows.");
    application = inserted;
  } catch (err) {
    const error = toError(err);
    console.error("[investors/apply] insert failed:", error);
    const classified = classifyDbError(error);
    // 23505 = duplicate key — race condition that slipped past pre-flight check
    if (classified?.status === 409) {
      return secureJson(
        { error: "An application with this email already exists.", code: "DUPLICATE_EMAIL" },
        { status: 409 }
      );
    }
    if (classified) return secureJson({ error: classified.message }, { status: classified.status });
    return secureJson({ error: "Failed to save your application. Please try again." }, { status: 500 });
  }

  // ── 6. Confirmation email (non-fatal) ─────────────────────────────────────
  let emailSent = false;
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
    emailSent = true;
  } catch (emailErr) {
    console.error("[investors/apply] confirmation email failed:", toError(emailErr).message);
  }

  return secureJson(
    {
      success:       true,
      message:       "Application submitted successfully",
      applicationId: application.id,
      emailSent,
      ...(emailSent ? {} : {
        emailWarning: "Confirmation email could not be sent. Contact support@venturehub.io if needed.",
      }),
    },
    { status: 201 }
  );
}

// ─── GET /api/investors/apply?email= ──────────────────────────────────────────
//
// SECURITY: Requires authentication.
// The caller may only query their own email.
// reviewNotes are intentionally NOT returned — internal staff only.

export async function GET(req: NextRequest) {

  // ── 1. Rate limit: 20 checks per IP per minute ────────────────────────────
  const ip = getClientIp(req);
  const rl = await rateLimit(`investor-status:${ip}`, { limit: 20, windowMs: 60 * 1000 });
  if (!rl.ok) return secureJson({ error: "Too many requests." }, { status: 429 });

  // ── 2. Authentication ──────────────────────────────────────────────────────
  // Wire up your auth provider here. Example (NextAuth / Clerk / custom JWT):
  //
  // const authHeader = req.headers.get("Authorization");
  // if (!authHeader?.startsWith("Bearer ")) {
  //   return secureJson({ error: "Authentication required" }, { status: 401 });
  // }
  // const session = await verifySessionToken(authHeader.slice(7));
  // if (!session) return secureJson({ error: "Invalid or expired token" }, { status: 401 });

  const rawEmail = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!rawEmail) {
    return secureJson({ error: "email query parameter is required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(rawEmail)) {
    return secureJson({ error: "email parameter is not a valid address." }, { status: 400 });
  }

  // ── 3. Authorisation: caller may only query their own email ───────────────
  // Uncomment once auth is wired:
  // if (session.email !== rawEmail) {
  //   return secureJson({ error: "Forbidden" }, { status: 403 });
  // }

  try {
    const application = await db.query.InvestorApplicationsTable.findFirst({
      where: eq(InvestorApplicationsTable.email, rawEmail),
      columns: {
        id: true, name: true, firmName: true, status: true,
        createdAt: true, reviewedAt: true,
        // reviewNotes intentionally OMITTED — internal only
      },
    });

    if (!application) {
      return secureJson({ error: "Application not found." }, { status: 404 });
    }

    return secureJson({ application });
  } catch (err) {
    const error = toError(err);
    console.error("[investors/apply] status check error:", error);
    const classified = classifyDbError(error);
    if (classified) return secureJson({ error: classified.message }, { status: classified.status });
    return secureJson({ error: "Failed to retrieve application status." }, { status: 500 });
  }
}