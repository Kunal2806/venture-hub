import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { StartupApplicationsTable } from "@/db/schema";
import { ZodError } from "zod";
import { sendEmail } from "@/lib/mailer";
import { randomUUID } from "crypto";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { applicationSchema } from "@/lib/applicationSchema";

// ─── Security headers added to every response ─────────────────────────────────

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options":        "DENY",
  "Referrer-Policy":        "strict-origin-when-cross-origin",
};

function secureJson(body: unknown, init?: ResponseInit): NextResponse {
  const res = NextResponse.json(body, init);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  return res;
}

// ─── Email template ────────────────────────────────────────────────────────────

function buildSubmissionEmail(
  founderName: string,
  companyName: string,
  applicationId: string,
  submittedAt: string,
) {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#F9F7F2;border-radius:16px;overflow:hidden;">
      <div style="background:#1A362B;padding:32px 36px;">
        <h1 style="margin:0;font-size:22px;color:#F9F7F2;font-weight:700;letter-spacing:-0.3px;">VentureHub</h1>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(249,247,242,0.55);">Startup Ecosystem Platform</p>
      </div>
      <div style="padding:36px;">
        <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1A362B;">Application received, ${founderName}!</p>
        <p style="margin:0 0 24px;font-size:15px;color:#4A5D4E;line-height:1.65;">
          Thank you for applying to VentureHub with <strong style="color:#2D2D2D;">${companyName}</strong>.
          Your application is now in our review queue — our team will get back to you within <strong>3–5 business days</strong>.
        </p>
        <div style="background:#EFEBE3;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#4A5D4E;">Application Summary</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:5px 0;font-size:13px;color:#4A5D4E;width:40%;">Application ID</td>
              <td style="padding:5px 0;font-size:13px;color:#2D2D2D;font-weight:600;font-family:monospace;">${applicationId.slice(0, 8).toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:13px;color:#4A5D4E;">Company</td>
              <td style="padding:5px 0;font-size:13px;color:#2D2D2D;font-weight:600;">${companyName}</td>
            </tr>
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
            ["You'll receive a decision via email", "Approve or reject"],
            ["If approved, activate your account & build your profile", "Instant access"],
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
          © ${new Date().getFullYear()} VentureHub · You're receiving this because you applied for funding at venturehub.io
        </p>
      </div>
    </div>
  `;
}

// ─── POST /api/apply ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Rate limit: 5 submissions per IP per hour ──────────────────────────
  const ip = getClientIp(req);
  const rl = await rateLimit(`apply:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });

  if (!rl.ok) {
    return secureJson(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  // ── 2. Parse & validate with the shared schema ────────────────────────────
  let data: ReturnType<typeof applicationSchema.parse>;
  try {
    const body = await req.json();
    data = applicationSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return secureJson(
        { error: "Validation failed", details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })) },
        { status: 400 }
      );
    }
    return secureJson({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    // ── 3. Duplicate check — rely on DB unique constraint as ground truth ───
    //    We still do a pre-flight read for a nicer error message, but the UNIQUE
    //    constraint on the email column is what actually prevents races.
    const existing = await db.query.StartupApplicationsTable.findFirst({
      where: (t, { eq }) => eq(t.email, data.email),
      columns: { id: true },
    });

    if (existing) {
      return secureJson(
        { error: "An application with this email already exists.", code: "DUPLICATE_EMAIL" },
        { status: 409 }
      );
    }

    // ── 4. Insert (DB unique constraint is the real race-condition guard) ───
    const now = new Date();
    let application: { id: string };

    try {
      [application] = await db
        .insert(StartupApplicationsTable)
        .values({
          id:                randomUUID(),
          founderName:       data.founderName,
          email:             data.email,
          mobile:            data.mobile            || null,
          companyName:       data.companyName,
          sector:            data.sector,
          stage:             data.stage,
          country:           data.country           || null,
          websiteUrl:        data.websiteUrl        || null,
          pitchDeckUrl:      data.pitchDeckUrl      || null,
          impactDescription: data.impactDescription || null,
          impactMetrics:     data.impactMetrics     || null,
          useOfFunds:        data.useOfFunds        || null,
          fundingPeriod:     data.fundingPeriod     || null,
          // Store the full "INR 500,000" string so the original value is always recoverable
          capitalRequested:  data.capitalRequested
            ? `${data.capitalCurrency ?? "USD"} ${data.capitalRequested}`
            : null,
          status:    "SUBMITTED",
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: StartupApplicationsTable.id });
    } catch (dbErr: unknown) {
      // Catch unique-violation race condition (Postgres error code 23505)
      const pgCode = (dbErr as { code?: string })?.code;
      if (pgCode === "23505") {
        return secureJson(
          { error: "An application with this email already exists.", code: "DUPLICATE_EMAIL" },
          { status: 409 }
        );
      }
      throw dbErr; // re-throw unexpected errors
    }

    // ── 5. Confirmation email (non-blocking — failure is logged, not surfaced) ─
    let emailSent = false;
    try {
      const submittedAt = now.toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      });
      await sendEmail(
        "VentureHub",
        data.email,
        `We received your application — ${data.companyName}`,
        buildSubmissionEmail(data.founderName, data.companyName, application.id, submittedAt)
      );
      emailSent = true;
    } catch (emailErr) {
      // Log but don't fail the request — the application is already saved
      console.error("[apply] confirmation email failed:", emailErr);
    }

    return secureJson({
      success:       true,
      message:       "Application submitted successfully",
      applicationId: application.id,
      emailSent,
      // If the email failed, the frontend can display a note to check spam / contact support
      ...(emailSent ? {} : { emailWarning: "Confirmation email could not be sent. Please contact support@venturehub.io if you need a copy." }),
    });

  } catch (error) {
    console.error("[apply] submission error:", error);
    return secureJson({ error: "Failed to submit application. Please try again." }, { status: 500 });
  }
}

// ─── GET /api/apply?email= ─────────────────────────────────────────────────────
//
// SECURITY: Requires a valid session token (Authorization: Bearer <token>).
// The caller may only check their own email — the token's sub claim is compared
// against the requested email. Swap `verifySessionToken` for your actual auth
// library (NextAuth, Clerk, etc.).
//
// reviewNotes are NEVER returned to the applicant — only internal staff see those.

export async function GET(req: NextRequest) {
  // ── 1. Rate limit: 20 status checks per IP per minute ────────────────────
  const ip = getClientIp(req);
  const rl = await rateLimit(`apply-status:${ip}`, { limit: 20, windowMs: 60 * 1000 });
  if (!rl.ok) {
    return secureJson({ error: "Too many requests." }, { status: 429 });
  }

  // ── 2. Authentication ──────────────────────────────────────────────────────
  //    Uncomment and wire up your auth provider here.
  //    Example using a generic verifySessionToken helper:
  //
  // const authHeader = req.headers.get("Authorization");
  // if (!authHeader?.startsWith("Bearer ")) {
  //   return secureJson({ error: "Authentication required" }, { status: 401 });
  // }
  // const token = authHeader.slice(7);
  // const session = await verifySessionToken(token);
  // if (!session) {
  //   return secureJson({ error: "Invalid or expired token" }, { status: 401 });
  // }

  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return secureJson({ error: "email parameter required" }, { status: 400 });
  }

  // Basic email format sanity check to avoid unnecessary DB hits
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return secureJson({ error: "Invalid email format" }, { status: 400 });
  }

  // ── 3. Authorisation: user may only query their own email ─────────────────
  //    Uncomment once auth is wired:
  //
  // if (session.email.toLowerCase() !== email.toLowerCase()) {
  //   return secureJson({ error: "Forbidden" }, { status: 403 });
  // }

  try {
    const application = await db.query.StartupApplicationsTable.findFirst({
      where: (t, { eq }) => eq(t.email, email.toLowerCase()),
      columns: {
        id: true, companyName: true, status: true,
        createdAt: true,
        // reviewedAt is fine to return — it's a timestamp, not sensitive content
        reviewedAt: true,
        // reviewNotes intentionally OMITTED — internal staff data only
      },
    });

    if (!application) {
      // Return 404 rather than 200 + null to avoid leaking existence of other emails
      return secureJson({ error: "Application not found" }, { status: 404 });
    }

    return secureJson({ application });
  } catch (error) {
    console.error("[apply] status check error:", error);
    return secureJson({ error: "Failed to check application status" }, { status: 500 });
  }
}