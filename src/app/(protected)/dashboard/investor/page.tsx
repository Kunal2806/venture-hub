// app/(protected)/dashboard/investor/page.tsx
"use client";

import {
  Briefcase, Star, BarChart3, MessageSquare,
  ArrowUpRight, TrendingUp, Eye, FileText,
  ChevronRight, Zap,
} from "lucide-react";

const stats = [
  { label: "Startups Discovered", value: "87", sub: "from your filters", icon: <Eye className="h-5 w-5" />, color: "bg-[#1A362B]" },
  { label: "EOIs Sent", value: "14", sub: "7 accepted", icon: <FileText className="h-5 w-5" />, color: "bg-blue-600" },
  { label: "Watchlist", value: "23", sub: "saved startups", icon: <Star className="h-5 w-5" />, color: "bg-amber-600" },
  { label: "Active Deals", value: "6", sub: "across pipeline stages", icon: <BarChart3 className="h-5 w-5" />, color: "bg-emerald-600" },
];

const pipeline = [
  { name: "NeuralCart AI", sector: "E-commerce", stage: "Due Diligence", ask: "₹2Cr", match: 94 },
  { name: "GreenVault", sector: "CleanTech", stage: "Term Sheet", ask: "₹5Cr", match: 88 },
  { name: "MediSync", sector: "HealthTech", stage: "Discussion", ask: "₹1.5Cr", match: 76 },
  { name: "FinEdge", sector: "FinTech", stage: "EOI Sent", ask: "₹3Cr", match: 71 },
];

const stageColor: Record<string, string> = {
  "Due Diligence": "bg-purple-50 text-purple-700 border-purple-200",
  "Term Sheet":    "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Discussion":    "bg-blue-50 text-blue-700 border-blue-200",
  "EOI Sent":      "bg-amber-50 text-amber-700 border-amber-200",
};

const recommended = [
  { name: "SkyLogic", sector: "SaaS", stage: "Seed", match: 91, ask: "₹80L" },
  { name: "BioLeap", sector: "BioTech", stage: "Pre-Seed", match: 87, ask: "₹1.2Cr" },
  { name: "UrbanEV", sector: "Mobility", stage: "Series A", match: 82, ask: "₹8Cr" },
];

export default function InvestorDashboardPage() {
  return (
    <div className="space-y-8" style={{ fontFamily: "'Satoshi', sans-serif" }}>
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="h-5 w-5 text-[#1A362B]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#4A5D4E]">Investor Dashboard</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1A362B]" style={{ fontFamily: "'Gambetta', serif" }}>
          Good morning, Ramesh 👋
        </h1>
        <p className="text-sm text-[#4A5D4E] mt-1">3 new startups match your thesis today. Your membership renews in 47 days.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#1A362B]/8 p-5 hover:shadow-md transition-shadow">
            <div className={`inline-flex p-2 rounded-xl text-white mb-3 ${s.color}`}>{s.icon}</div>
            <p className="text-3xl font-bold text-[#1A362B]">{s.value}</p>
            <p className="text-sm font-medium text-[#2D2D2D] mt-0.5">{s.label}</p>
            <p className="text-xs text-[#4A5D4E] mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Pipeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#1A362B]/8 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFEBE3]">
            <h2 className="text-sm font-semibold text-[#1A362B] uppercase tracking-wider">Deal Pipeline</h2>
            <a href="/dashboard/investor/pipeline" className="text-xs text-[#4A5D4E] hover:text-[#1A362B] flex items-center gap-1">
              Full pipeline <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="divide-y divide-[#EFEBE3]">
            {pipeline.map((d) => (
              <div key={d.name} className="flex items-center justify-between px-6 py-4 hover:bg-[#F9F7F2] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1A362B]/10 text-[#1A362B] flex items-center justify-center font-bold text-sm">
                    {d.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2D2D2D]">{d.name}</p>
                    <p className="text-xs text-[#4A5D4E]">{d.sector} · Ask {d.ask}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-[#4A5D4E]">Match</p>
                    <p className="text-sm font-bold text-[#1A362B]">{d.match}%</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${stageColor[d.stage]}`}>
                    {d.stage}
                  </span>
                  <MessageSquare className="h-4 w-4 text-[#4A5D4E] hover:text-[#1A362B] cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended */}
        <div className="bg-white rounded-2xl border border-[#1A362B]/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EFEBE3] flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-[#1A362B] uppercase tracking-wider">New Matches</h2>
          </div>
          <div className="divide-y divide-[#EFEBE3]">
            {recommended.map((r) => (
              <div key={r.name} className="px-5 py-4 hover:bg-[#F9F7F2] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-[#2D2D2D]">{r.name}</p>
                  <span className="text-xs font-bold text-emerald-600">{r.match}%</span>
                </div>
                <p className="text-xs text-[#4A5D4E]">{r.sector} · {r.stage} · {r.ask}</p>
                {/* match bar */}
                <div className="mt-2 h-1 bg-[#EFEBE3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#1A362B] to-emerald-500 rounded-full"
                    style={{ width: `${r.match}%` }}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 text-xs py-1.5 rounded-lg bg-[#1A362B] text-white font-medium hover:bg-[#1A362B]/90 transition-colors">
                    Send EOI
                  </button>
                  <button className="flex-1 text-xs py-1.5 rounded-lg border border-[#1A362B]/20 text-[#1A362B] font-medium hover:bg-[#EFEBE3] transition-colors">
                    Watchlist
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Discover Startups", icon: <Eye className="h-4 w-4" />, href: "/dashboard/investor/startups" },
          { label: "My Watchlist", icon: <Star className="h-4 w-4" />, href: "/dashboard/investor/watchlist" },
          { label: "Full Pipeline", icon: <BarChart3 className="h-4 w-4" />, href: "/dashboard/investor/pipeline" },
          { label: "Messages", icon: <MessageSquare className="h-4 w-4" />, href: "/dashboard/investor/messages" },
        ].map((a) => (
          <a
            key={a.label}
            href={a.href}
            className="flex items-center gap-2.5 px-4 py-3 bg-white rounded-xl border border-[#1A362B]/10 text-xs font-medium text-[#1A362B] hover:bg-[#1A362B] hover:text-white transition-all duration-200 group"
          >
            <span className="group-hover:scale-110 transition-transform">{a.icon}</span>
            {a.label}
            <ArrowUpRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    </div>
  );
}