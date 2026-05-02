import { Video, FileText, MapPin, type LucideIcon } from "lucide-react";
import type { SessionFormat } from "@/app/(protected)/dashboard/startup/mentors/types";

type FormatCfg = { label: string; icon: LucideIcon };

const FORMAT_CFG: Record<string, FormatCfg> = {
  VIDEO_CALL:   { label: "Video Call",   icon: Video    },
  ASYNC_REVIEW: { label: "Async Review", icon: FileText },
  IN_PERSON:    { label: "In Person",    icon: MapPin   },
};

export interface EarningRow {
  id: string;
  date: string;
  startupName: string;
  topic: string;
  format: SessionFormat;
  grossUsd: string;
  mentorEarnings: string | null; 
}

interface EarningsTableProps {
  rows: EarningRow[];
  loading?: boolean;
}

export function EarningsTable({ rows, loading }: EarningsTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-stone-100 p-6 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg animate-pulse bg-stone-50" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-100 p-12 text-center">
        <p className="text-sm text-stone-400">No completed paid sessions yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b border-stone-100 bg-stone-50 text-stone-400">
        <div className="col-span-2">Date</div>
        <div className="col-span-4">Session</div>
        <div className="col-span-3">Startup</div>
        <div className="col-span-2 text-right">Gross</div>
        <div className="col-span-1 text-right">Payout</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-stone-50">
        {rows.map(row => {
          const cfg            = FORMAT_CFG[row.format];
          const FormatIcon     = cfg.icon;
          const payout         = row.mentorEarnings ?? row.grossUsd;

          return (
            <div
              key={row.id}
              className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-stone-50 transition-colors"
            >
              <div className="col-span-2 text-xs text-stone-500">
                {new Date(row.date).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "2-digit",
                })}
              </div>

              <div className="col-span-4">
                <p className="text-sm font-medium truncate text-stone-800">
                  {row.topic}
                </p>
                <span className="flex items-center gap-1 text-xs mt-0.5 text-stone-400">
                  <FormatIcon className="w-3 h-3" />
                  {cfg.label}
                </span>
              </div>

              <div className="col-span-3 text-sm truncate text-stone-600">
                {row.startupName}
              </div>

              <div className="col-span-2 text-sm text-right font-medium text-stone-500">
                ${parseFloat(row.grossUsd).toFixed(2)}
              </div>

              <div className="col-span-1 text-sm text-right font-semibold text-stone-800">
                ${parseFloat(payout).toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}