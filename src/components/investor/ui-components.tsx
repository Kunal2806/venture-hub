"use client";

import { AlertCircle, CheckCircle } from "lucide-react";

// ─── Field feedback ────────────────────────────────────────────────────────────

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-1.5 mt-1.5 animate-fade-in">
      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-[1px]" />
      <p className="text-red-500 text-xs leading-tight">{msg}</p>
    </div>
  );
}

export function FieldWarn({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-1.5 mt-1.5 animate-fade-in">
      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-[1px]" />
      <p className="text-amber-600 text-xs leading-tight">{msg}</p>
    </div>
  );
}

export function FieldOk({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-1.5 mt-1.5 animate-fade-in">
      <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-[1px]" />
      <p className="text-green-700 text-xs leading-tight">{msg}</p>
    </div>
  );
}

// ─── Character counter ─────────────────────────────────────────────────────────

export function CharCount({ cur, max }: { cur: number; max: number }) {
  const pct = cur / max;
  return (
    <span className={`text-[10px] tabular-nums transition-colors ${
      pct >= 1 ? "text-red-500" : pct >= 0.85 ? "text-amber-500" : "text-forest/30"
    }`}>{cur}/{max}</span>
  );
}

// ─── Password strength meter ───────────────────────────────────────────────────

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
    password.length >= 12,
  ];
  const score = checks.filter(Boolean).length;
  const label = score <= 1 ? "Weak" : score <= 3 ? "Fair" : score === 4 ? "Good" : "Strong";
  const color = score <= 1 ? "bg-red-400" : score <= 3 ? "bg-amber-400" : score === 4 ? "bg-green-500" : "bg-green-600";
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? color : "bg-forest/10"}`} />
        ))}
      </div>
      <p className={`text-[10px] font-medium ${score <= 1 ? "text-red-500" : score <= 3 ? "text-amber-500" : "text-green-600"}`}>{label}</p>
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

export function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center ml-2 cursor-help">
      <span className="w-5 h-5 rounded-full bg-forest/10 text-forest/50 text-[11px] font-bold flex items-center justify-center select-none hover:bg-forest/20 transition-colors">?</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 rounded-xl bg-forest text-white text-[11px] leading-relaxed px-3 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-xl whitespace-normal text-left">
        {text}
      </span>
    </span>
  );
}

// ─── Multi-toggle chip group ───────────────────────────────────────────────────

export function MultiToggle({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  const toggle = (val: string) =>
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(o => (
        <label
          key={o.value}
          className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg cursor-pointer transition-all ${
            selected.includes(o.value)
              ? "bg-forest text-white border-forest shadow-sm"
              : "bg-beige/50 border-forest/10 hover:bg-beige"
          }`}
        >
          <input type="checkbox" className="sr-only" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
          <span className={`text-xs font-bold uppercase tracking-widest ${selected.includes(o.value) ? "text-white" : "text-forest/70"}`}>
            {o.label}
          </span>
        </label>
      ))}
    </div>
  );
}