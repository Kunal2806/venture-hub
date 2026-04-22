import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { StartupApplicationsTable } from "@/db/schema";
import { ZodError } from "zod";
import { sendEmail } from "@/lib/mailer";
import { randomUUID } from "crypto";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { applicationSchema } from "@/lib/applicationSchema";

// ─── Security headers ──────────────────────────────────────────────────────────

const SEC_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options":        "DENY",
  "Referrer-Policy":        "strict-origin-when-cross-origin",
};

function secureJson(body: unknown, init?: ResponseInit): NextResponse {
  const res = NextResponse.json(body, init);
  for (const [k, v] of Object.entries(SEC_HEADERS)) res.headers.set(k, v);
  return res;
}

// ─── Error helpers ─────────────────────────────────────────────────────────────

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

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
  founderName: string,
  applicationId: string,
  submittedAt: string,
) {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#F9F7F2;border-radius:16px;overflow:hidden;">
      <div style="background:#1A362B;padding:32px 36px;">
        <h1 style="margin:0;font-size:22px;color:#F9F7F2;font-weight:700;letter-spacing:-0.3px;">VentureHub</h1>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(249,247,242,0.55);">Startup Applications</p>
      </div>
      <div style="padding:36px;">
        <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1A362B;">Application received, ${founderName}!</p>
        <p style="margin:0 0 24px;font-size:15px;color:#4A5D4E;line-height:1.65;">
          Thank you for applying to VentureHub. Our team reviews each application
          carefully — we'll be in touch within <strong>5–7 business days</strong>.
        </p>
        <div style="background:#EFEBE3;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#4A5D4E;">Application Summary</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:5px 0;font-size:13px;color:#4A5D4E;width:40%;">Application ID</td>
              <td style="padding:5px 0;font-size:13px;color:#2D2D2D;font-weight:600;font-family:monospace;">${applicationId.slice(0, 8).toUpperCase()}</td>
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
            ["Our team reviews your application", "5–7 business days"],
            ["You'll receive a decision via email", "Approve or decline"],
            ["If approved, onboard and complete your startup profile", "Instant access"],
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
          Questions? Reach us at
          <a href="mailto:support@venturehub.io" style="color:#1A362B;font-weight:600;">support@venturehub.io</a>
        </p>
      </div>
      <div style="padding:20px 36px;border-top:1px solid #EFEBE3;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">
          © ${new Date().getFullYear()} VentureHub · You're receiving this because you applied at venturehub.io
        </p>
      </div>
    </div>
  `;
}

// ─── POST /api/apply ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {

  // ── 1. Rate limit: 5 submissions per IP per hour ──────────────────────────
  const ip = getClientIp(req);
  const rl = await rateLimit(`startup-apply:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
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

  // ── 3. Validate with applicationSchema ───────────────────────────────────
  let data: ReturnType<typeof applicationSchema.parse>;
  try {
    data = applicationSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return secureJson(
        {
          error:   "Validation failed",
          details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
        },
        { status: 400 }
      );
    }
    return secureJson({ error: "Unexpected validation error." }, { status: 400 });
  }

  const email = data.email; // already trimmed + lowercased by schema

  // ── 4. Pre-flight duplicate check ────────────────────────────────────────
  try {
    const existing = await db.query.StartupApplicationsTable.findFirst({
      where: (t, { eq }) => eq(t.email, email),
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
    console.error("[apply] duplicate check failed:", error);
    const classified = classifyDbError(error);
    if (classified) return secureJson({ error: classified.message }, { status: classified.status });
    return secureJson({ error: "Unable to process your application. Please try again." }, { status: 503 });
  }

  // ── 5. Insert ─────────────────────────────────────────────────────────────
  // Note: capitalCurrency has no column in StartupApplicationsTable.
  // We prefix it into capitalRequested so no data is lost: "USD 500,000"
  // If you add a capitalCurrency column later, split this back out.
  const capitalValue = data.capitalRequested
    ? data.capitalCurrency
      ? `${data.capitalCurrency} ${data.capitalRequested}`
      : data.capitalRequested
    : null;

  let application: { id: string };
  const now = new Date();

  try {
    const [inserted] = await db
      .insert(StartupApplicationsTable)
      .values({
        id:                randomUUID(),
        founderName:       data.founderName,
        email,
        mobile:            data.mobile             || null,
        companyName:       data.companyName,
        sector:            data.sector,
        stage:             data.stage,
        country:           data.country            || null,
        websiteUrl:        data.websiteUrl          || null,
        pitchDeckUrl:      data.pitchDeckUrl        || null,
        impactDescription: data.impactDescription   || null,
        impactMetrics:     data.impactMetrics        || null,
        capitalRequested:  capitalValue,
        fundingPeriod:     data.fundingPeriod        || null,
        useOfFunds:        data.useOfFunds           || null,
        status:            "SUBMITTED",
        createdAt:         now,
        updatedAt:         now,
      })
      .returning({ id: StartupApplicationsTable.id });

    if (!inserted) throw new Error("Insert returned no rows.");
    application = inserted;
  } catch (err) {
    const error = toError(err);
    console.error("[apply] insert failed:", error);
    const classified = classifyDbError(error);
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
      "We received your application — VentureHub",
      buildSubmissionEmail(data.founderName, application.id, submittedAt)
    );
    emailSent = true;
  } catch (emailErr) {
    console.error("[apply] confirmation email failed:", toError(emailErr).message);
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