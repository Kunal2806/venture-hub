import { auth } from "@/auth";
import InvestorProfileClient from "@/components/investor/profile/InvestorProfileClient";
import { db } from "@/db";
import { InvestorProfilesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Investor Profile | VentureHub",
  description: "Complete your investor profile on VentureHub.",
};

export default async function InvestorProfilePage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/auth/login");
  if (session.user.role !== "INVESTOR") redirect("/dashboard");

  const [profile] = await db
    .select()
    .from(InvestorProfilesTable)
    .where(eq(InvestorProfilesTable.userId, session.user.id))
    .limit(1);

  if (!profile) redirect("/dashboard");

  return <InvestorProfileClient profile={profile} userId={session.user.id} />;
}