import { auth } from "@/auth";
import InvestorProfileForm from "@/components/investor/profile/InvestorProfileForm";
import { db } from "@/db";
import { InvestorProfilesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Investor Profile | VentureHub",
  description: "Manage your investor profile on VentureHub.",
};

export default async function InvestorProfilePage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "INVESTOR") redirect("/dashboard");

  const [profile] = await db
    .select()
    .from(InvestorProfilesTable)
    .where(eq(InvestorProfilesTable.userId, session.user.id))
    .limit(1);

  return <InvestorProfileForm profile={profile ?? null} />;
}