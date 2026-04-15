import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { StartupApplicationsTable } from "@/db/schema";
import { z } from "zod";
import { sendEmail } from "@/lib/mailer";
import { randomUUID } from "crypto";

// ── Validation schema ──────────────────────────────────────────────────────
const applicationSchema = z.object({
  founderName:       z.string().min(2, "Founder name is required"),
  email:             z.string().email("Valid email is required"),
  mobile:            z.string().optional(),
  companyName:       z.string().min(2, "Company name is required"),
  sector:            z.string().min(1, "Industry/Sector is required"),
  stage:             z.enum(["IDEA", "PRE_SEED", "SEED", "SERIES_A", "SERIES_B", "SERIES_C", "GROWTH"]),
  country:           z.string().optional(),
  websiteUrl:        z.string().url().optional().or(z.literal("")),
  pitchDeckUrl:      z.string().url().optional().or(z.literal("")),

  // ── Separated fields ──
  impactDescription: z.string().optional(),
  impactMetrics:     z.string().optional(),
  useOfFunds:        z.string().optional(),
  fundingPeriod:     z.string().optional(),
  capitalRequested:  z.string().optional(),
});

// ── Email template ─────────────────────────────────────────────────────────
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

// ── POST /api/apply ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = applicationSchema.parse(body);

    const existing = await db.query.StartupApplicationsTable.findFirst({
      where: (t, { eq }) => eq(t.email, data.email),
      columns: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An application with this email already exists", code: "DUPLICATE_EMAIL" },
        { status: 409 }
      );
    }

    const now = new Date();
    const [application] = await db
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
        capitalRequested:  data.capitalRequested  || null,
        status:            "SUBMITTED",
        createdAt:         now,
        updatedAt:         now,
      })
      .returning();

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
    } catch (emailError) {
      console.error("[apply] confirmation email failed:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      applicationId: application.id,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[apply] submission error:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}

// ── GET /api/apply?email= ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email parameter required" }, { status: 400 });
  }
  try {
    const application = await db.query.StartupApplicationsTable.findFirst({
      where: (t, { eq }) => eq(t.email, email),
      columns: {
        id: true, companyName: true, status: true,
        createdAt: true, reviewedAt: true, reviewNotes: true,
      },
    });
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    return NextResponse.json({ application });
  } catch (error) {
    console.error("[apply] status check error:", error);
    return NextResponse.json({ error: "Failed to check application status" }, { status: 500 });
  }
}