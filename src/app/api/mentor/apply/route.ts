import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { MentorApplicationsTable } from "@/db/schema";
import { z } from "zod";
import { sendEmail } from "@/lib/mailer";
import { randomUUID } from "crypto";

// ── Validation schema ──────────────────────────────────────────────────────
const mentorApplicationSchema = z.object({
  fullName:          z.string().min(2, "Full name is required"),
  email:             z.string().email("Valid email is required"),
  mobile:            z.string().optional(),
  linkedinUrl:       z.string().url().optional().or(z.literal("")),
  currentRole:       z.string().min(2, "Current role is required"),
  company:           z.string().min(2, "Company is required"),
  yearsOfExperience: z.number().int().min(1).max(60),
  domains:           z.array(z.string()).min(1, "Select at least one domain"),
  bio:               z.string().min(80, "Bio must be at least 80 characters"),
});

// ── Email template ─────────────────────────────────────────────────────────
function buildSubmissionEmail(
  fullName: string,
  applicationId: string,
  submittedAt: string,
) {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#F9F7F2;border-radius:16px;overflow:hidden;">
      <div style="background:#1A362B;padding:32px 36px;">
        <h1 style="margin:0;font-size:22px;color:#F9F7F2;font-weight:700;letter-spacing:-0.3px;">VentureHub</h1>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(249,247,242,0.55);">Mentor Network</p>
      </div>
      <div style="padding:36px;">
        <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1A362B;">Application received, ${fullName}!</p>
        <p style="margin:0 0 24px;font-size:15px;color:#4A5D4E;line-height:1.65;">
          Thank you for applying to join the VentureHub mentor network.
          Our team reviews each application carefully — we'll get back to you within <strong>5–7 business days</strong>.
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
            ["If approved, activate your account & set your availability", "Instant access"],
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
          © ${new Date().getFullYear()} VentureHub · You're receiving this because you applied to mentor on venturehub.io
        </p>
      </div>
    </div>
  `;
}

// ── POST /api/mentor/apply ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = mentorApplicationSchema.parse(body);

    const existing = await db.query.MentorApplicationsTable.findFirst({
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
      .insert(MentorApplicationsTable)
      .values({
        id:                randomUUID(),
        fullName:          data.fullName,
        email:             data.email,
        mobile:            data.mobile            || null,
        linkedinUrl:       data.linkedinUrl       || null,
        currentRole:       data.currentRole,
        company:           data.company,
        yearsOfExperience: data.yearsOfExperience,
        domains:           data.domains,
        bio:               data.bio,
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
        `We received your mentor application — VentureHub`,
        buildSubmissionEmail(data.fullName, application.id, submittedAt)
      );
    } catch (emailError) {
      console.error("[mentor/apply] confirmation email failed:", emailError);
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
    console.error("[mentor/apply] error:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}

// ── GET /api/mentor/apply?email= ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email parameter required" }, { status: 400 });
  }
  try {
    const application = await db.query.MentorApplicationsTable.findFirst({
      where: (t, { eq }) => eq(t.email, email),
      columns: {
        id: true, fullName: true, status: true,
        createdAt: true, reviewedAt: true, reviewNotes: true,
      },
    });
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    return NextResponse.json({ application });
  } catch (error) {
    console.error("[mentor/apply] status check error:", error);
    return NextResponse.json({ error: "Failed to check application status" }, { status: 500 });
  }
}