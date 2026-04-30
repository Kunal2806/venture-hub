import { NextRequest, NextResponse } from "next/server";
import { UsersTable, InvestorProfilesTable } from "@/db/schema"
import { db } from "@/db";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  }

  const existing = await db.query.UsersTable.findFirst({
    where: (t, { eq }) => eq(t.email, email.trim().toLowerCase()),
    columns: { id: true },
  });

  if (existing) {
    return NextResponse.json({ message: "Email already registered" }, { status: 400 });
  }

  return NextResponse.json({ available: true }, { status: 200 });
}