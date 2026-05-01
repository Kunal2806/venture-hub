import { LucideIcon } from "lucide-react";

const FOREST = "#1A362B";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  accent?: string;
}

export function StatCard({ label, value, subtext, icon: Icon, accent }: StatCardProps) {
  const color = accent ?? FOREST;

  return (
    <div
      className="bg-white rounded-xl p-5 border flex items-start gap-4"
      style={{ borderColor: `${FOREST}12` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}12` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: `${FOREST}55` }}>
          {label}
        </p>
        <p className="text-2xl font-serif font-semibold leading-none" style={{ color: FOREST }}>
          {value}
        </p>
        {subtext && (
          <p className="text-xs mt-1.5" style={{ color: `${FOREST}55` }}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}