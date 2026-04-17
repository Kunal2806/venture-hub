"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, XCircle, Clock, Eye, Search,
  GraduationCap, RefreshCw, ChevronDown,
} from "lucide-react";

type ApplicationStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

interface MentorApplication {
  id: string;
  fullName: string;
  email: string;
  mobile: string | null;
  linkedinUrl: string | null;
  currentRole: string;
  company: string;
  yearsOfExperience: number;
  domains: string[];
  bio: string;
  status: ApplicationStatus;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  SUBMITTED:    { label: "Submitted",    color: "bg-blue-50 text-blue-700 border-blue-200",         icon: <Clock className="h-3 w-3" /> },
  UNDER_REVIEW: { label: "Under Review", color: "bg-amber-50 text-amber-700 border-amber-200",      icon: <Eye className="h-3 w-3" /> },
  APPROVED:     { label: "Approved",     color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  REJECTED:     { label: "Rejected",     color: "bg-red-50 text-red-700 border-red-200",            icon: <XCircle className="h-3 w-3" /> },
};

// ── Shared helper: calls PATCH /api/admin/mentor-applications ─────────────
async function patchApplication(
  id: string,
  action: "approve" | "reject" | "under_review",
  reviewNotes?: string
) {
  return fetch("/api/admin/mentor-applications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, action, reviewNotes }),
  });
}

export default function AdminMentorApplicationsPage() {
  const [applications, setApplications]   = useState<MentorApplication[]>([]);
  const [loading, setLoading]             = useState(true);
  const [statusFilter, setStatusFilter]   = useState<ApplicationStatus | "ALL">("ALL");
  const [search, setSearch]               = useState("");
  const [selectedApp, setSelectedApp]     = useState<MentorApplication | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal]     = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason]   = useState("");

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res  = await fetch(`/api/admin/mentor-applications?${params}`);
      const data = await res.json();
      // Route returns { data: [...], meta: {...} }
      setApplications(data.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleMarkUnderReview = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await patchApplication(id, "under_review");
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to mark as under review");
        return;
      }
      await fetchApplications();
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await patchApplication(id, "approve");
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to approve");
        return;
      }
      await fetchApplications();
      if (selectedApp?.id === id) setSelectedApp(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    try {
      const res = await patchApplication(rejectModal.id, "reject", rejectReason || undefined);
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to reject");
        return;
      }
      await fetchApplications();
      if (selectedApp?.id === rejectModal.id) setSelectedApp(null);
      setRejectModal(null);
      setRejectReason("");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Derived counts ───────────────────────────────────────────────────────
  const counts = {
    ALL:          applications.length,
    SUBMITTED:    applications.filter(a => a.status === "SUBMITTED").length,
    UNDER_REVIEW: applications.filter(a => a.status === "UNDER_REVIEW").length,
    APPROVED:     applications.filter(a => a.status === "APPROVED").length,
    REJECTED:     applications.filter(a => a.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6" style={{ fontFamily: "'Satoshi', sans-serif" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-5 w-5 text-[#1A362B]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#4A5D4E]">Admin</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A362B]" style={{ fontFamily: "'Gambetta', serif" }}>
            Mentor Applications
          </h1>
          <p className="text-sm text-[#4A5D4E] mt-1">Review and approve mentors before they access the platform.</p>
        </div>
        <button
          onClick={fetchApplications}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1A362B] border border-[#1A362B]/20 rounded-lg hover:bg-[#1A362B]/5 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const).map(s => (
          <button key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
              statusFilter === s
                ? "bg-[#1A362B] text-white border-[#1A362B]"
                : "bg-white text-[#4A5D4E] border-[#1A362B]/10 hover:border-[#1A362B]/30"
            }`}
          >
            {s === "ALL" ? "All" : STATUS_CONFIG[s].label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === s ? "bg-white/20" : "bg-[#1A362B]/8"}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A5D4E]/40" />
        <input
          type="text"
          placeholder="Search by name, email, company…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-[#1A362B]/10 rounded-xl text-sm text-[#2D2D2D] placeholder:text-[#4A5D4E]/40 focus:outline-none focus:border-[#1A362B]/40 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications list */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#1A362B]/8 p-12 flex items-center justify-center">
              <div className="animate-spin h-6 w-6 border-2 border-[#1A362B] border-t-transparent rounded-full" />
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#1A362B]/8 p-12 text-center">
              <GraduationCap className="h-10 w-10 text-[#1A362B]/20 mx-auto mb-3" />
              <p className="text-sm text-[#4A5D4E]">No applications found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#1A362B]/8 overflow-hidden">
              <div className="divide-y divide-[#EFEBE3]">
                {applications.map(app => {
                  const sc         = STATUS_CONFIG[app.status];
                  const isSelected = selectedApp?.id === app.id;
                  const isLoading  = actionLoading === app.id;

                  return (
                    <div
                      key={app.id}
                      className={`p-5 hover:bg-[#F9F7F2] transition-colors cursor-pointer ${isSelected ? "bg-[#F9F7F2] border-l-2 border-[#1A362B]" : ""}`}
                      onClick={() => setSelectedApp(isSelected ? null : app)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#1A362B] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {app.fullName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#2D2D2D] truncate">{app.fullName}</p>
                            <p className="text-xs text-[#4A5D4E] truncate">{app.currentRole} · {app.company}</p>
                            <p className="text-[11px] text-[#4A5D4E]/60 mt-0.5">{app.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${sc.color}`}>
                            {sc.icon} {sc.label}
                          </span>
                          <ChevronDown className={`h-4 w-4 text-[#4A5D4E] transition-transform ${isSelected ? "rotate-180" : ""}`} />
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-[#EFEBE3] space-y-3 animate-fade-in">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-[#4A5D4E] uppercase tracking-wider text-[10px]">Experience</p>
                              <p className="font-semibold text-[#2D2D2D]">{app.yearsOfExperience} years</p>
                            </div>
                            <div>
                              <p className="text-[#4A5D4E] uppercase tracking-wider text-[10px]">Applied</p>
                              <p className="font-semibold text-[#2D2D2D]">
                                {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                            {app.linkedinUrl && (
                              <div className="col-span-2">
                                <p className="text-[#4A5D4E] uppercase tracking-wider text-[10px]">LinkedIn</p>
                                <a
                                  href={app.linkedinUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#1A362B] font-medium hover:underline truncate block"
                                  onClick={e => e.stopPropagation()}
                                >
                                  {app.linkedinUrl}
                                </a>
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="text-[#4A5D4E] uppercase tracking-wider text-[10px] mb-1.5">Domains</p>
                            <div className="flex flex-wrap gap-1.5">
                              {app.domains.map(d => (
                                <span key={d} className="px-2 py-0.5 bg-[#1A362B]/8 text-[#1A362B] text-[11px] font-medium rounded-md">{d}</span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-[#4A5D4E] uppercase tracking-wider text-[10px] mb-1">Bio</p>
                            <p className="text-xs text-[#4A5D4E] leading-relaxed line-clamp-3">{app.bio}</p>
                          </div>

                          {/* Action buttons — only for actionable statuses */}
                          {(app.status === "SUBMITTED" || app.status === "UNDER_REVIEW") && (
                            <div className="flex gap-2 pt-2">
                              {app.status === "SUBMITTED" && (
                                <button
                                  onClick={e => { e.stopPropagation(); handleMarkUnderReview(app.id); }}
                                  disabled={!!isLoading}
                                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                                >
                                  <Eye className="h-3.5 w-3.5" /> Mark Under Review
                                </button>
                              )}
                              <button
                                onClick={e => { e.stopPropagation(); handleApprove(app.id); }}
                                disabled={!!isLoading}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#1A362B] rounded-lg hover:bg-[#1A362B]/90 transition-colors disabled:opacity-50"
                              >
                                {isLoading
                                  ? <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  : <CheckCircle2 className="h-3.5 w-3.5" />
                                }
                                Approve
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); setRejectModal({ id: app.id, name: app.fullName }); }}
                                disabled={!!isLoading}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </button>
                            </div>
                          )}

                          {app.reviewNotes && (
                            <div className="bg-[#EFEBE3] rounded-lg p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#4A5D4E] mb-1">Review Notes</p>
                              <p className="text-xs text-[#4A5D4E]">{app.reviewNotes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#1A362B]/8 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A362B] mb-4">Pipeline Overview</h3>
            <div className="space-y-3">
              {(["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"] as ApplicationStatus[]).map(s => {
                const sc  = STATUS_CONFIG[s];
                const cnt = counts[s];
                const pct = counts.ALL > 0 ? Math.round((cnt / counts.ALL) * 100) : 0;
                return (
                  <div key={s}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </span>
                      <span className="text-xs font-bold text-[#2D2D2D]">{cnt}</span>
                    </div>
                    <div className="h-1 bg-[#EFEBE3] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1A362B] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#1A362B] rounded-2xl p-5 text-white">
            <GraduationCap className="h-5 w-5 opacity-60 mb-3" />
            <p className="font-bold text-lg" style={{ fontFamily: "'Gambetta', serif" }}>Quality Gate</p>
            <p className="text-xs opacity-60 mt-1 leading-relaxed">
              Every mentor is reviewed before gaining platform access. Approved mentors receive an
              activation email and can start accepting session requests immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setRejectModal(null); setRejectReason(""); }}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#1A362B] mb-1" style={{ fontFamily: "'Gambetta', serif" }}>
              Reject Application
            </h3>
            <p className="text-sm text-[#4A5D4E] mb-4">
              You're rejecting <strong>{rejectModal.name}</strong>. Optionally add a reason — it will be included in the applicant's email and saved in the audit log.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full border border-[#1A362B]/20 rounded-xl px-4 py-3 text-sm text-[#2D2D2D] resize-none focus:outline-none focus:border-[#1A362B]/50 transition-colors"
              placeholder="Not enough experience, domain mismatch…"
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#4A5D4E] border border-[#1A362B]/10 rounded-lg hover:bg-[#F9F7F2] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.id}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === rejectModal.id
                  ? <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <XCircle className="h-3.5 w-3.5" />
                }
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}