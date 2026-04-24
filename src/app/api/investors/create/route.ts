import { auth } from "@/auth"
import { db } from "@/db"
import { UsersTable, InvestorProfilesTable } from "@/db/schema"
import { sendEmail } from "@/lib/mailer"
import { hash } from "bcryptjs"
import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"

const SEC = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
}

function secureJson(body: unknown, init?: ResponseInit) {
  const res = NextResponse.json(body, init)
  for (const [k, v] of Object.entries(SEC)) res.headers.set(k, v)
  return res
}

const ALLOWED_INVESTOR_TYPES = [
  "ANGEL", "VENTURE_CAPITAL", "PRIVATE_EQUITY",
  "CORPORATE", "FAMILY_OFFICE", "ACCELERATOR",
] as const

// ── Password validation (matches your change-password page rules) ──
function validatePassword(password: string): string | null {
  if (password.length < 8)           return "At least 8 characters required."
  if (!/[a-z]/.test(password))       return "Needs a lowercase letter."
  if (!/[0-9]/.test(password))       return "Needs a number."
  if (!/[^A-Za-z0-9]/.test(password)) return "Needs a special character."
  return null
}

function buildWelcomeEmail(name: string, email: string, loginUrl: string) {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#F9F7F2;border-radius:16px;overflow:hidden;">
      <div style="background:#1A362B;padding:32px 36px;">
        <h1 style="margin:0;font-size:22px;color:#F9F7F2;font-weight:700;">VentureHub</h1>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(249,247,242,0.55);">Startup Ecosystem Platform</p>
      </div>
      <div style="padding:36px;">
        <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1A362B;">Welcome, ${name}!</p>
        <p style="margin:0 0 24px;font-size:15px;color:#4A5D4E;line-height:1.65;">
          Your investor account on VentureHub is ready. Use the credentials below to sign in.
        </p>
        <div style="background:#EFEBE3;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#4A5D4E;">Your Login Details</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:5px 0;font-size:13px;color:#4A5D4E;width:40%;">Email</td>
              <td style="padding:5px 0;font-size:13px;color:#2D2D2D;font-weight:600;">${email}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:13px;color:#4A5D4E;">Password</td>
              <td style="padding:5px 0;font-size:13px;color:#2D2D2D;font-weight:600;">The password set by your admin</td>
            </tr>
          </table>
        </div>
        <a href="${loginUrl}"
          style="display:inline-block;background:#1A362B;color:#F9F7F2;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:0.05em;">
          Sign In to VentureHub
        </a>
        <p style="margin:24px 0 0;font-size:13px;color:#4A5D4E;line-height:1.6;">
          Questions? <a href="mailto:support@venturehub.io" style="color:#1A362B;font-weight:600;">support@venturehub.io</a>
        </p>
      </div>
      <div style="padding:20px 36px;border-top:1px solid #EFEBE3;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} VentureHub</p>
      </div>
    </div>
  `
}

export async function POST(req: NextRequest) {

  // 1. Auth — admin only
  // const session = await auth()
  // if (!session?.user) {
  //   return secureJson({ success: false, message: "Unauthorized." }, { status: 401 })
  // }
  // if (session.user.role !== "ADMIN") {
  //   return secureJson({ success: false, message: "Forbidden: admin only." }, { status: 403 })
  // }

  // 2. Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return secureJson({ success: false, message: "Invalid JSON." }, { status: 400 })
  }

  const raw = body as Record<string, unknown>

  const name        = typeof raw.name        === "string" ? raw.name.trim()                  : ""
  const email       = typeof raw.email       === "string" ? raw.email.trim().toLowerCase()   : ""
  const password    = typeof raw.password    === "string" ? raw.password                     : ""
  const mobile      = typeof raw.mobile      === "string" ? raw.mobile.trim()    || undefined : undefined
  const firmName    = typeof raw.firmName    === "string" ? raw.firmName.trim()  || undefined : undefined
  const designation = typeof raw.designation === "string" ? raw.designation.trim() || undefined : undefined
  const investorType = typeof raw.investorType === "string" ? raw.investorType.trim() : undefined
  const bio         = typeof raw.bio         === "string" ? raw.bio.trim()       || undefined : undefined
  const websiteUrl  = typeof raw.websiteUrl  === "string" ? raw.websiteUrl.trim() || undefined : undefined
  const linkedinUrl = typeof raw.linkedinUrl === "string" ? raw.linkedinUrl.trim() || undefined : undefined
  const country     = typeof raw.country     === "string" ? raw.country.trim()   || undefined : undefined
  const city        = typeof raw.city        === "string" ? raw.city.trim()      || undefined : undefined

  // 3. Validate required fields
  const errors: Record<string, string> = {}

  if (!name)  errors.name = "Name is required."
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = "Valid email is required."
  }

  const passwordError = validatePassword(password)
  if (passwordError) errors.password = passwordError

  if (investorType && !ALLOWED_INVESTOR_TYPES.includes(investorType as any)) {
    errors.investorType = `Invalid investor type.`
  }

  if (Object.keys(errors).length > 0) {
    return secureJson({ success: false, errors }, { status: 422 })
  }

  // 4. Hash password
  const hashedPassword = await hash(password, 12)

  const now    = new Date()
  const userId = randomUUID()

  try {
    // 5. Transaction — user + profile together
    await db.transaction(async (tx) => {

      await tx.insert(UsersTable).values({
        id:                 userId,
        name,
        email,
        mobile:             mobile      ?? null,
        password:           hashedPassword,
        role:               "INVESTOR",
        isActive:           true,
        mustChangePassword: false,
        createdAt:          now,
        updatedAt:          now,
      })

      await tx.insert(InvestorProfilesTable).values({
        userId,
        firmName:             firmName    ?? null,
        designation:          designation ?? null,
        investorType:         investorType as any ?? null,
        bio:                  bio         ?? null,
        websiteUrl:           websiteUrl  ?? null,
        linkedinUrl:          linkedinUrl ?? null,
        country:              country     ?? null,
        city:                 city        ?? null,
        preferredSectors:     [],
        preferredStages:      [],
        preferredGeographies: [],
        impactFocused:        false,
        approvalStatus:       "APPROVED",
        createdAt:            now,
        updatedAt:            now,
      })
    })

  } catch (err) {
    console.error("[admin/investors/create] transaction failed:", err)
    const code = (err as NodeJS.ErrnoException & { code?: string }).code
    if (code === "23505") {
      return secureJson(
        { success: false, message: "An account with this email already exists." },
        { status: 409 }
      )
    }
    return secureJson(
      { success: false, message: "Failed to create account. Please try again." },
      { status: 500 }
    )
  }

  // 6. Send welcome email (non-fatal)
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`
  let emailSent = false
  try {
    await sendEmail(
      "VentureHub",
      email,
      "Your VentureHub investor account is ready",
      buildWelcomeEmail(name, email, loginUrl)
    )
    emailSent = true
  } catch (emailErr) {
    console.error("[admin/investors/create] welcome email failed:", emailErr)
  }

  return secureJson(
    {
      success: true,
      message: "Investor account created successfully.",
      userId,
      emailSent,
      ...(!emailSent && {
        emailWarning: "Welcome email failed to send. Share login credentials manually.",
      }),
    },
    { status: 201 }
  )
}