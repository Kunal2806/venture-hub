import { redirect } from "next/navigation";
import { db } from "@/db";
import { StartupProfilesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import ProfileClient from "@/components/startup/profile/ProfileClient";

export const metadata = {
  title: "Complete Your Profile | VentureHub",
};

export default async function StartupProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "STARTUP") {
    redirect("/dashboard");
  }

  const profile = await db.query.StartupProfilesTable.findFirst({
    where: eq(StartupProfilesTable.userId, session.user.id),
  });

  if (!profile) {
    // Profile should exist after admin approval & account creation flow
    redirect("/dashboard");
  }

  return <ProfileClient profile={profile} userId={session.user.id} />;
}