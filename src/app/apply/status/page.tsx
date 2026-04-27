"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Navigation } from "@/components/home/Navigation";
import { Footer } from "@/components/home/Footer";
import {
  Search,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  ArrowRight,
  Mail,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
type AppType = "startup" | "mentor";

interface Application {
  id: string;
  type: AppType;
  name: string;
  email: string;
  status: AppStatus;
  submittedAt: string;
  reason?: string; // only present when REJECTED
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<
  AppStatus,
  {
    label: string;
    color: string;
    bg: string;
    icon: React.ReactNode;
    message: string;
  }
> = {
  SUBMITTED: {
    label: "Submitted",
    color: "text-gray-500",
    bg: "bg-gray-100",
    icon: <FileText className="w-4 h-4" />,
    message:
      "Your application has been received and is awaiting review. We'll be in touch soon.",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "text-blue-600",
    bg: "bg-blue-50",
    icon: <Clock className="w-4 h-4" />,
    message:
      "Your application is currently being reviewed by our team. This typically takes 3–5 business days.",
  },
  APPROVED: {
    label: "Approved",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    icon: <CheckCircle className="w-4 h-4" />,
    message:
      "Congratulations! Your application has been approved. You can now log in to your dashboard.",
  },
  REJECTED: {
    label: "Not Approved",
    color: "text-red-500",
    bg: "bg-red-50",
    icon: <XCircle className="w-4 h-4" />,
    message: "Unfortunately your application was not approved at this time.",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AppStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${meta.color} ${meta.bg}`}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

// ─── Application Card ─────────────────────────────────────────────────────────

function ApplicationCard({ app }: { app: Application }) {
  const meta = STATUS_META[app.status];

  return (
    <div className="bg-white/40 backdrop-blur-sm border border-forest/5 shadow-lg rounded-lg p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-forest/40 font-bold mb-1">
            {app.type === "startup" ? "Startup Application" : "Mentor Application"}
          </p>
          <h2 className="font-serif text-2xl text-forest">{app.name}</h2>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {/* Divider */}
      <div className="border-t border-forest/10" />

      {/* Details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-forest/40 uppercase tracking-wider text-xs font-bold mb-1">
            Email
          </p>
          <p className="text-forest/80">{app.email}</p>
        </div>
        <div>
          <p className="text-forest/40 uppercase tracking-wider text-xs font-bold mb-1">
            Submitted
          </p>
          <p className="text-forest/80">{formatDate(app.submittedAt)}</p>
        </div>
        <div>
          <p className="text-forest/40 uppercase tracking-wider text-xs font-bold mb-1">
            Application ID
          </p>
          <p className="text-forest/60 font-mono text-xs">{app.id}</p>
        </div>
      </div>

      {/* Status message */}
      <div
        className={`flex items-start gap-3 px-4 py-3 rounded-lg text-sm ${meta.bg}`}
      >
        <span className={`mt-0.5 flex-shrink-0 ${meta.color}`}>{meta.icon}</span>
        <p className={`${meta.color} leading-relaxed`}>
          {meta.message}
          {app.status === "REJECTED" && app.reason && (
            <>
              <br />
              <span className="font-bold mt-1 inline-block">
                Reason: {app.reason}
              </span>
            </>
          )}
        </p>
      </div>

      {/* CTA for approved */}
      {app.status === "APPROVED" && (
        <a
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-forest text-white font-bold uppercase text-xs tracking-[0.2em] hover:bg-forest/90 transition-colors rounded-lg"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApplicationStatusPage() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(searchParams?.get("email") ?? "");
  const [query, setQuery] = useState(searchParams?.get("email") ?? "");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-search if email came from query param
  useEffect(() => {
    if (query) handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch() {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(false);
    setApplications([]);

    try {
      // Replace this URL with your actual API endpoint
      const res = await fetch(
        `/api/applications/status?email=${encodeURIComponent(query.trim())}`
      );

      if (!res.ok) {
        throw new Error("Something went wrong. Please try again.");
      }

      const data: { applications: Application[] } = await res.json();
      setApplications(data.applications ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation activeItem="startups" />

      <main className="flex-1 pt-24 sm:pt-32 pb-20 sm:pb-40 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">

          {/* Page heading */}
          <div className="text-center mb-12 reveal">
            <div className="w-20 h-20 bg-forest/10 rounded-full flex items-center justify-center text-forest mx-auto mb-6">
              <Search className="w-10 h-10" />
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl text-forest mb-4">
              Application Status
            </h1>
            <p className="text-forest/70 text-lg max-w-xl mx-auto">
              Enter the email address you used to apply and we'll show you the
              current status of your application.
            </p>
          </div>

          {/* Search card */}
          <div className="bg-white/40 backdrop-blur-sm p-8 sm:p-10 border border-forest/5 shadow-2xl rounded-lg reveal animation-delay-150 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-forest/50" />
              <label className="text-xs font-bold uppercase tracking-widest text-forest/50">
                Your email address
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setQuery(email);
                    handleSearch();
                  }
                }}
                className="flex-1 px-4 py-3 border border-forest/20 rounded-lg text-sm text-forest placeholder-forest/30 outline-none focus:border-forest/50 transition-colors bg-white/60"
              />
              <button
                onClick={() => {
                  setQuery(email);
                  handleSearch();
                }}
                disabled={!email.trim() || loading}
                className="px-8 py-3 bg-forest text-white font-bold uppercase text-xs tracking-[0.2em] hover:bg-forest/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 flex-shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Check Status
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          {loading && (
            <div className="text-center py-16 text-forest/50">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
              <p className="text-sm">Looking up your application…</p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-6 py-5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!loading && searched && !error && applications.length === 0 && (
            <div className="bg-white/40 backdrop-blur-sm border border-forest/5 shadow-lg rounded-lg px-8 py-12 text-center">
              <div className="w-14 h-14 bg-forest/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-forest/30" />
              </div>
              <h3 className="font-serif text-xl text-forest mb-2">
                No application found
              </h3>
              <p className="text-forest/50 text-sm max-w-sm mx-auto">
                We couldn't find any application linked to{" "}
                <span className="text-forest/70 font-medium">{query}</span>.
                Double-check the email address or{" "}
                <a href="/apply" className="underline underline-offset-2 hover:text-forest transition-colors">
                  submit a new application
                </a>
                .
              </p>
            </div>
          )}

          {!loading && applications.length > 0 && (
            <div className="space-y-6">
              {applications.length > 1 && (
                <p className="text-forest/50 text-sm text-center">
                  We found {applications.length} applications linked to your email.
                </p>
              )}
              {applications.map((app) => (
                <ApplicationCard key={app.id} app={app} />
              ))}
            </div>
          )}

          {/* Help section */}
          <div className="mt-12 text-center reveal animation-delay-300">
            <p className="text-forest/40 text-sm">
              Need help?{" "}
              <a
                href="mailto:support@venturehub.com"
                className="text-forest/60 underline underline-offset-2 hover:text-forest transition-colors"
              >
                Contact our support team
              </a>
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}