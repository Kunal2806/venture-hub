import { auth } from "@/auth";
import { db } from "@/db";
import { InvestorProfilesTable } from "@/db/schema";
import { InvestorProfileSchema } from "@/validaton-schema/investor";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "INVESTOR") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const profile = await db.query.InvestorProfilesTable.findFirst({
    where: eq(InvestorProfilesTable.userId, session.user.id),
  });

  return NextResponse.json(profile ?? null);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (session.user.role !== "INVESTOR") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const body = await req.json();

  // ✅ Validate with Zod
  const parsed = InvestorProfileSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};

    parsed.error.errors.forEach((err) => {
      const key = err.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(err.message);
    });

    return NextResponse.json(
      {
        error: "Validation failed",
        fieldErrors,
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const userId = session.user.id;

  await db
    .insert(InvestorProfilesTable)
    .values({
      userId,
      firmName: data.firmName || null,
      designation: data.designation || null,
      bio: data.bio || null,
      linkedinUrl: data.linkedinUrl || null,
      websiteUrl: data.websiteUrl || null,
      investorType: data.investorType,
      preferredSectors: data.preferredSectors,
      preferredStages: data.preferredStages,
      preferredGeographies: data.preferredGeographies ?? [],
      ticketSizeMin: data.ticketSizeMin?.toString() ?? null,
      ticketSizeMax: data.ticketSizeMax?.toString() ?? null,
      investmentThesis: data.investmentThesis || null,
      impactFocused: data.impactFocused ?? false,
    })
    .onConflictDoUpdate({
      target: InvestorProfilesTable.userId,
      set: {
        firmName: data.firmName || null,
        designation: data.designation || null,
        bio: data.bio || null,
        linkedinUrl: data.linkedinUrl || null,
        websiteUrl: data.websiteUrl || null,
        investorType: data.investorType,
        preferredSectors: data.preferredSectors,
        preferredStages: data.preferredStages,
        preferredGeographies: data.preferredGeographies ?? [],
        ticketSizeMin: data.ticketSizeMin?.toString() ?? null,
        ticketSizeMax: data.ticketSizeMax?.toString() ?? null,
        investmentThesis: data.investmentThesis || null,
        impactFocused: data.impactFocused ?? false,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ success: true });
}