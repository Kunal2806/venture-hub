// app/(dashboard)/startup/mentors/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search, X, Loader2, AlertCircle, Users,
  ChevronRight, SlidersHorizontal, RefreshCw,
} from "lucide-react";
import { MentorCard } from "@/components/MentorCard";
import type { Mentor, FilterState } from "./types";
import { FilterPanel } from "@/components/FilterPanel";

const FOREST = "#1A362B";
const BEIGE = "#EFEBE3";
const CREAM = "#F9F7F2";

export default function MentorListingPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    expertise: [],
    engagementType: "",
    sortBy: "",
  });

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mentor");
      const json = await res.json();
      setMentors(json.data || []);
    } catch {
      setMentors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMentors(); }, [fetchMentors]);

  // Client-side filtering + sorting
  const filtered = useMemo(() => {
    let result = [...mentors];

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.organization.toLowerCase().includes(q) ||
          m.designation.toLowerCase().includes(q) ||
          m.expertiseDomains.some((d) => d.toLowerCase().includes(q))
      );
    }

    if (filters.engagementType) {
      result = result.filter((m) => {
        if (filters.engagementType === "BOTH")
          return m.engagementType === "BOTH";
        if (filters.engagementType === "PAID")
          return m.engagementType === "PAID" || m.engagementType === "BOTH";
        if (filters.engagementType === "PRO_BONO")
          return m.engagementType === "PRO_BONO" || m.engagementType === "BOTH";
        return true;
      });
    }

    if (filters.expertise.length > 0) {
      result = result.filter((m) =>
        filters.expertise.some((e) => m.expertiseDomains.includes(e))
      );
    }

    if (filters.sortBy === "rating") {
      result.sort((a, b) => b.averageRating - a.averageRating);
    } else if (filters.sortBy === "experience") {
      result.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
    }

    return result;
  }, [mentors, filters]);

  const activeFilterCount =
    filters.expertise.length + (filters.engagementType ? 1 : 0) + (filters.sortBy ? 1 : 0);

  return (
    <div className="space-y-5 lg:space-y-6 px-1 lg:px-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs lg:text-sm">
        <Link href="/dashboard/startup" className="text-[#1A362B]/50 hover:text-[#1A362B] transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-[#1A362B]/30" />
        <span className="text-[#1A362B] font-medium">Find Mentors</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl text-[#1A362B]">Find a Mentor</h1>
          <p className="text-xs lg:text-sm text-[#1A362B]/50 mt-1">
            {loading ? "Loading mentors…" : `${filtered.length} mentors available`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMentors}
            className="flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 rounded-lg border border-[#1A362B]/10 text-xs lg:text-sm font-medium text-[#1A362B] hover:bg-[#F9F7F2] transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex lg:hidden items-center gap-2 px-4 py-2 rounded-lg border border-[#1A362B]/10 text-xs font-medium text-[#1A362B] hover:bg-[#F9F7F2] transition-colors relative"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#1A362B] text-white text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div
        className="bg-white rounded-xl border p-3 lg:p-4"
        style={{ borderColor: `${FOREST}12` }}
      >
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5"
            style={{ color: "#4A5D4E" }}
          />
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search by name, skill, company..."
            className="w-full pl-9 lg:pl-10 pr-4 py-2.5 lg:py-3 text-sm lg:text-base rounded-lg outline-none transition-all border"
            style={{
              backgroundColor: CREAM,
              borderColor: `${FOREST}15`,
              color: "#2D2D2D",
            }}
          />
          {filters.search && (
            <button
              onClick={() => setFilters((f) => ({ ...f, search: "" }))}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-[#1A362B]/40 hover:text-[#1A362B]" />
            </button>
          )}
        </div>
      </div>

      {/* Active Expertise Chips (Quick preview) */}
      {filters.expertise.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.expertise.map((e) => (
            <button
              key={e}
              onClick={() =>
                setFilters((f) => ({ ...f, expertise: f.expertise.filter((x) => x !== e) }))
              }
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ backgroundColor: FOREST, color: "white" }}
            >
              {e}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            onClick={() => setFilters((f) => ({ ...f, expertise: [] }))}
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ backgroundColor: BEIGE, color: FOREST }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="lg:hidden">
          <FilterPanel
            filters={filters}
            onChange={(f) => { setFilters(f); setShowMobileFilters(false); }}
          />
        </div>
      )}

      {/* Body: Sidebar + Grid */}
      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <FilterPanel filters={filters} onChange={setFilters} />
        </div>

        {/* Mentor Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: FOREST }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${FOREST}08` }}
              >
                <Users className="h-8 w-8" style={{ color: FOREST }} />
              </div>
              <p className="text-sm font-medium text-[#1A362B] mb-1">No mentors found</p>
              <p className="text-xs text-[#1A362B]/50">Try adjusting your search or filters</p>
              <button
                onClick={() =>
                  setFilters({ search: "", expertise: [], engagementType: "", sortBy: "" })
                }
                className="mt-4 text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: BEIGE, color: FOREST }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}