"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock, CheckCircle2, Clock,
  TrendingUp, ChevronRight, Video, FileText, MapPin,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import type { MentorSessionItem, SessionStatus, SessionFormat } from "../../startup/mentors/types";

const FOREST = "#1A362B";
const BEIGE = "#EFEBE3";
const CREAM = "#F9F7F2";

const STATUS_BADGE: Record<SessionStatus, { label: string; color: string; bg: string }> = {
  REQUESTED:   { label: "Requested",   color: "#B45309", bg: "#FEF3C7" },
  ACCEPTED:    { label: "Accepted",    color: "#065F46", bg: "#D1FAE5" },
  DECLINED:    { label: "Declined",    color: "#991B1B", bg: "#FEE2E2" },
  RESCHEDULED: { label: "Rescheduled", color: "#1D4ED8", bg: "#DBEAFE" },
  COMPLETED:   { label: "Completed",   color: FOREST,   bg: BEIGE     },
  CANCELLED:   { label: "Cancelled",   color: "#6B7280", bg: "#F3F4F6" },
};

const FORMAT_ICON: Record<SessionFormat, React.ElementType> = {
  VIDEO_CALL:   Video,
  ASYNC_REVIEW: FileText,
  IN_PERSON:    MapPin,
};

export default function MentorOverviewPage() {
  const [sessions, setSessions]   = useState<MentorSessionItem[]>([]);
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    fetch("/api/mentor-sessions")
      .then(r => r.json())
      .then(j => setSessions(j.data ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalSessions     = sessions.length;
  const completedSessions = sessions.filter(s => s.status === "COMPLETED").length;
  const pendingRequests   = sessions.filter(s => s.status === "REQUESTED").length;
  const totalEarnings     = sessions
    .filter(s => s.status === "COMPLETED")
    .reduce((sum, s) => sum + parseFloat(s.amountUsd ?? "0"), 0);

  const upcoming = sessions
    .filter(s => s.status === "ACCEPTED" || s.status === "REQUESTED")
    .sort((a, b) => {
      if (!a.scheduledAt) return 1;
      if (!b.scheduledAt) return -1;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    })
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold" style={{ color: FOREST }}>
          Good morning 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: `${FOREST}55` }}>
          Here's what's happening on your mentor dashboard
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: "white" }} />
          ))
        ) : (
          <>
            <StatCard
              label="Total Sessions"
              value={totalSessions}
              icon={CalendarClock}
              subtext="All time"
            />
            <StatCard
              label="Completed"
              value={completedSessions}
              icon={CheckCircle2}
              accent="#065F46"
              subtext="Successfully done"
            />
            <StatCard
              label="Pending Requests"
              value={pendingRequests}
              icon={Clock}
              accent="#B45309"
              subtext="Awaiting your response"
            />
            <StatCard
              label="Total Earnings"
              value={`$${totalEarnings.toFixed(0)}`}
              icon={TrendingUp}
              accent="#1D4ED8"
              subtext="From completed sessions"
            />
          </>
        )}
      </div>

      {/* Upcoming sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold" style={{ color: FOREST }}>
            Upcoming Sessions
          </h2>
          <Link
            href="/dashboard/mentor/sessions"
            className="flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: `${FOREST}70` }}
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: "white" }} />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div
            className="bg-white rounded-xl border p-8 text-center"
            style={{ borderColor: `${FOREST}10` }}
          >
            <CalendarClock className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: FOREST }} />
            <p className="text-sm font-medium" style={{ color: FOREST }}>No upcoming sessions</p>
            <p className="text-xs mt-1" style={{ color: `${FOREST}50` }}>
              New session requests will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(s => {
              const badge = STATUS_BADGE[s.status];
              const FormatIcon = FORMAT_ICON[s.format];
              const topic = s.agendaNote?.split("\n")[0] ?? "Session";

              return (
                <div
                  key={s.id}
                  className="bg-white rounded-xl border px-5 py-4 flex items-center gap-4"
                  style={{ borderColor: `${FOREST}12` }}
                >
                  {/* Format icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${FOREST}08` }}
                  >
                    <FormatIcon className="w-4 h-4" style={{ color: FOREST }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: FOREST }}>
                      {topic}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: `${FOREST}55` }}>
                      {s.scheduledAt
                        ? new Date(s.scheduledAt).toLocaleDateString("en-IN", {
                            weekday: "short", day: "numeric", month: "short",
                            hour: "2-digit", minute: "2-digit",
                          })
                        : `Requested ${new Date(s.requestedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span
                    className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>

                  <ChevronRight className="w-4 h-4 shrink-0 opacity-30" style={{ color: FOREST }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Update Profile",     href: "/dashboard/mentor/profile",      desc: "Edit bio, domains & rates" },
          { label: "Set Availability",   href: "/dashboard/mentor/availability", desc: "Manage your time slots" },
          { label: "View Earnings",      href: "/dashboard/mentor/earnings",     desc: "Track your payouts" },
        ].map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white rounded-xl border p-4 flex items-center justify-between gap-3 hover:shadow-sm transition-all group"
            style={{ borderColor: `${FOREST}12` }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: FOREST }}>{link.label}</p>
              <p className="text-xs mt-0.5" style={{ color: `${FOREST}50` }}>{link.desc}</p>
            </div>
            <ArrowRight
              className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0"
              style={{ color: FOREST }}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}