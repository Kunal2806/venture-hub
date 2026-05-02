"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight, Search, Loader2, Building2,
  MapPin, TrendingUp, X, Heart, CheckCircle2,
  type LucideIcon,
} from "lucide-react";

const FOREST = "#1A362B";

const STAGES = [
  { value: "",         label: "All Stages"  },
  { value: "IDEA",     label: "Idea"        },
  { value: "PRE_SEED", label: "Pre-Seed"    },
  { value: "SEED",     label: "Seed"        },
  { value: "SERIES_A", label: "Series A"    },
  { value: "SERIES_B", label: "Series B"    },
  { value: "GROWTH",   label: "Growth"      },
];

interface Startup {
  id: string;
  companyName: string;
  tagline: string | null;
  sector: string;
  stage: string;
  country: string | null;
  city: string | null;
  description: string | null;
  profileScore: number;
  isFeatured: boolean;
  logoUrl: string | null;
  founderName: string;
}

export default function MentorBrowseStartupsPage() {
  const [startups,  setStartups]  = useState<Startup[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [sector,    setSector]    = useState("");
  const [stage,     setStage]     = useState("");
  // Track offered startups in this session
  const [offered,   setOffered]   = useState<Set<string>>(new Set());
  const [offering,  setOffering]  = useState<string | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);

  const fetchStartups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (sector) params.set("sector", sector);
      if (stage)  params.set("stage",  stage);
      const res  = await fetch(`/api/mentor/startups?${params.toString()}`);
      const json = await res.json();
      setStartups(json.data ?? []);
    } catch {
      setStartups([]);
    } finally {
      setLoading(false);
    }
  }, [search, sector, stage]);

  useEffect(() => {
    const t = setTimeout(fetchStartups, 300); // debounce search
    return () => clearTimeout(t);
  }, [fetchStartups]);

  async function handleOffer(startupId: string) {
    setOffering(startupId);
    setOfferError(null);
    try {
      const res = await fetch("/api/mentor/probo-offer", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ startupProfileId: startupId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send offer");
      setOffered(prev => new Set([...prev, startupId]));
    } catch (e) {
      setOfferError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setOffering(null);
    }
  }

  // Unique sectors from loaded data
  const sectors = Array.from(new Set(startups.map(s => s.sector))).sort();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <Link href="/dashboard/mentor" className="text-stone-400 hover:text-stone-600 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-stone-300" />
        <span className="font-medium text-stone-700">Browse Startups</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-stone-800">Browse Startups</h1>
        <p className="text-sm mt-1 text-stone-400">
          Find startups you can help — send a free pro-bono offer
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-stone-100 p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, sector…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-stone-200 bg-stone-50 outline-none focus:border-stone-400 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-stone-400" />
            </button>
          )}
        </div>

        {/* Stage filter */}
        <select
          value={stage}
          onChange={e => setStage(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-stone-200 bg-stone-50 outline-none text-stone-600"
        >
          {STAGES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Sector filter — dynamic from data */}
        {sectors.length > 0 && (
          <select
            value={sector}
            onChange={e => setSector(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-stone-200 bg-stone-50 outline-none text-stone-600"
          >
            <option value="">All Sectors</option>
            {sectors.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        {/* Active filter count */}
        {(search || sector || stage) && (
          <button
            onClick={() => { setSearch(""); setSector(""); setStage(""); }}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Error */}
      {offerError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {offerError}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 animate-spin text-stone-300" />
        </div>
      ) : startups.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-100 p-12 text-center">
          <Building2 className="w-10 h-10 mx-auto mb-4 text-stone-200" />
          <p className="text-sm font-medium text-stone-600">No startups found</p>
          <p className="text-xs mt-1 text-stone-400">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {startups.map(startup => {
            const isOffered  = offered.has(startup.id);
            const isOffering = offering === startup.id;
            return (
              <StartupCard
                key={startup.id}
                startup={startup}
                isOffered={isOffered}
                isOffering={isOffering}
                onOffer={() => handleOffer(startup.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Startup Card ──────────────────────────────────────────────────────────────

function StartupCard({
  startup,
  isOffered,
  isOffering,
  onOffer,
}: {
  startup: Startup;
  isOffered: boolean;
  isOffering: boolean;
  onOffer: () => void;
}) {
  const initials = startup.companyName
    .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const location = [startup.city, startup.country].filter(Boolean).join(", ");

  const STAGE_LABEL: Record<string, string> = {
    IDEA:     "Idea",
    PRE_SEED: "Pre-Seed",
    SEED:     "Seed",
    SERIES_A: "Series A",
    SERIES_B: "Series B",
    SERIES_C: "Series C",
    GROWTH:   "Growth",
  };

  return (
    <div className="bg-white rounded-xl border border-stone-100 p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Logo / initials */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: FOREST }}
        >
          {startup.logoUrl
            ? <img src={startup.logoUrl} alt={startup.companyName} className="w-full h-full rounded-lg object-cover" />
            : initials
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-stone-800 truncate">
              {startup.companyName}
            </h3>
            {startup.isFeatured && (
              <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                Featured
              </span>
            )}
          </div>
          {startup.tagline && (
            <p className="text-xs text-stone-400 mt-0.5 truncate">{startup.tagline}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {startup.description && (
        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
          {startup.description}
        </p>
      )}

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2">
        <Chip icon={TrendingUp} label={startup.sector} />
        <Chip icon={Building2}  label={STAGE_LABEL[startup.stage] ?? startup.stage} />
        {location && <Chip icon={MapPin} label={location} />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-stone-100">
        {/* Profile score */}
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-20 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${startup.profileScore}%` }}
            />
          </div>
          <span className="text-[10px] text-stone-400">{startup.profileScore}% complete</span>
        </div>

        {/* Pro-bono offer button */}
        {isOffered ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Offer Sent
          </span>
        ) : (
          <button
            onClick={onOffer}
            disabled={isOffering}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-white hover:opacity-90"
            style={{ backgroundColor: FOREST }}
          >
            {isOffering
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Heart className="w-3.5 h-3.5" />
            }
            {isOffering ? "Sending…" : "I want to help"}
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-stone-50 text-stone-500">
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}