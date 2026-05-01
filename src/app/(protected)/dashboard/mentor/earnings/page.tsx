"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { EarningsTable, type EarningRow } from "@/components/EarningsTable";
import type { MentorSessionItem } from "../../startup/mentors/types";

const FOREST = "#1A362B";
const CREAM = "#F9F7F2";

export default function EarningsPage() {
  const [sessions, setSessions] = useState<MentorSessionItem[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch("/api/mentor-sessions")
      .then(r => r.json())
      .then(j => setSessions(j.data ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived earnings ────────────────────────────────────────────────────
  const completed = sessions.filter(s => s.status === "COMPLETED");

  const totalEarnings = completed.reduce(
    (sum, s) => sum + parseFloat(s.amountUsd ?? "0"), 0
  );

  const now = new Date();
  const thisMonthEarnings = completed
    .filter(s => {
      const d = new Date(s.completedAt ?? s.requestedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, s) => sum + parseFloat(s.amountUsd ?? "0"), 0);

  const lastMonthEarnings = completed
    .filter(s => {
      const d   = new Date(s.completedAt ?? s.requestedAt);
      const lm  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    })
    .reduce((sum, s) => sum + parseFloat(s.amountUsd ?? "0"), 0);

  // ── Build EarningRow[] ──────────────────────────────────────────────────
  const rows: EarningRow[] = completed
    .sort((a, b) =>
      new Date(b.completedAt ?? b.requestedAt).getTime() -
      new Date(a.completedAt ?? a.requestedAt).getTime()
    )
    .map(s => ({
      id:             s.id,
      date:           s.completedAt ?? s.requestedAt,
      startupName:    "Startup", // TODO: join from API
      topic:          s.agendaNote?.split("\n")[0] ?? "Session",
      format:         s.format,
      grossUsd:       s.amountUsd,
      mentorEarnings: null,
    }));

  const monthDelta =
    lastMonthEarnings > 0
      ? (((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100).toFixed(0)
      : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <Link href="/dashboard/mentor" className="transition-colors" style={{ color: `${FOREST}50` }}>
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" style={{ color: `${FOREST}30` }} />
        <span className="font-medium" style={{ color: FOREST }}>Earnings</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold" style={{ color: FOREST }}>
          Earnings
        </h1>
        <p className="text-sm mt-1" style={{ color: `${FOREST}55` }}>
          Track your payouts from completed sessions
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse bg-white" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Earnings"
            value={`$${totalEarnings.toFixed(2)}`}
            icon={TrendingUp}
            subtext={`From ${completed.length} completed sessions`}
          />
          <StatCard
            label="This Month"
            value={`$${thisMonthEarnings.toFixed(2)}`}
            icon={Calendar}
            accent="#1D4ED8"
            subtext={
              monthDelta !== null
                ? `${Number(monthDelta) >= 0 ? "+" : ""}${monthDelta}% vs last month`
                : "First month tracked"
            }
          />
          <StatCard
            label="Last Month"
            value={`$${lastMonthEarnings.toFixed(2)}`}
            icon={DollarSign}
            accent="#6B7280"
            subtext="Previous month total"
          />
        </div>
      )}

      {/* Earnings table */}
      <div>
        <h2
          className="font-serif text-base font-semibold mb-3"
          style={{ color: FOREST }}
        >
          Session History
        </h2>
        <EarningsTable rows={rows} loading={loading} />
      </div>

      {/* Note */}
      {!loading && rows.length > 0 && (
        <p className="text-xs" style={{ color: `${FOREST}45` }}>
          * Amounts shown are gross session fees. Actual payouts may differ after platform commission.
        </p>
      )}
    </div>
  );
}