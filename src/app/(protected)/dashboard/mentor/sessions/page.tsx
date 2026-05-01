"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, CalendarClock, RefreshCw } from "lucide-react";
import { SessionCard } from "@/components/SessionCard";
import type { MentorSessionItem, SessionStatus } from "../../startup/mentors/types";
const FOREST = "#1A362B";
const BEIGE = "#EFEBE3";
const CREAM = "#F9F7F2";

const STATUS_TABS: { label: string; value: SessionStatus | "ALL" }[] = [
  { label: "All",         value: "ALL" },
  { label: "Requested",   value: "REQUESTED" },
  { label: "Accepted",    value: "ACCEPTED" },
  { label: "Completed",   value: "COMPLETED" },
  { label: "Declined",    value: "DECLINED" },
  { label: "Cancelled",   value: "CANCELLED" },
];

export default function MentorSessionsPage() {
  const [sessions, setSessions] = useState<MentorSessionItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<SessionStatus | "ALL">("ALL");

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        tab === "ALL"
          ? "/api/mentor-sessions"
          : `/api/mentor-sessions?status=${tab}`;
      const res  = await fetch(url);
      const json = await res.json();
      setSessions(json.data ?? []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // ── Action handlers (optimistic UI) ──────────────────────────────────────
  async function handleAccept(id: string) {
    await fetch(`/api/mentor-sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACCEPTED" }),
    });
    setSessions(prev =>
      prev.map(s => s.id === id ? { ...s, status: "ACCEPTED" as SessionStatus } : s)
    );
  }

  async function handleDecline(id: string) {
    await fetch(`/api/mentor-sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DECLINED" }),
    });
    setSessions(prev =>
      prev.map(s => s.id === id ? { ...s, status: "DECLINED" as SessionStatus } : s)
    );
  }

  async function handleComplete(id: string) {
    await fetch(`/api/mentor-sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    setSessions(prev =>
      prev.map(s => s.id === id ? { ...s, status: "COMPLETED" as SessionStatus } : s)
    );
  }

  const filtered =
    tab === "ALL"
      ? sessions
      : sessions.filter(s => s.status === tab);

  const countFor = (t: SessionStatus | "ALL") =>
    t === "ALL" ? sessions.length : sessions.filter(s => s.status === t).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <Link href="/dashboard/mentor" className="transition-colors" style={{ color: `${FOREST}50` }}>
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" style={{ color: `${FOREST}30` }} />
        <span className="font-medium" style={{ color: FOREST }}>Sessions</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold" style={{ color: FOREST }}>
            Sessions
          </h1>
          <p className="text-sm mt-1" style={{ color: `${FOREST}55` }}>
            {loading ? "Loading…" : `${filtered.length} session${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={fetchSessions}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium transition-colors"
          style={{ borderColor: `${FOREST}15`, color: FOREST }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto"
        style={{ backgroundColor: "white", border: `1px solid ${FOREST}10` }}
      >
        {STATUS_TABS.map(t => {
          const count   = countFor(t.value);
          const isActive = tab === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
              style={
                isActive
                  ? { backgroundColor: FOREST, color: "white" }
                  : { color: `${FOREST}65` }
              }
            >
              {t.label}
              {count > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={
                    isActive
                      ? { backgroundColor: "rgba(255,255,255,0.2)", color: "white" }
                      : { backgroundColor: BEIGE, color: FOREST }
                  }
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Session list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: FOREST }} />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="bg-white rounded-xl border p-12 text-center"
          style={{ borderColor: `${FOREST}10` }}
        >
          <CalendarClock className="w-10 h-10 mx-auto mb-4 opacity-20" style={{ color: FOREST }} />
          <p className="text-sm font-medium" style={{ color: FOREST }}>
            No {tab === "ALL" ? "" : tab.toLowerCase()} sessions
          </p>
          <p className="text-xs mt-1" style={{ color: `${FOREST}50` }}>
            {tab === "REQUESTED"
              ? "New booking requests will appear here"
              : "Sessions matching this filter will appear here"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(session => (
            <SessionCard
              key={session.id}
              session={{
                ...session,
                startupName: "Startup", // TODO: join startup name from API
              }}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onComplete={handleComplete}
              onReschedule={id => alert(`Reschedule UI for session ${id} — implement modal here`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}