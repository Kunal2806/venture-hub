// app/api/admin/investor-applications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  InvestorApplicationsTable,
  UsersTable,
  InvestorProfilesTable,
} from "@/db/schema";
import { eq, desc, and, ilike, or, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sendEmail } from "@/lib/mailer";
import bcrypt from "bcryptjs";

// ── Guard ──────────────────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session.user;
}

// ── Temp password generator ────────────────────────────────────────────────
function generateTempPassword(): string {
  const upper   = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower   = "abcdefghjkmnpqrstuvwxyz";
  const digits  = "23456789";
  const special = "#@!$";
  const all     = upper + lower + digits + special;
  const rand    = (set: string) => set[Math.floor(Math.random() * set.length)];
  const required = [rand(upper), rand(lower), rand(digits), rand(special)];
  const rest     = Array.from({ length: 4 }, () => rand(all));
  return [...required, ...rest].sort(() => Math.random() - 0.5).join("");
}

// ── Email templates ────────────────────────────────────────────────────────

function buildCredentialsEmail(
  name: string,
  email: string,
  tempPassword: string,
  loginUrl: string,
  reviewNotes?: string
) {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;
                background:#F9F7F2;border-radius:16px;overflow:hidden;">
      <div style="background:#1A362B;padding:32px 36px;">
        <h1 style="margin:0;font-size:22px;color:#F9F7F2;font-weight:700;letter-spacing:-0.3px;">VentureHub</h1>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(249,247,242,0.55);">Startup Ecosystem Platform</p>
      </div>
      <div style="padding:36px;">
        <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1A362B;">Welcome aboard, ${name}! 🎉</p>
        <p style="margin:0 0 24px;font-size:15px;color:#4A5D4E;line-height:1.65;">
          Your <strong>Investor</strong> account on VentureHub has been approved.
          Use the credentials below to log in — you'll be prompted to set a new password on your first login.
        </p>
        ${reviewNotes ? `
        <div style="background:#EFEBE3;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#4A5D4E;">Note from our team</p>
          <p style="margin:0;font-size:14px;color:#2D2D2D;line-height:1.5;">${reviewNotes}</p>
        </div>
        ` : ""}
        <div style="background:white;border-radius:12px;border:1px solid #EFEBE3;padding:24px;margin-bottom:28px;">
          <p style="margin:0 0 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#4A5D4E;">Your Login Credentials</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#4A5D4E;width:38%;border-bottom:1px solid #F9F7F2;">Email</td>
              <td style="padding:8px 0;font-size:13px;color:#2D2D2D;font-weight:600;border-bottom:1px solid #F9F7F2;">${email}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#4A5D4E;">Temporary Password</td>
              <td style="padding:8px 0;">
                <code style="background:#F9F7F2;color:#1A362B;font-size:15px;font-weight:700;
                              padding:4px 10px;border-radius:6px;letter-spacing:0.05em;font-family:monospace;">${tempPassword}</code>
              </td>
            </tr>
          </table>
        </div>
        <a href="${loginUrl}"
           style="display:inline-block;background:#1A362B;color:#F9F7F2;text-decoration:none;
                  padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.02em;">
          Log In to VentureHub →
        </a>
        <div style="background:#fef3c7;border-radius:10px;padding:14px 18px;margin-top:24px;border-left:3px solid #f59e0b;">
          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
            <strong>⚠ Change your password immediately</strong> after logging in.
            This temporary password expires in <strong>48 hours</strong>.
            Never share your credentials with anyone.
          </p>
        </div>
        <p style="margin:20px 0 0;font-size:12px;color:#4A5D4E;line-height:1.5;">
          Questions? Reach us at
          <a href="mailto:support@venturehub.io" style="color:#1A362B;font-weight:600;">support@venturehub.io</a>
        </p>
      </div>
      <div style="padding:20px 36px;border-top:1px solid #EFEBE3;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">
          © ${new Date().getFullYear()} VentureHub · venturehub.io ·
          You received this because your investor account was approved by an admin.
        </p>
      </div>
    </div>
  `;
}

function buildRejectionEmail(name: string, reviewNotes?: string) {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;
                background:#F9F7F2;border-radius:16px;overflow:hidden;">
      <div style="background:#1A362B;padding:32px 36px;">
        <h1 style="margin:0;font-size:22px;color:#F9F7F2;font-weight:700;">VentureHub</h1>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(249,247,242,0.55);">Startup Ecosystem Platform</p>
      </div>
      <div style="padding:36px;">
        <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1A362B;">Update on your investor application</p>
        <p style="margin:0 0 20px;font-size:15px;color:#4A5D4E;line-height:1.65;">
          Hi ${name}, thank you for applying to join VentureHub as an investor.
          After careful review, we're unable to approve your application at this time.
        </p>
        ${reviewNotes ? `
        <div style="background:#EFEBE3;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#4A5D4E;">Feedback from our team</p>
          <p style="margin:0;font-size:14px;color:#2D2D2D;line-height:1.5;">${reviewNotes}</p>
        </div>
        ` : ""}
        <p style="margin:0;font-size:14px;color:#4A5D4E;line-height:1.6;">
          You're welcome to reapply in the future. If you have questions, reply to this email.
        </p>
      </div>
      <div style="padding:20px 36px;border-top:1px solid #EFEBE3;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} VentureHub · venturehub.io</p>
      </div>
    </div>
  `;
}

function buildUnderReviewEmail(name: string) {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;
                background:#F9F7F2;border-radius:16px;overflow:hidden;">
      <div style="background:#1A362B;padding:32px 36px;">
        <h1 style="margin:0;font-size:22px;color:#F9F7F2;font-weight:700;">VentureHub</h1>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(249,247,242,0.55);">Startup Ecosystem Platform</p>
      </div>
      <div style="padding:36px;">
        <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1A362B;">Your application is under review</p>
        <p style="margin:0 0 20px;font-size:15px;color:#4A5D4E;line-height:1.65;">
          Hi ${name}, our team has started reviewing your investor application.
          We'll send you an email with our decision within 3–5 business days.
        </p>
        <p style="margin:0;font-size:14px;color:#4A5D4E;line-height:1.6;">No action needed from you right now. Thank you for your patience!</p>
      </div>
      <div style="padding:20px 36px;border-top:1px solid #EFEBE3;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} VentureHub · venturehub.io</p>
      </div>
    </div>
  `;
}

// ── GET /api/admin/investor-applications ──────────────────────────────────
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";
  const page   = Math.max(1, parseInt(searchParams.get("page")  || "1", 10));
  const limit  = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status && ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"].includes(status)) {
    conditions.push(
      eq(
        InvestorApplicationsTable.status,
        status as "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED"
      )
    );
  }
  if (search) {
    conditions.push(
      or(
        ilike(InvestorApplicationsTable.name,     `%${search}%`),
        ilike(InvestorApplicationsTable.email,    `%${search}%`),
        ilike(InvestorApplicationsTable.firmName, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [applications, [{ total }]] = await Promise.all([
    db.select()
      .from(InvestorApplicationsTable)
      .where(whereClause)
      .orderBy(desc(InvestorApplicationsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() })
      .from(InvestorApplicationsTable)
      .where(whereClause),
  ]);

  return NextResponse.json({
    data: applications,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

// ── PATCH /api/admin/investor-applications ────────────────────────────────
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, action, reviewNotes } = body as {
    id: string;
    action: "approve" | "reject" | "under_review";
    reviewNotes?: string;
  };

  if (!id || !action) {
    return NextResponse.json({ error: "id and action are required" }, { status: 400 });
  }

  const [application] = await db
    .select()
    .from(InvestorApplicationsTable)
    .where(eq(InvestorApplicationsTable.id, id))
    .limit(1);

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  if (application.status === "APPROVED") {
    return NextResponse.json({ error: "Application already approved" }, { status: 409 });
  }
  if (application.status === "REJECTED") {
    return NextResponse.json({ error: "Application already rejected" }, { status: 409 });
  }

  const now = new Date();

  // ── UNDER REVIEW ──────────────────────────────────────────────────────
  if (action === "under_review") {
    await db.update(InvestorApplicationsTable).set({
      status:      "UNDER_REVIEW",
      reviewedBy:  admin.id,
      reviewNotes: reviewNotes || null,
      reviewedAt:  now,
      updatedAt:   now,
    }).where(eq(InvestorApplicationsTable.id, id));

    sendEmail(
      "VentureHub",
      application.email,
      "Your VentureHub investor application is under review",
      buildUnderReviewEmail(application.name)
    ).catch((err) => console.error("[mailer] investor under_review email failed:", err));

    return NextResponse.json({ success: true, status: "UNDER_REVIEW" });
  }

  // ── REJECT ────────────────────────────────────────────────────────────
  if (action === "reject") {
    await db.update(InvestorApplicationsTable).set({
      status:      "REJECTED",
      reviewedBy:  admin.id,
      reviewNotes: reviewNotes || null,
      reviewedAt:  now,
      updatedAt:   now,
    }).where(eq(InvestorApplicationsTable.id, id));

    sendEmail(
      "VentureHub",
      application.email,
      "Update on your VentureHub investor application",
      buildRejectionEmail(application.name, reviewNotes)
    ).catch((err) => console.error("[mailer] investor rejection email failed:", err));

    return NextResponse.json({ success: true, status: "REJECTED" });
  }

  // ── APPROVE ───────────────────────────────────────────────────────────
  if (action === "approve") {
    const [existingUser] = await db
      .select({ id: UsersTable.id })
      .from(UsersTable)
      .where(eq(UsersTable.email, application.email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const tempPassword       = generateTempPassword();
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);
    const newUserId          = randomUUID();

    try {
      await db.transaction(async (tx) => {
        // 1. Create user account
        await tx.insert(UsersTable).values({
          id:                 newUserId,
          name:               application.name,
          email:              application.email,
          password:           hashedTempPassword,
          mobile:             application.mobile       || null,
          role:               "INVESTOR",
          isActive:           true,
          emailVerified:      now,
          mustChangePassword: true,
          createdAt:          now,
          updatedAt:          now,
        });

        // 2. Create investor profile — copy all preference fields from application
        await tx.insert(InvestorProfilesTable).values({
          userId:               newUserId,
          firmName:             application.firmName             || null,
          designation:          application.designation          || null,
          investorType:         application.investorType         || null,
          bio:                  application.bio                  || null,
          websiteUrl:           application.websiteUrl           || null,
          linkedinUrl:          application.linkedinUrl          || null,
          country:              application.country              || null,
          city:                 application.city                 || null,
          preferredSectors:     application.preferredSectors,
          preferredStages:      application.preferredStages,
          preferredGeographies: application.preferredGeographies,
          ticketSizeMin:        application.ticketSizeMin        || null,
          ticketSizeMax:        application.ticketSizeMax        || null,
          investmentThesis:     application.investmentThesis     || null,
          impactFocused:        application.impactFocused,
          approvalStatus:       "APPROVED",
          isVerified:           false,
          totalInvestments:     0,
          createdAt:            now,
          updatedAt:            now,
        });

        // 3. Mark application approved and link to the new user
        await tx.update(InvestorApplicationsTable).set({
          status:        "APPROVED",
          reviewedBy:    admin.id,
          reviewNotes:   reviewNotes || null,
          reviewedAt:    now,
          createdUserId: newUserId,
          updatedAt:     now,
        }).where(eq(InvestorApplicationsTable.id, id));
      });
    } catch (err) {
      console.error("[approve investor] transaction failed:", err);
      return NextResponse.json(
        { error: "Failed to create investor account. Please try again." },
        { status: 500 }
      );
    }

    // 4. Send credentials email after transaction commits
    const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`;
    try {
      await sendEmail(
        "VentureHub",
        application.email,
        "You're approved! Here are your VentureHub investor credentials",
        buildCredentialsEmail(
          application.name,
          application.email,
          tempPassword,
          loginUrl,
          reviewNotes
        )
      );
    } catch (err) {
      console.error("[approve investor] credentials email failed:", err);
      return NextResponse.json({
        success: true,
        status: "APPROVED",
        userId: newUserId,
        emailFailed: true,
      });
    }

    return NextResponse.json({ success: true, status: "APPROVED", userId: newUserId });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}