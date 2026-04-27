// actions/registerUser.ts
"use server";

import { sendEmail } from "@/lib/mailer";
import { generateEmailVerificationToken } from "@/lib/token";
import { RegisterUserSchema } from "@/validaton-schema";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createUser, findUserByEmail } from "./user";

// ── Email template ─────────────────────────────────────────────────────────
function buildWelcomeEmail(name: string, activationUrl: string) {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#F9F7F2;border-radius:16px;overflow:hidden;">
      <div style="background:#1A362B;padding:32px 36px;">
        <h1 style="margin:0;font-size:22px;color:#F9F7F2;font-weight:700;letter-spacing:-0.3px;">VentureHub</h1>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(249,247,242,0.55);">Startup Ecosystem Platform</p>
      </div>
      <div style="padding:36px;">
        <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A362B;">Welcome to VentureHub, ${name}! 🎉</p>
        <p style="margin:0 0 24px;font-size:15px;color:#4A5D4E;line-height:1.65;">
          Your account has been created. Activate it now to complete your profile and start connecting
          with investors, mentors, and the broader VentureHub ecosystem.
        </p>

        <a href="${activationUrl}"
          style="display:inline-block;background:#1A362B;color:#F9F7F2;text-decoration:none;
                 padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.02em;">
          Activate My Account →
        </a>

        <p style="margin:20px 0 0;font-size:12px;color:#4A5D4E;line-height:1.5;">
          This link expires in <strong>7 days</strong>. If you did not create a VentureHub account,
          you can safely ignore this email.
        </p>
        <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">
          Or copy this URL: <span style="color:#1A362B;">${activationUrl}</span>
        </p>
      </div>
      <div style="padding:20px 36px;border-top:1px solid #EFEBE3;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} VentureHub · venturehub.io</p>
      </div>
    </div>
  `;
}

// ── Action ─────────────────────────────────────────────────────────────────
export async function registerUser(values: z.infer<typeof RegisterUserSchema>) {
  const validation = RegisterUserSchema.safeParse(values);
  if (!validation.success) {
    return { error: "Invalid fields!" } as const;
  }

  const { email, name, password, mobile, role } = validation.data;

  const existingUser = await findUserByEmail(email!);
  if (existingUser) {
    return { error: "User with this email already exists!" } as const;
  }

  const hashedPassword = await bcrypt.hash(password!, 10);
  await createUser({
    name,
    email,
    password: hashedPassword,
    mobile,
    role: role || "INVESTOR",
  });

  const verificationToken = await generateEmailVerificationToken(email);
  if (verificationToken) {
    const base = `${process.env.NEXT_PUBLIC_BASE_URL}${process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_ENDPOINT}`;
    const url  = `${base}?token=${verificationToken.token}`;

    await sendEmail(
      "VentureHub",
      verificationToken.email,
      "Activate your VentureHub account",
      buildWelcomeEmail(name ?? "there", url)
    );

    return { success: "Account created! Check your inbox to activate it." } as const;
  }

  return { error: "Account created but activation email failed. Please contact support." } as const;
}