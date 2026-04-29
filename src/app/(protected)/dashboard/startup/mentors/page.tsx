"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { MentorListItem, MentorsResponse } from "@/app/api/mentors/route";
import { useRouter } from "next/navigation";

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_DOMAINS = [
  "AI", "B2B", "Brand", "CleanTech", "Compliance", "Culture", "D2C",
  "Design", "EdTech", "Engineering", "FinTech", "Fundraising", "Growth",
  "GTM", "HealthTech", "Infra", "Legal", "Marketplace", "Marketing", "ML",
  "Revenue", "SaaS", "Sales", "Scaling", "Strategy", "UX",
];

const EXP_RANGES = [
  { label: "1–3 yrs", min: 1 },
  { label: "3–7 yrs", min: 3 },
  { label: "7+ yrs", min: 7 },
];

const LIMIT = 12;

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, url, size = 48 }: { name: string; url?: string | null; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const palette = ["#1A362B", "#4A5D4E", "#2D5A3D", "#3D4F3A", "#1E4A35"];
  const bg = palette[name.charCodeAt(0) % palette.length];
  if (url) {
    return (
      <img src={url} alt={name} className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.36, fontFamily: "'Gambetta', serif" }}>
      {initials}
    </div>
  );
}

function StarRating({ rating }: { rating?: string | null }) {
  if (!rating) return null;
  return (
    <span className="flex items-center gap-1 text-xs font-semibold flex-shrink-0" style={{ color: "var(--forest)" }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {Number(rating).toFixed(1)}
    </span>
  );
}

function ExperienceBadge({ years }: { years?: number | null }) {
  if (!years) return null;
  return (
    <span className="text-xs px-2 py-0.5 font-semibold uppercase tracking-wider border flex-shrink-0"
      style={{ fontSize: "0.65rem", borderColor: "rgba(26,54,43,0.2)", color: "var(--moss)" }}>
      {years >= 7 ? "7+" : years} yrs
    </span>
  );
}

type RequestStatus = MentorListItem["requestStatus"];

function RequestButton({
  status, loading, onRequest,
}: {
  status: RequestStatus; loading: boolean; onRequest: () => void;
}) {
  if (status === "accepted") {
    return (
      <button className="flex-1 py-2 text-xs font-semibold uppercase tracking-widest border transition-all"
        style={{ borderColor: "var(--forest)", color: "var(--forest)", background: "rgba(26,54,43,0.06)" }}>
        Open Chat
      </button>
    );
  }
  if (status === "requested") {
    return (
      <button disabled className="flex-1 py-2 text-xs font-semibold uppercase tracking-widest cursor-not-allowed border opacity-40"
        style={{ borderColor: "rgba(26,54,43,0.2)", color: "var(--moss)" }}>
        Requested ✓
      </button>
    );
  }
  return (
    <button onClick={onRequest} disabled={loading}
      className="flex-1 py-2 text-xs font-semibold uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ background: "var(--forest)", color: "var(--cream)" }}>
      {loading ? "Sending…" : "Request"}
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="border p-5 animate-pulse" style={{ borderColor: "rgba(26,54,43,0.1)", background: "white" }}>
      <div className="flex gap-3 mb-4">
        <div className="rounded-full flex-shrink-0" style={{ width: 48, height: 48, background: "var(--beige)" }} />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 rounded" style={{ background: "var(--beige)", width: "60%" }} />
          <div className="h-3 rounded" style={{ background: "var(--beige)", width: "80%" }} />
        </div>
      </div>
      <div className="h-3 rounded mb-2" style={{ background: "var(--beige)" }} />
      <div className="h-3 rounded mb-2" style={{ background: "var(--beige)", width: "75%" }} />
      <div className="h-3 rounded mb-4" style={{ background: "var(--beige)", width: "55%" }} />
      <div className="flex gap-2">
        <div className="flex-1 h-8 rounded" style={{ background: "var(--beige)" }} />
        <div className="w-16 h-8 rounded" style={{ background: "var(--beige)" }} />
      </div>
    </div>
  );
}

function MentorCard({ mentor, onRequest }: { mentor: MentorListItem; onRequest: (id: string) => Promise<void> }) {
  const [requesting, setRequesting] = useState(false);
  const router = useRouter(); // ← add this

  const handleRequest = async () => {
    setRequesting(true);
    await onRequest(mentor.id);
    setRequesting(false);
  };

  return (
    <div className="border flex flex-col transition-all duration-300 hover:shadow-md"
      style={{ borderColor: "rgba(26,54,43,0.12)", background: "white" }}>
      {mentor.requestStatus === "accepted" && (
        <div className="h-0.5 w-full" style={{ background: "var(--forest)" }} />
      )}
      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar name={mentor.fullName} url={mentor.avatarUrl} size={48} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm leading-snug truncate"
                style={{ color: "var(--forest)", fontFamily: "'Gambetta', serif" }}>
                {mentor.fullName}
              </h3>
              <StarRating rating={mentor.averageRating} />
            </div>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--moss)" }}>
              {mentor.currentRole}
              {mentor.company && <> <span className="opacity-40">@</span> {mentor.company}</>}
            </p>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <ExperienceBadge years={mentor.yearsOfExperience} />
          {(mentor.city || mentor.country) && (
            <>
              <span className="text-xs opacity-30" style={{ color: "var(--forest)" }}>•</span>
              <span className="text-xs" style={{ color: "var(--moss)" }}>{mentor.city ?? mentor.country}</span>
            </>
          )}
          {!mentor.isAvailable && (
            <>
              <span className="text-xs opacity-30" style={{ color: "var(--forest)" }}>•</span>
              <span className="text-xs opacity-50" style={{ color: "var(--moss)" }}>Unavailable</span>
            </>
          )}
        </div>

        {/* Bio */}
        {mentor.bio && (
          <p className="text-xs leading-relaxed mb-4 line-clamp-2 flex-1" style={{ color: "rgba(45,45,45,0.7)" }}>
            {mentor.bio}
          </p>
        )}

        {/* Domain chips */}
        {mentor.domains.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {mentor.domains.slice(0, 3).map(d => (
              <span key={d} className="text-xs px-2 py-0.5 font-medium"
                style={{ background: "var(--beige)", color: "var(--forest)", fontSize: "0.65rem" }}>
                {d}
              </span>
            ))}
            {mentor.domains.length > 3 && (
              <span className="text-xs px-2 py-0.5" style={{ color: "var(--moss)", fontSize: "0.65rem" }}>
                +{mentor.domains.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer stats */}
        <div className="flex items-center justify-between mb-3 pb-3"
          style={{ borderBottom: "1px solid rgba(26,54,43,0.08)" }}>
          <span className="text-xs" style={{ color: "var(--moss)" }}>
            <span className="font-semibold" style={{ color: "var(--forest)" }}>{mentor.totalSessions}</span> sessions
          </span>
          {mentor.sessionPriceUsd && (
            <span className="text-xs font-semibold" style={{ color: "var(--forest)" }}>
              ${Number(mentor.sessionPriceUsd).toFixed(0)}/hr
            </span>
          )}
        </div>

        {/* CTAs */}
        <div className="flex gap-2">
          <RequestButton status={mentor.requestStatus} loading={requesting} onRequest={handleRequest} />
          <button className="px-3 py-2 text-xs font-semibold uppercase tracking-widest border transition-all hover:opacity-80"
            onClick={() => router.push(`/dashboard/startup/mentors/${mentor.id}`)}
            style={{ borderColor: "rgba(26,54,43,0.2)", color: "var(--moss)" }}>
            View
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MentorsPage() {
  const [search, setSearch]                   = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [expMinIdx, setExpMinIdx]             = useState<number | null>(null);
  const [sortBy, setSortBy]                   = useState<"experience" | "rating" | "sessions">("experience");
  const [showDomainDrop, setShowDomainDrop]   = useState(false);

  const [mentors, setMentors]         = useState<MentorListItem[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const fetchMentors = useCallback(async (pageNum: number, append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearch)          params.set("search",  debouncedSearch);
      if (selectedDomains.length)   params.set("domains", selectedDomains.join(","));
      if (expMinIdx !== null)        params.set("expMin",  String(EXP_RANGES[expMinIdx].min));
      params.set("sort",  sortBy);
      params.set("page",  String(pageNum));
      params.set("limit", String(LIMIT));

      const res = await fetch(`/api/mentors?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to load mentors");
      }
      const data: MentorsResponse = await res.json();
      setTotal(data.total);
      setMentors(prev => append ? [...prev, ...data.mentors] : data.mentors);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, selectedDomains, expMinIdx, sortBy]);

  useEffect(() => { fetchMentors(1, false); }, [fetchMentors]);

  const handleRequest = async (mentorId: string) => {
    try {
      const res = await fetch(`/api/mentors/${mentorId}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 409 && body.status) {
          const mapped: RequestStatus = body.status === "ACCEPTED" ? "accepted" : "requested";
          setMentors(prev => prev.map(m => m.id === mentorId ? { ...m, requestStatus: mapped } : m));
          return;
        }
        throw new Error(body.error ?? "Request failed");
      }
      setMentors(prev => prev.map(m => m.id === mentorId ? { ...m, requestStatus: "requested" } : m));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not send request. Try again.");
    }
  };

  const toggleDomain = (d: string) =>
    setSelectedDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const clearFilters = () => {
    setSearch(""); setSelectedDomains([]); setExpMinIdx(null); setSortBy("experience");
  };

  const hasFilters = !!search || selectedDomains.length > 0 || expMinIdx !== null;
  const hasMore    = mentors.length < total;

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>

      {/* ── Header ── */}
      <div className="border-b px-6 py-5" style={{ borderColor: "rgba(26,54,43,0.1)", background: "white" }}>
        <div className="max-w-7xl mx-auto flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "var(--moss)" }}>
              Startup Dashboard
            </p>
            <h1 className="font-serif text-2xl font-semibold leading-none"
              style={{ color: "var(--forest)", fontFamily: "'Gambetta', serif" }}>
              Find Mentors
            </h1>
            <p className="text-xs mt-1.5" style={{ color: "rgba(74,93,78,0.7)" }}>
              Browse experienced mentors and request guidance.
            </p>
          </div>
          {!loading && (
            <span className="text-xs font-semibold" style={{ color: "var(--moss)" }}>
              {total} mentor{total !== 1 ? "s" : ""} available
            </span>
          )}
        </div>
      </div>

      {/* ── Sticky Filters ── */}
      <div className="sticky top-0 z-30 border-b px-6 py-3"
        style={{ borderColor: "rgba(26,54,43,0.1)", background: "white" }}>
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 items-center">

          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" width="13" height="13"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Search name, role…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border outline-none"
              style={{ borderColor: "rgba(26,54,43,0.2)", background: "var(--cream)", color: "var(--forest)", fontSize: "0.8rem" }} />
          </div>

          {/* Domains */}
          <div className="relative">
            <button onClick={() => setShowDomainDrop(!showDomainDrop)}
              className="flex items-center gap-2 px-3 py-2 text-xs border transition-all"
              style={{
                fontSize: "0.75rem",
                borderColor: selectedDomains.length > 0 ? "var(--forest)" : "rgba(26,54,43,0.2)",
                color: selectedDomains.length > 0 ? "var(--forest)" : "var(--moss)",
                background: selectedDomains.length > 0 ? "rgba(26,54,43,0.05)" : "transparent",
              }}>
              Domains {selectedDomains.length > 0 && <strong>({selectedDomains.length})</strong>}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {showDomainDrop && (
              <div className="absolute top-full left-0 mt-1 border shadow-lg z-50 p-3 w-64"
                style={{ background: "white", borderColor: "rgba(26,54,43,0.15)" }}>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                  {ALL_DOMAINS.map(d => (
                    <button key={d} onClick={() => toggleDomain(d)}
                      className="px-2 py-1 text-xs border transition-all"
                      style={{
                        fontSize: "0.7rem",
                        borderColor: selectedDomains.includes(d) ? "var(--forest)" : "rgba(26,54,43,0.15)",
                        background: selectedDomains.includes(d) ? "var(--forest)" : "transparent",
                        color: selectedDomains.includes(d) ? "var(--cream)" : "var(--moss)",
                      }}>
                      {d}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowDomainDrop(false)}
                  className="mt-2 w-full py-1 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--forest)" }}>
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Experience */}
          <div className="flex gap-1">
            {EXP_RANGES.map((r, i) => (
              <button key={r.label} onClick={() => setExpMinIdx(expMinIdx === i ? null : i)}
                className="px-3 py-2 text-xs border transition-all"
                style={{
                  fontSize: "0.7rem",
                  borderColor: expMinIdx === i ? "var(--forest)" : "rgba(26,54,43,0.2)",
                  background: expMinIdx === i ? "var(--forest)" : "transparent",
                  color: expMinIdx === i ? "var(--cream)" : "var(--moss)",
                }}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 text-xs border outline-none cursor-pointer"
            style={{ borderColor: "rgba(26,54,43,0.2)", color: "var(--moss)", background: "transparent", fontSize: "0.75rem" }}>
            <option value="experience">Most Experienced</option>
            <option value="rating">Top Rated</option>
            <option value="sessions">Most Sessions</option>
          </select>

          {hasFilters && (
            <button onClick={clearFilters}
              className="px-3 py-2 text-xs underline underline-offset-2 hover:opacity-60"
              style={{ color: "var(--moss)" }}>
              Clear
            </button>
          )}
        </div>

        {selectedDomains.length > 0 && (
          <div className="max-w-7xl mx-auto flex gap-1 mt-2 flex-wrap">
            {selectedDomains.map(d => (
              <span key={d} className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium"
                style={{ background: "var(--beige)", color: "var(--forest)", fontSize: "0.65rem" }}>
                {d}
                <button onClick={() => toggleDomain(d)} className="opacity-50 hover:opacity-100 ml-0.5 leading-none">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 border text-sm flex items-center justify-between"
            style={{ borderColor: "rgba(220,38,38,0.3)", background: "rgba(220,38,38,0.05)", color: "#b91c1c" }}>
            <span>{error}</span>
            <button onClick={() => fetchMentors(1)} className="text-xs underline ml-4">Retry</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && mentors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 opacity-20">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--forest)" }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <p className="font-serif text-lg font-semibold mb-1"
              style={{ color: "var(--forest)", fontFamily: "'Gambetta', serif" }}>
              No mentors found
            </p>
            <p className="text-xs mb-6" style={{ color: "var(--moss)" }}>
              {hasFilters ? "Try adjusting your filters." : "No approved mentors are available yet."}
            </p>
            {hasFilters && (
              <button onClick={clearFilters}
                className="px-6 py-2 text-xs font-semibold uppercase tracking-widest border transition-all hover:opacity-80"
                style={{ borderColor: "var(--forest)", color: "var(--forest)" }}>
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && mentors.length > 0 && (
          <>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {mentors.map(m => <MentorCard key={m.id} mentor={m} onRequest={handleRequest} />)}
              {loadingMore && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`lm-${i}`} />)}
            </div>

            {hasMore && !loadingMore && (
              <div className="flex justify-center mt-10">
                <button onClick={() => fetchMentors(page + 1, true)}
                  className="px-8 py-3 text-xs font-semibold uppercase tracking-widest border transition-all hover:opacity-80"
                  style={{ borderColor: "var(--forest)", color: "var(--forest)" }}>
                  Load More Mentors
                </button>
              </div>
            )}

            {!hasMore && mentors.length > LIMIT && (
              <p className="text-center mt-10 text-xs" style={{ color: "rgba(74,93,78,0.4)" }}>
                All {total} mentors loaded
              </p>
            )}
          </>
        )}
      </div>

      {showDomainDrop && <div className="fixed inset-0 z-20" onClick={() => setShowDomainDrop(false)} />}
    </div>
  );
}