"use client";

import { ChevronDown, CheckCircle, Search, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CountryData, CURRENCIES, MAX_TICKET_BY_CURRENCY, VALID_CURRENCY_CODES, formatTicketAmount, parseTicketAmount } from "./types-constants";
import { investorTypeOptions } from "./types-constants";

// ─── Investor Type Dropdown ────────────────────────────────────────────────────

export function InvestorTypeDropdown({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = investorTypeOptions.find(o => o.value === value);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`input-field w-full flex items-center justify-between gap-2 cursor-pointer select-none text-left ${hasError ? "border-red-300 bg-red-50/30" : ""}`}
      >
        <span className={selected ? "text-forest text-sm font-medium" : "text-forest/35 text-sm"}>
          {selected ? selected.label : "Select Investor Type"}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-forest/40 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-forest/12 rounded-xl shadow-2xl z-[100] overflow-hidden">
          <ul className="overflow-y-auto max-h-64 py-1.5">
            {investorTypeOptions.map(o => (
              <li
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                  value === o.value ? "bg-forest text-white font-medium" : "text-forest hover:bg-beige/60"
                }`}
              >
                <span>{o.label}</span>
                {value === o.value && <CheckCircle className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Phone Country Dropdown ────────────────────────────────────────────────────

export function PhoneCountryDropdown({
  value,
  onChange,
  countries,
  loading,
}: {
  value: string;
  onChange: (cc: string) => void;
  countries: CountryData[];
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const keyBuf = useRef("");
  const keyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = search
    ? countries.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : countries;

  const selected = countries.find(c => c.code === value);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => searchRef.current?.focus(), 50);
    if (value && listRef.current) {
      const idx = filtered.findIndex(c => c.code === value);
      const el = listRef.current.children[idx + 1] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [open, value, filtered]);

  function onTriggerKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); return; }
    if (e.key === "Escape") { setOpen(false); setSearch(""); return; }
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      keyBuf.current += e.key.toUpperCase();
      if (keyTimer.current) clearTimeout(keyTimer.current);
      keyTimer.current = setTimeout(() => { keyBuf.current = ""; }, 800);
      const match = countries.find(c => c.name.toUpperCase().startsWith(keyBuf.current));
      if (match) onChange(match.code);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onKeyDown={onTriggerKey}
        disabled={loading}
        className="input-field w-full flex items-center gap-2 pr-8 cursor-pointer select-none"
        style={{ fontSize: 13 }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-forest/40" />
        ) : selected ? (
          <>
            <Image src={selected.flag} alt={selected.name} width={20} height={14} style={{ width: 20, height: 14 }} className="object-cover rounded-sm flex-shrink-0" />
            <span className="font-medium text-forest/70">{selected.dial}</span>
          </>
        ) : (
          <span className="text-forest/40">+– Code</span>
        )}
        <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-forest/40 pointer-events-none transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-80 bg-white border border-forest/12 rounded-xl shadow-2xl z-[100] overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-forest/8 bg-forest/2">
            <Search className="w-3.5 h-3.5 text-forest/30 flex-shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search country or dial code…"
              className="flex-1 text-sm bg-transparent text-forest placeholder-forest/30 outline-none"
              onClick={e => e.stopPropagation()}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-forest/30 hover:text-forest/60 transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <ul ref={listRef} className="overflow-y-auto max-h-60" role="listbox">
            <li
              role="option"
              aria-selected={!value}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors ${!value ? "bg-forest/6 font-medium text-forest" : "text-forest/50 hover:bg-beige/60"}`}
              onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
            >
              <span className="w-7 text-center">–</span>
              <span>No country code</span>
            </li>
            {filtered.map(c => (
              <li
                key={c.code}
                role="option"
                aria-selected={value === c.code}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors ${
                  value === c.code ? "bg-forest text-white" : "text-forest hover:bg-beige/60"
                }`}
                onClick={() => { onChange(c.code); setOpen(false); setSearch(""); }}
              >
                <Image src={c.flag} alt={c.name} width={20} height={14} style={{ width: 20, height: 14 }} className="object-cover rounded-sm flex-shrink-0" />
                <span className="flex-1 truncate">{c.name}</span>
                <span className={`text-xs tabular-nums font-medium ${value === c.code ? "text-white/70" : "text-forest/40"}`}>{c.dial}</span>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-4 text-sm text-forest/40 text-center">No results for &quot;{search}&quot;</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Ticket Amount Input ──────────────────────────────────────────────────────

export function TicketAmountInput({
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  placeholder,
  hasWarning,
  hasError,
}: {
  amount: string;
  currency: string;
  onAmountChange: (v: string) => void;
  onCurrencyChange: (c: string) => void;
  placeholder: string;
  hasWarning?: boolean;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const curr = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0];
  const maxVal = MAX_TICKET_BY_CURRENCY[currency] ?? MAX_TICKET_BY_CURRENCY.DEFAULT;
  const maxLabel =
    currency === "INR"
      ? `Max ₹${(maxVal / 10_000_000).toFixed(0)} Cr`
      : `Max ${(maxVal / 1_000_000).toFixed(0)}M`;

  const filtered = search
    ? CURRENCIES.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : CURRENCIES;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function handleAmountChange(raw: string) {
    onAmountChange(formatTicketAmount(raw, currency));
  }

  function handleCurrencySelect(code: string) {
    onCurrencyChange(code);
    if (amount) onAmountChange(formatTicketAmount(amount, code));
    setOpen(false);
    setSearch("");
  }

  return (
    <div className={`flex border rounded-lg transition-colors bg-white ${
      hasError ? "border-red-300 bg-red-50/30" : hasWarning ? "border-amber-300" : "border-forest/15"
    }`}>
      <div className="relative flex-shrink-0 border-r border-forest/10" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 h-full py-2.5 text-sm font-semibold text-forest hover:bg-forest/4 transition-colors whitespace-nowrap rounded-l-[7px]"
        >
          <span className="text-[15px] leading-none">{curr.symbol}</span>
          <span className="text-xs text-forest/55">{curr.code}</span>
          <ChevronDown className={`w-3 h-3 text-forest/35 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-forest/12 rounded-xl shadow-2xl z-[100] overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-forest/8 bg-forest/2">
              <Search className="w-3.5 h-3.5 text-forest/30 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="USD, Euro, Rupee…"
                className="flex-1 text-sm bg-transparent text-forest placeholder-forest/30 outline-none"
                onClick={e => e.stopPropagation()}
              />
            </div>
            <ul className="overflow-y-auto max-h-56">
              {filtered.map(c => (
                <li
                  key={c.code}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors ${
                    currency === c.code ? "bg-forest text-white" : "text-forest hover:bg-beige/60"
                  }`}
                  onClick={() => handleCurrencySelect(c.code)}
                >
                  <span className={`w-8 font-bold text-[15px] ${currency === c.code ? "text-white" : "text-forest/60"}`}>{c.symbol}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className={`text-xs font-medium ${currency === c.code ? "text-white/65" : "text-forest/40"}`}>{c.code}</span>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-4 py-4 text-sm text-forest/40 text-center">No results</li>
              )}
            </ul>
          </div>
        )}
      </div>
      <input
        type="text"
        inputMode="numeric"
        className="flex-1 px-3 py-2.5 text-sm text-forest bg-transparent outline-none placeholder-forest/30 min-w-0"
        placeholder={placeholder}
        value={amount}
        onChange={e => handleAmountChange(e.target.value)}
      />
      <span className="flex-shrink-0 self-center pr-3 text-[10px] text-forest/30 whitespace-nowrap">{maxLabel}</span>
    </div>
  );
}