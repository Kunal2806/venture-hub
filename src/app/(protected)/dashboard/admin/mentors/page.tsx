"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import {
  Search, ChevronLeft, ChevronRight,
  ExternalLink, CheckCircle2, XCircle, Clock,
  Loader2, RefreshCw, AlertCircle,
  Mail, Phone, FileText, X,
  ChevronRight as ChevronRightIcon,
  User, TrendingUp, Calendar,
  Filter, GraduationCap, Briefcase, Eye,
  Globe,
} from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────
type AppStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

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
  status: AppStatus;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Constants ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<AppStatus, {
  label: string;
  classes: string;
  dot: string;
  icon: React.ReactNode;
  bg: string;
}> = {
  SUBMITTED: {
    label: "Submitted",
    classes: "bg-blue-50/50 text-blue-700 border-blue-200/50",
    dot: "bg-blue-500",
    icon: <FileText className="h-3 w-3 lg:h-4 lg:w-4" />,
    bg: "bg-blue-50",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    classes: "bg-amber-50/50 text-amber-700 border-amber-200/50",
    dot: "bg-amber-500",
    icon: <Clock className="h-3 w-3 lg:h-4 lg:w-4" />,
    bg: "bg-amber-50",
  },
  APPROVED: {
    label: "Approved",
    classes: "bg-emerald-50/50 text-emerald-700 border-emerald-200/50",
    dot: "bg-emerald-500",
    icon: <CheckCircle2 className="h-3 w-3 lg:h-4 lg:w-4" />,
    bg: "bg-emerald-50",
  },
  REJECTED: {
    label: "Rejected",
    classes: "bg-red-50/50 text-red-600 border-red-200/50",
    dot: "bg-red-500",
    icon: <XCircle className="h-3 w-3 lg:h-4 lg:w-4" />,
    bg: "bg-red-50",
  },
};

const FOREST = "#1A362B";
const BEIGE  = "#EFEBE3";
const CREAM  = "#F9F7F2";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtRelativeDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return fmtDate(iso);
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function MentorApplicationsPage() {
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppStatus | "">("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MentorApplication | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: "20",
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/mentor-applications?${params}`);
      const json = await res.json();
      setApplications(json.data || []);
      setMeta(json.meta || { total: 0, page: 1, limit: 20, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  const fetchCounts = useCallback(async () => {
    try {
      const statuses: AppStatus[] = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"];
      const results = await Promise.all(
        statuses.map((s) =>
          fetch(`/api/admin/mentor-applications?status=${s}&limit=1`)
            .then((r) => r.json())
            .then((j) => ({ status: s, count: j.meta?.total || 0 }))
        )
      );
      const map: Record<string, number> = {};
      results.forEach(({ status, count }) => { map[status] = count; });
      setCounts(map);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const openDrawer = (app: MentorApplication) => {
    setSelected(app);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelected(null), 300);
  };

  const handleAction = async (
    app: MentorApplication,
    action: "approve" | "reject" | "under_review",
    notes: string
  ) => {
    startTransition(async () => {
      const res = await fetch("/api/admin/mentor-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: app.id, action, reviewNotes: notes }),
      });
      if (res.ok) { closeDrawer(); fetchApplications(); fetchCounts(); }
    });
  };

  const tabs: { label: string; value: AppStatus | "" }[] = [
    { label: "All Applications", value: "" },
    { label: "Submitted",        value: "SUBMITTED" },
    { label: "Under Review",     value: "UNDER_REVIEW" },
    { label: "Approved",         value: "APPROVED" },
    { label: "Rejected",         value: "REJECTED" },
  ];

  return (
    <>
      <div
        className="space-y-5 lg:space-y-6 transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] px-1 lg:px-0"
        style={{ marginRight: drawerOpen ? "424px" : "0" }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs lg:text-sm">
          <Link href="/dashboard/admin" className="text-[#1A362B]/50 hover:text-[#1A362B] transition-colors">
            Dashboard
          </Link>
          <ChevronRightIcon className="h-3 w-3 lg:h-4 lg:w-4 text-[#1A362B]/30" />
          <span className="text-[#1A362B] font-medium">Mentor Applications</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl lg:text-3xl text-[#1A362B]">Mentor Applications</h1>
            <p className="text-xs lg:text-sm text-[#1A362B]/50 mt-1">
              {meta.total} total · {counts["SUBMITTED"] || 0} pending review
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchApplications(); fetchCounts(); }}
              className="flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 rounded-lg border border-[#1A362B]/10 text-xs lg:text-sm font-medium text-[#1A362B] hover:bg-[#F9F7F2] transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 lg:h-4 lg:w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 bg-[#1A362B] text-white rounded-lg text-xs lg:text-sm font-medium hover:bg-[#1A362B]/90 transition-colors">
              <Filter className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
          {(["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"] as AppStatus[]).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(active ? "" : s); setPage(1); }}
                className="relative flex flex-col p-3 sm:p-4 lg:p-5 rounded-xl border text-left transition-all duration-200 hover:shadow-sm"
                style={{
                  borderColor: active ? FOREST : `${FOREST}15`,
                  backgroundColor: active ? `${FOREST}05` : "white",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 lg:p-2 rounded-md ${cfg.bg}/30`}>
                    {cfg.icon}
                  </div>
                  <span className="text-[10px] lg:text-xs font-medium text-[#1A362B]/60 uppercase tracking-wider">
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-[#1A362B]" style={{ fontFamily: "'Gambetta', serif" }}>
                  {counts[s] ?? "0"}
                </p>
              </button>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-[#1A362B]/10 overflow-hidden">
          {/* Tabs */}
          <div className="overflow-x-auto hide-scrollbar border-b border-[#1A362B]/10">
            <div className="flex min-w-max sm:min-w-0 px-2">
              {tabs.map((t) => {
                const active = statusFilter === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => { setStatusFilter(t.value); setPage(1); }}
                    className="relative px-4 py-3 lg:px-5 lg:py-4 text-xs lg:text-sm font-medium whitespace-nowrap transition-colors"
                    style={{ color: active ? FOREST : "#4A5D4E" }}
                  >
                    {t.label}
                    {t.value && counts[t.value] != null && (
                      <span
                        className="ml-2 px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-full text-[10px] lg:text-xs font-bold"
                        style={{
                          backgroundColor: active ? `${FOREST}15` : BEIGE,
                          color: active ? FOREST : "#4A5D4E",
                        }}
                      >
                        {counts[t.value]}
                      </span>
                    )}
                    {active && (
                      <span className="absolute bottom-0 left-4 lg:left-5 right-4 lg:right-5 h-0.5 rounded-t-full" style={{ backgroundColor: FOREST }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div className="p-3 lg:p-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5" style={{ color: "#4A5D4E" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, role, company or email..."
                className="w-full pl-9 lg:pl-10 pr-4 py-2.5 lg:py-3 text-sm lg:text-base rounded-lg outline-none transition-all border"
                style={{
                  backgroundColor: CREAM,
                  borderColor: `${FOREST}15`,
                  color: "#2D2D2D",
                }}
              />
            </div>
            {(search || statusFilter) && (
              <button
                onClick={() => { setSearch(""); setStatusFilter(""); setPage(1); }}
                className="flex items-center gap-1.5 px-3 py-2.5 lg:px-4 lg:py-3 rounded-lg text-xs lg:text-sm font-medium transition-colors whitespace-nowrap"
                style={{ backgroundColor: BEIGE, color: FOREST }}
              >
                <X className="h-3.5 w-3.5 lg:h-4 lg:w-4" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl border border-[#1A362B]/10 overflow-hidden">
          {/* Desktop Headers */}
          <div className="hidden lg:grid grid-cols-[2fr,1.5fr,1fr,1fr,120px,40px] gap-4 px-5 py-4 bg-[#F9F7F2]/50 border-b border-[#1A362B]/10">
            {["Mentor", "Contact", "Role", "Experience", "Status", ""].map((h) => (
              <span key={h} className="text-xs font-bold uppercase tracking-wider text-[#1A362B]/50">
                {h}
              </span>
            ))}
          </div>

          {/* Mobile Headers */}
          <div className="lg:hidden grid grid-cols-[1fr,auto] gap-4 px-4 py-3 bg-[#F9F7F2]/50 border-b border-[#1A362B]/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A362B]/50">Application</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A362B]/50">Status</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 lg:h-8 lg:w-8 animate-spin" style={{ color: FOREST }} />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-[#1A362B]/5 flex items-center justify-center mb-4">
                <GraduationCap className="h-8 w-8 lg:h-10 lg:w-10" style={{ color: FOREST }} />
              </div>
              <p className="text-sm lg:text-base font-medium text-[#1A362B] mb-1">No applications found</p>
              <p className="text-xs lg:text-sm text-[#1A362B]/50">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1A362B]/5">
              {applications.map((app) => {
                const cfg    = STATUS_CONFIG[app.status];
                const isOpen = selected?.id === app.id && drawerOpen;

                return (
                  <div
                    key={app.id}
                    onClick={() => openDrawer(app)}
                    className="group cursor-pointer transition-all hover:bg-[#F9F7F2]/50"
                    style={{ borderLeft: isOpen ? `3px solid ${FOREST}` : "3px solid transparent" }}
                  >
                    {/* Desktop Row */}
                    <div className="hidden lg:grid grid-cols-[2fr,1.5fr,1fr,1fr,120px,40px] gap-4 px-5 py-5 items-center">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[#1A362B]/10 flex items-center justify-center text-[#1A362B] font-bold text-sm flex-shrink-0">
                          {initials(app.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-medium text-[#1A362B] truncate">{app.fullName}</p>
                          <p className="text-sm text-[#1A362B]/50 truncate">{app.company}</p>
                          <p className="text-xs text-[#1A362B]/30 mt-0.5">{fmtRelativeDate(app.createdAt)}</p>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-[#1A362B] truncate">{app.email}</p>
                        {app.mobile && (
                          <p className="text-xs text-[#1A362B]/50 mt-1">{app.mobile}</p>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-[#1A362B] truncate">{app.currentRole}</p>
                      </div>
                      <div>
                        <span className="text-xs px-2 py-1 rounded-md bg-[#1A362B]/5 text-[#1A362B] font-medium whitespace-nowrap">
                          {app.yearsOfExperience} yrs
                        </span>
                      </div>
                      <div>
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border w-fit ${cfg.classes}`}>
                          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <ChevronRightIcon className="h-5 w-5 text-[#1A362B]/30 group-hover:text-[#1A362B] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>

                    {/* Mobile Row */}
                    <div className="lg:hidden px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-[#1A362B]/10 flex items-center justify-center text-[#1A362B] font-bold text-sm flex-shrink-0">
                            {initials(app.fullName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-[#1A362B] truncate">{app.fullName}</p>
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-medium border ${cfg.classes}`}>
                                <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-xs text-[#1A362B]/70 truncate">{app.currentRole}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A362B]/5 text-[#1A362B]">
                                {app.yearsOfExperience} yrs exp
                              </span>
                              <span className="text-[10px] text-[#1A362B]/50 truncate">{app.company}</span>
                              <span className="text-[10px] text-[#1A362B]/30">{fmtRelativeDate(app.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-[#1A362B]/30 flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-[#1A362B]/10 bg-[#F9F7F2]/50">
              <p className="text-xs lg:text-sm text-[#1A362B]/50">
                Showing {(meta.page - 1) * meta.limit + 1}–
                {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 lg:p-2 rounded-lg border border-[#1A362B]/10 hover:bg-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4 lg:h-5 lg:w-5 text-[#1A362B]" />
                </button>
                <span className="text-xs lg:text-sm font-medium text-[#1A362B] px-2">
                  {meta.page} / {meta.totalPages}
                </span>
                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 lg:p-2 rounded-lg border border-[#1A362B]/10 hover:bg-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5 text-[#1A362B]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Drawer */}
      <ReviewDrawer
        app={selected}
        open={drawerOpen}
        isPending={isPending}
        onClose={closeDrawer}
        onAction={handleAction}
      />
    </>
  );
}

// ── Review Drawer ──────────────────────────────────────────────────────────
function ReviewDrawer({
  app, open, isPending, onClose, onAction,
}: {
  app: MentorApplication | null;
  open: boolean;
  isPending: boolean;
  onClose: () => void;
  onAction: (app: MentorApplication, action: "approve" | "reject" | "under_review", notes: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    if (app) { setNotes(app.reviewNotes || ""); setConfirmAction(null); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.id]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const canAct = app ? (app.status === "SUBMITTED" || app.status === "UNDER_REVIEW") : false;
  const cfg    = app ? STATUS_CONFIG[app.status] : null;

  if (!app) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 transition-opacity duration-300 pointer-events-none"
        style={{ backgroundColor: "rgba(26,54,43,0.2)", opacity: open ? 1 : 0 }}
      />

      {/* Drawer Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full sm:w-[480px] z-40 flex flex-col bg-white shadow-2xl"
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          borderLeft: `1px solid ${FOREST}15`,
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-[#1A362B]/10">
          <div className="flex items-start justify-between p-5 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-[#1A362B] flex items-center justify-center text-white font-bold text-lg lg:text-xl">
                {initials(app.fullName)}
              </div>
              <div>
                <h2 className="font-serif text-lg lg:text-xl text-[#1A362B]">{app.fullName}</h2>
                <p className="text-xs lg:text-sm text-[#1A362B]/60 mt-0.5">{app.currentRole} · {app.company}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#F9F7F2] transition-colors"
            >
              <X className="h-4 w-4 lg:h-5 lg:w-5 text-[#1A362B]/50" />
            </button>
          </div>

          {/* Status Bar */}
          <div className="flex items-center gap-3 px-5 lg:px-6 pb-4 lg:pb-5">
            {cfg && (
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium border ${cfg.classes}`}>
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs lg:text-sm text-[#1A362B]/50">
              <Calendar className="h-3 w-3 lg:h-4 lg:w-4" />
              Applied {fmtRelativeDate(app.createdAt)}
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-6 lg:space-y-8">

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            {[
              { icon: <Briefcase className="h-3.5 w-3.5 lg:h-4 lg:w-4" />, label: "Experience",  value: `${app.yearsOfExperience} years` },
              { icon: <User       className="h-3.5 w-3.5 lg:h-4 lg:w-4" />, label: "Company",     value: app.company },
              { icon: <TrendingUp className="h-3.5 w-3.5 lg:h-4 lg:w-4" />, label: "Role",        value: app.currentRole },
              { icon: <FileText   className="h-3.5 w-3.5 lg:h-4 lg:w-4" />, label: "ID",          value: app.id.slice(0, 8) + "…" },
            ].map(({ icon, label, value }) => (
              <div key={label} className="p-3 lg:p-4 rounded-lg bg-[#F9F7F2]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#1A362B]/50">{icon}</span>
                  <span className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-[#1A362B]/50">
                    {label}
                  </span>
                </div>
                <p className="text-sm lg:text-base font-medium text-[#1A362B] truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-[#1A362B]/50 mb-3">Contact</h3>
            <div className="space-y-2">
              <a href={`mailto:${app.email}`} className="flex items-center gap-3 p-3 lg:p-4 rounded-lg hover:bg-[#F9F7F2] transition-colors">
                <Mail className="h-4 w-4 lg:h-5 lg:w-5 text-[#1A362B]" />
                <span className="text-sm lg:text-base text-[#1A362B] flex-1 truncate">{app.email}</span>
                <ExternalLink className="h-3 w-3 lg:h-4 lg:w-4 text-[#1A362B]/30 flex-shrink-0" />
              </a>
              {app.mobile && (
                <a href={`tel:${app.mobile}`} className="flex items-center gap-3 p-3 lg:p-4 rounded-lg hover:bg-[#F9F7F2] transition-colors">
                  <Phone className="h-4 w-4 lg:h-5 lg:w-5 text-[#1A362B]" />
                  <span className="text-sm lg:text-base text-[#1A362B]">{app.mobile}</span>
                </a>
              )}
              {app.linkedinUrl && (
                <a
                  href={app.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 lg:p-4 rounded-lg hover:bg-[#F9F7F2] transition-colors"
                >
                  <Globe className="h-4 w-4 lg:h-5 lg:w-5 text-[#1A362B]" />
                  <span className="text-sm lg:text-base text-[#1A362B] flex-1 truncate">LinkedIn Profile</span>
                  <ExternalLink className="h-3 w-3 lg:h-4 lg:w-4 text-[#1A362B]/30 flex-shrink-0" />
                </a>
              )}
            </div>
          </div>

          {/* Domains */}
          {app.domains.length > 0 && (
            <div>
              <h3 className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-[#1A362B]/50 mb-3">
                Mentoring Domains
              </h3>
              <div className="flex flex-wrap gap-2">
                {app.domains.map((d) => (
                  <span
                    key={d}
                    className="px-3 py-1.5 rounded-lg bg-[#1A362B]/6 text-[#1A362B] text-xs font-medium border border-[#1A362B]/10"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          <div>
            <h3 className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-[#1A362B]/50 mb-3">Bio</h3>
            <div className="p-4 lg:p-5 rounded-lg bg-[#F9F7F2]">
              <p className="text-sm lg:text-base text-[#1A362B] leading-relaxed">{app.bio}</p>
            </div>
          </div>

          {/* Review Notes */}
          <div>
            <h3 className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-[#1A362B]/50 mb-3">
              Review Notes
              {canAct && (
                <span className="ml-2 text-[8px] lg:text-[10px] normal-case font-normal">
                  (shared with applicant)
                </span>
              )}
            </h3>
            {canAct ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add feedback or internal notes..."
                className="w-full p-4 lg:p-5 text-sm lg:text-base rounded-lg border border-[#1A362B]/10 focus:border-[#1A362B] outline-none transition-colors resize-none"
                style={{ backgroundColor: CREAM }}
              />
            ) : app.reviewNotes ? (
              <p className="text-sm lg:text-base p-4 lg:p-5 rounded-lg bg-[#F9F7F2] text-[#1A362B]">
                {app.reviewNotes}
              </p>
            ) : (
              <p className="text-sm lg:text-base text-[#1A362B]/50 italic">No review notes added.</p>
            )}
          </div>

          {/* Reviewed timestamp */}
          {!canAct && app.reviewedAt && (
            <div className="flex items-center gap-2 p-3 lg:p-4 rounded-lg bg-[#F9F7F2]">
              {cfg?.icon}
              <span className="text-xs lg:text-sm text-[#1A362B]">
                Reviewed {fmtRelativeDate(app.reviewedAt)}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {canAct && (
          <div className="flex-shrink-0 p-5 lg:p-6 border-t border-[#1A362B]/10 bg-white">
            {confirmAction === "reject" ? (
              <div className="space-y-3">
                <p className="text-xs lg:text-sm text-red-600">
                  Reject this application? The applicant will be notified.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 px-4 py-2 lg:px-5 lg:py-2.5 rounded-lg border border-[#1A362B]/10 text-xs lg:text-sm font-medium text-[#1A362B] hover:bg-[#F9F7F2] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => onAction(app, "reject", notes)}
                    className="flex-1 px-4 py-2 lg:px-5 lg:py-2.5 rounded-lg bg-red-600 text-white text-xs lg:text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPending && <Loader2 className="h-3 w-3 lg:h-4 lg:w-4 animate-spin" />}
                    Confirm Reject
                  </button>
                </div>
              </div>
            ) : confirmAction === "approve" ? (
              <div className="space-y-3">
                <p className="text-xs lg:text-sm text-emerald-600">
                  Approve and send activation email to mentor?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 px-4 py-2 lg:px-5 lg:py-2.5 rounded-lg border border-[#1A362B]/10 text-xs lg:text-sm font-medium text-[#1A362B] hover:bg-[#F9F7F2] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => onAction(app, "approve", notes)}
                    className="flex-1 px-4 py-2 lg:px-5 lg:py-2.5 rounded-lg bg-[#1A362B] text-white text-xs lg:text-sm font-medium hover:bg-[#1A362B]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPending && <Loader2 className="h-3 w-3 lg:h-4 lg:w-4 animate-spin" />}
                    Confirm Approve
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {app.status === "SUBMITTED" && (
                  <button
                    disabled={isPending}
                    onClick={() => onAction(app, "under_review", notes)}
                    className="w-full px-4 py-2.5 lg:px-5 lg:py-3 rounded-lg border border-[#1A362B]/10 text-xs lg:text-sm font-medium text-[#1A362B] hover:bg-[#F9F7F2] transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    Mark as Under Review
                  </button>
                )}
                <div className="flex gap-2">
                  <button
                    disabled={isPending}
                    onClick={() => setConfirmAction("reject")}
                    className="flex-1 px-4 py-2.5 lg:px-5 lg:py-3 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs lg:text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => setConfirmAction("approve")}
                    className="flex-1 px-4 py-2.5 lg:px-5 lg:py-3 rounded-lg bg-[#1A362B] text-white text-xs lg:text-sm font-medium hover:bg-[#1A362B]/90 transition-colors flex items-center justify-center gap-2"
                  >
                    {isPending
                      ? <Loader2 className="h-3 w-3 lg:h-4 lg:w-4 animate-spin" />
                      : <CheckCircle2 className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    }
                    Approve
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!canAct && (
          <div className="flex-shrink-0 p-5 lg:p-6 border-t border-[#1A362B]/10">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 lg:px-5 lg:py-3 rounded-lg bg-[#F9F7F2] text-[#1A362B] text-xs lg:text-sm font-medium hover:bg-[#EFEBE3] transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}