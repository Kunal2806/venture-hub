import { auth } from "@/auth";
import { InvestorProfileForm } from "@/components/investor/profile/InvestorProfileForm";
import { db } from "@/db";
import { InvestorProfilesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";


export const metadata = {
  title: "Investor Profile | VentureHub",
  description: "Manage your investor profile on VentureHub.",
};

export default async function InvestorProfilePage() {
  // ── Auth guard ──────────────────────────────────────────────────────
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "INVESTOR") {
    // Send non-investors to their own dashboard variant
    redirect("/dashboard");
  }

  // ── Load existing profile (null if first visit) ─────────────────────
  const [profile] = await db
    .select()
    .from(InvestorProfilesTable)
    .where(eq(InvestorProfilesTable.userId, session.user.id))
    .limit(1);

  const existingProfile = profile ?? null;

  // ── Approval status badge ───────────────────────────────────────────
  const statusConfig = {
    PENDING: {
      label: "Pending Review",
      classes: "bg-amber-50 text-amber-700 border border-amber-200",
    },
    APPROVED: {
      label: "Approved",
      classes: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    REJECTED: {
      label: "Rejected",
      classes: "bg-red-50 text-red-700 border border-red-200",
    },
    SUSPENDED: {
      label: "Suspended",
      classes: "bg-stone-100 text-stone-600 border border-stone-200",
    },
  } as const;

  const approvalStatus = existingProfile?.approvalStatus ?? "PENDING";
  const badge = statusConfig[approvalStatus];

  return (
    <main className="min-h-screen bg-[#F9F7F2] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">

        {/* ── Header ── */}
        <header className="mb-10 border-b border-[#1A362B]/10 pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#1A362B]/40">
                Investor Dashboard
              </p>
              <h1 className="font-serif text-4xl font-medium text-[#1A362B]">
                Your Profile
              </h1>
              <p className="mt-2 text-base text-[#2D2D2D]/60">
                {existingProfile
                  ? "Update your investor information below."
                  : "Complete your profile to start sending expressions of interest."}
              </p>
            </div>

            {/* Approval status badge */}
            <span
              className={`mt-1 inline-flex h-fit items-center rounded px-3 py-1 text-xs font-semibold uppercase tracking-wider ${badge.classes}`}
            >
              {badge.label}
            </span>
          </div>
        </header>

        {/* ── Suspension notice ── */}
        {approvalStatus === "SUSPENDED" && existingProfile?.suspensionReason && (
          <div
            role="alert"
            className="mb-8 border-l-2 border-red-400 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            <span className="font-semibold">Account suspended:</span>{" "}
            {existingProfile.suspensionReason}
          </div>
        )}

        {/* ── Form card ── */}
        <section
          className="bg-white p-6 sm:p-10"
          aria-labelledby="profile-form-heading"
        >
          <h2
            id="profile-form-heading"
            className="mb-8 text-xs font-bold uppercase tracking-widest text-[#1A362B]/40"
          >
            Basic Information
          </h2>

          <InvestorProfileForm profile={existingProfile} />
        </section>

        {/* ── Read-only meta (shown only after profile exists) ── */}
        {existingProfile && (
          <aside
            className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3"
            aria-label="Profile metadata"
          >
            <MetaCard
              label="Total Investments"
              value={String(existingProfile.totalInvestments ?? 0)}
            />
            <MetaCard
              label="Verified"
              value={existingProfile.isVerified ? "Yes" : "No"}
            />
            <MetaCard
              label="Member Since"
              value={existingProfile.createdAt.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
          </aside>
        )}
      </div>
    </main>
  );
}

// ── Small read-only stat card ───────────────────────────────────────────────
function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#1A362B]/10 bg-[#EFEBE3] p-4">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#1A362B]/40">
        {label}
      </p>
      <p className="text-base font-medium text-[#1A362B]">{value}</p>
    </div>
  );
}