// components/mentors/FilterPanel.tsx
"use client";

import { X } from "lucide-react";
import type { FilterState, EngagementType } from "@/app/(protected)/dashboard/startup/mentors/types";

const FOREST = "#1A362B";
const BEIGE = "#EFEBE3";

const ALL_EXPERTISE = [
  "Product Management",
  "Growth Hacking",
  "SaaS",
  "Fundraising",
  "B2B Sales",
  "Marketing",
  "Engineering",
  "Design",
  "Operations",
  "Finance",
  "HR & Culture",
  "Legal",
  "Climate Tech",
  "HealthTech",
  "EdTech",
  "FinTech",
];

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const toggleExpertise = (domain: string) => {
    const next = filters.expertise.includes(domain)
      ? filters.expertise.filter((e) => e !== domain)
      : [...filters.expertise, domain];
    onChange({ ...filters, expertise: next });
  };

  const setEngagement = (type: EngagementType | "") => {
    onChange({ ...filters, engagementType: type === filters.engagementType ? "" : type });
  };

  const hasActiveFilters =
    filters.expertise.length > 0 || filters.engagementType !== "" || filters.sortBy !== "";

  const clearAll = () =>
    onChange({ ...filters, expertise: [], engagementType: "", sortBy: "" });

  return (
    <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0">
      <div
        className="bg-white rounded-2xl border p-5 space-y-6"
        style={{ borderColor: `${FOREST}12` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-base font-semibold text-[#1A362B]">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-[#1A362B]/50 hover:text-[#1A362B] transition-colors"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        {/* Engagement Type */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1A362B]/50 mb-3">
            Engagement Type
          </p>
          <div className="space-y-2">
            {(
              [
                { value: "PAID", label: "Paid" },
                { value: "PRO_BONO", label: "Pro-bono" },
                { value: "BOTH", label: "Both" },
              ] as { value: EngagementType; label: string }[]
            ).map(({ value, label }) => {
              const active = filters.engagementType === value;
              return (
                <button
                  key={value}
                  onClick={() => setEngagement(value)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left"
                  style={{
                    backgroundColor: active ? `${FOREST}08` : "transparent",
                    color: active ? FOREST : "#4A5D4E",
                    border: active ? `1px solid ${FOREST}20` : "1px solid transparent",
                  }}
                >
                  <span
                    className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      backgroundColor: active ? FOREST : "transparent",
                      borderColor: active ? FOREST : `${FOREST}30`,
                    }}
                  >
                    {active && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort By */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1A362B]/50 mb-3">
            Sort By
          </p>
          <div className="space-y-2">
            {[
              { value: "rating" as const, label: "Highest Rated" },
              { value: "experience" as const, label: "Most Experienced" },
            ].map(({ value, label }) => {
              const active = filters.sortBy === value;
              return (
                <button
                  key={value}
                  onClick={() =>
                    onChange({ ...filters, sortBy: active ? "" : value })
                  }
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left"
                  style={{
                    backgroundColor: active ? `${FOREST}08` : "transparent",
                    color: active ? FOREST : "#4A5D4E",
                    border: active ? `1px solid ${FOREST}20` : "1px solid transparent",
                  }}
                >
                  <span
                    className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      borderColor: active ? FOREST : `${FOREST}30`,
                    }}
                  >
                    {active && (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: FOREST }}
                      />
                    )}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Expertise Domains */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1A362B]/50 mb-3">
            Expertise
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_EXPERTISE.map((domain) => {
              const active = filters.expertise.includes(domain);
              return (
                <button
                  key={domain}
                  onClick={() => toggleExpertise(domain)}
                  className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all"
                  style={{
                    backgroundColor: active ? FOREST : BEIGE,
                    color: active ? "white" : FOREST,
                  }}
                >
                  {domain}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}