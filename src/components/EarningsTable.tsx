import { Video, FileText, MapPin } from "lucide-react";
import type { SessionFormat } from "@/app/(protected)/dashboard/startup/mentors/types";

const FOREST = "#1A362B";
const BEIGE = "#EFEBE3";
const CREAM = "#F9F7F2";

const FORMAT_ICON: Record<SessionFormat, React.ElementType> = {
  VIDEO_CALL:   Video,
  ASYNC_REVIEW: FileText,
  IN_PERSON:    MapPin,
};

const FORMAT_LABEL: Record<SessionFormat, string> = {
  VIDEO_CALL:   "Video Call",
  ASYNC_REVIEW: "Async Review",
  IN_PERSON:    "In Person",
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
      <div className="bg-white rounded-xl border p-6 space-y-3" style={{ borderColor: `${FOREST}12` }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg animate-pulse" style={{ backgroundColor: CREAM }} />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div
        className="bg-white rounded-xl border p-12 text-center"
        style={{ borderColor: `${FOREST}12` }}
      >
        <p className="text-sm" style={{ color: `${FOREST}55` }}>No completed paid sessions yet.</p>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl border overflow-hidden"
      style={{ borderColor: `${FOREST}12` }}
    >
      {/* Table header */}
      <div
        className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b"
        style={{ backgroundColor: CREAM, color: `${FOREST}60`, borderColor: `${FOREST}10` }}
      >
        <div className="col-span-2">Date</div>
        <div className="col-span-4">Session</div>
        <div className="col-span-3">Startup</div>
        <div className="col-span-2 text-right">Gross</div>
        <div className="col-span-1 text-right">You Earn</div>
      </div>

      {/* Rows */}
      <div className="divide-y" style={{ borderColor: `${FOREST}08` }}>
        {rows.map(row => {
          const FormatIcon = FORMAT_ICON[row.format];
          const displayEarnings = row.mentorEarnings ?? row.grossUsd;

          return (
            <div
              key={row.id}
              className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-[#F9F7F2] transition-colors"
            >
              {/* Date */}
              <div className="col-span-2 text-xs" style={{ color: `${FOREST}70` }}>
                {new Date(row.date).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "2-digit",
                })}
              </div>

              {/* Session */}
              <div className="col-span-4">
                <p className="text-sm font-medium truncate" style={{ color: FOREST }}>
                  {row.topic}
                </p>
                <span
                  className="flex items-center gap-1 text-xs mt-0.5 w-fit"
                  style={{ color: `${FOREST}55` }}
                >
                  <FormatIcon className="w-3 h-3" />
                  {FORMAT_LABEL[row.format]}
                </span>
              </div>

              {/* Startup */}
              <div className="col-span-3 text-sm truncate" style={{ color: `${FOREST}80` }}>
                {row.startupName}
              </div>

              {/* Gross */}
              <div className="col-span-2 text-sm text-right font-medium" style={{ color: `${FOREST}70` }}>
                ${parseFloat(row.grossUsd).toFixed(2)}
              </div>

              {/* Earnings */}
              <div className="col-span-1 text-sm text-right font-semibold" style={{ color: FOREST }}>
                ${parseFloat(displayEarnings).toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}