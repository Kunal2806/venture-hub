"use client";

import {
  Rocket, Briefcase, GraduationCap, CheckCircle2,
  Clock, XCircle, TrendingUp, DollarSign, Users,
  Eye, Sprout, Leaf, ArrowRight, Filter,
} from "lucide-react";
import Link from "next/link";

const stats = [
  {
    label: "Startups",
    value: "48",
    sub: "12 pending",
    icon: <Rocket className="h-4 w-4" />,
    trend: "+8",
    accent: "#61cca1",
  },
  {
    label: "Investors",
    value: "134",
    sub: "6 pending",
    icon: <Briefcase className="h-4 w-4" />,
    trend: "+14",
    accent: "#1A362B",
  },
  {
    label: "Mentors",
    value: "61",
    sub: "3 pending",
    icon: <GraduationCap className="h-4 w-4" />,
    trend: "+5",
    accent: "#1A362B",
  },
  {
    label: "Revenue",
    value: "₹8.4L",
    sub: "this month",
    icon: <DollarSign className="h-4 w-4" />,
    trend: "-2%",
    accent: "#1A362B",
    down: true,
  },
];

const recentApplications = [
  { name: "NeuralCart AI", sector: "E-commerce", stage: "Seed", status: "pending", date: "Today", initials: "NC" },
  { name: "GreenVault", sector: "CleanTech", stage: "Pre-Seed", status: "approved", date: "Yesterday", initials: "GV" },
  { name: "MediSync", sector: "HealthTech", stage: "Series A", status: "approved", date: "2d ago", initials: "MS" },
  { name: "UrbanNest", sector: "PropTech", stage: "Seed", status: "rejected", date: "3d ago", initials: "UN" },
  { name: "FinEdge", sector: "FinTech", stage: "Pre-Seed", status: "pending", date: "3d ago", initials: "FE" },
  { name: "AgriGrow", sector: "AgriTech", stage: "Seed", status: "pending", date: "4d ago", initials: "AG" },
  { name: "EduSmart", sector: "EdTech", stage: "Series A", status: "approved", date: "5d ago", initials: "ES" },
];

const pendingReviews = [
  { type: "Startup", name: "NeuralCart AI", action: "Review", priority: "high" },
  { type: "Investor", name: "Ramesh Gupta", action: "Verify KYC", priority: "medium" },
  { type: "Mentor", name: "Dr. Priya Sharma", action: "Check credentials", priority: "low" },
  { type: "Startup", name: "FinEdge", action: "Review", priority: "high" },
];

const statusConfig: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  pending: { 
    label: "Pending", 
    classes: "bg-amber-50/50 text-amber-700 border border-amber-200/50", 
    icon: <Clock className="h-3 w-3" /> 
  },
  approved: { 
    label: "Approved", 
    classes: "bg-emerald-50/50 text-emerald-700 border border-emerald-200/50", 
    icon: <CheckCircle2 className="h-3 w-3" /> 
  },
  rejected: { 
    label: "Rejected", 
    classes: "bg-red-50/50 text-red-600 border border-red-200/50", 
    icon: <XCircle className="h-3 w-3" /> 
  },
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl text-[#1A362B]">Dashboard</h1>
          <p className="text-xs text-[#1A362B]/50 mt-0.5">
            <span className="hidden sm:inline">18 March 2026</span>
            <span className="sm:hidden">18 Mar '26</span>
            <span className="mx-1">·</span>
            <span className="text-emerald-600">● Live</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg border border-[#1A362B]/10 text-[#1A362B]/50 hover:text-[#1A362B] hover:border-[#1A362B]/30 transition-colors">
            <Filter className="h-4 w-4" />
          </button>
          <button className="px-3 py-2 bg-[#1A362B] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 hover:bg-[#1A362B]/90 transition-colors whitespace-nowrap">
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">All Reports</span>
            <span className="sm:hidden">Reports</span>
          </button>
        </div>
      </div>

      {/* Stats Grid - Responsive (2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-lg border border-[#1A362B]/8 p-2.5 sm:p-3 relative overflow-hidden group hover:border-[#1A362B]/20 transition-colors"
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="p-1.5 rounded-md bg-[#1A362B]/5 text-[#1A362B]">
                {s.icon}
              </div>
              <span className={`text-xs font-medium ${s.down ? "text-red-500" : "text-emerald-600"}`}>
                {s.trend}
              </span>
            </div>
            <p className="text-base sm:text-lg font-bold text-[#1A362B]">{s.value}</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xs text-[#1A362B]/70">{s.label}</p>
              <p className="text-[10px] text-[#1A362B]/40 hidden sm:block">{s.sub}</p>
            </div>
            {/* Mobile-only sub text */}
            <p className="text-[10px] text-[#1A362B]/40 sm:hidden mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Content - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left Column - Recent Applications (full width on mobile, 8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-5">
          {/* Applications Table - Horizontal scroll on mobile */}
          <div className="bg-white rounded-lg border border-[#1A362B]/8 overflow-hidden">
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-[#EFEBE3] bg-[#F9F7F2]/50">
              <h2 className="text-xs font-bold text-[#1A362B] uppercase tracking-wider">Recent Applications</h2>
              <Link href="/dashboard/admin/startups" className="flex items-center gap-1 text-[10px] text-[#1A362B]/50 hover:text-[#1A362B] transition-colors whitespace-nowrap">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            {/* Mobile: Horizontal scroll */}
            <div className="overflow-x-auto sm:overflow-visible">
              <div className="min-w-[600px] sm:min-w-0 divide-y divide-[#EFEBE3]/50">
                {recentApplications.map((app) => {
                  const s = statusConfig[app.status];
                  return (
                    <div
                      key={app.name}
                      className="flex items-center justify-between px-3 sm:px-4 py-2 hover:bg-[#F9F7F2]/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-md bg-[#1A362B]/5 flex items-center justify-center text-[#1A362B] font-bold text-xs flex-shrink-0">
                          {app.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#1A362B] truncate">{app.name}</p>
                          <p className="text-[10px] text-[#1A362B]/50">{app.sector} · {app.stage}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${s.classes}`}>
                          {s.icon} {s.label}
                        </span>
                        <span className="text-[10px] text-[#1A362B]/40 w-10 sm:w-12 text-right">{app.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Stats Row - Stack on mobile, 3 cols on tablet+ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg border border-[#1A362B]/8 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-[#1A362B]/5">
                  <Rocket className="h-3.5 w-3.5 text-[#1A362B]" />
                </div>
                <span className="text-xs font-medium text-[#1A362B]">Startups</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-[#1A362B]">18</span>
                <span className="text-[10px] text-[#1A362B]/40">active this month</span>
              </div>
              <div className="w-full h-1 bg-[#1A362B]/5 rounded-full mt-2">
                <div className="w-3/4 h-full bg-[#1A362B] rounded-full" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-[#1A362B]/8 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-[#1A362B]/5">
                  <DollarSign className="h-3.5 w-3.5 text-[#1A362B]" />
                </div>
                <span className="text-xs font-medium text-[#1A362B]">Deals</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-[#1A362B]">₹2.4Cr</span>
                <span className="text-[10px] text-[#1A362B]/40">total this Q</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-[#1A362B]/50">
                <span className="flex items-center gap-1">↑ 12% <Leaf className="h-2.5 w-2.5" /></span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-[#1A362B]/8 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-[#1A362B]/5">
                  <Users className="h-3.5 w-3.5 text-[#1A362B]" />
                </div>
                <span className="text-xs font-medium text-[#1A362B]">Success</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-[#1A362B]">94%</span>
                <span className="text-[10px] text-[#1A362B]/40">match rate</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-[#1A362B]/50">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> 45 matches
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Pending & Activity (full width on mobile, 4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5">
          {/* Pending Reviews */}
          <div className="bg-white rounded-lg border border-[#1A362B]/8 overflow-hidden">
            <div className="px-3 sm:px-4 py-2.5 border-b border-[#EFEBE3] bg-[#F9F7F2]/50">
              <h2 className="text-xs font-bold text-[#1A362B] uppercase tracking-wider">Needs Review</h2>
            </div>
            <div className="divide-y divide-[#EFEBE3]/50">
              {pendingReviews.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 sm:px-4 py-2 hover:bg-[#F9F7F2]/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#1A362B] truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-[#1A362B]/40">{item.type}</span>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        item.priority === 'high' ? 'bg-red-500' : 
                        item.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                    </div>
                  </div>
                  <button className="px-2 py-1 rounded border border-[#1A362B]/10 text-[10px] font-medium text-[#1A362B] hover:bg-[#1A362B] hover:text-white transition-colors whitespace-nowrap ml-2">
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
            <div className="px-3 sm:px-4 py-2 bg-[#F9F7F2]/50 border-t border-[#EFEBE3]">
              <Link href="/dashboard/admin/pending" className="flex items-center justify-between text-[10px] text-[#1A362B]/50 hover:text-[#1A362B] transition-colors">
                <span>View all pending</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Activity Feed - Compact */}
          <div className="bg-white rounded-lg border border-[#1A362B]/8 overflow-hidden">
            <div className="px-3 sm:px-4 py-2.5 border-b border-[#EFEBE3] bg-[#F9F7F2]/50">
              <h2 className="text-xs font-bold text-[#1A362B] uppercase tracking-wider">Activity</h2>
            </div>
            <div className="divide-y divide-[#EFEBE3]/50">
              {[
                { text: "GreenVault approved", time: "2h ago", icon: <CheckCircle2 className="h-3 w-3" />, bg: "bg-emerald-50" },
                { text: "Ramesh Gupta verified", time: "4h ago", icon: <Users className="h-3 w-3" />, bg: "bg-blue-50" },
                { text: "UrbanNest rejected", time: "1d ago", icon: <XCircle className="h-3 w-3" />, bg: "bg-red-50" },
                { text: "New dispute #204", time: "1d ago", icon: <Clock className="h-3 w-3" />, bg: "bg-amber-50" },
                { text: "MediSync refunded", time: "2d ago", icon: <DollarSign className="h-3 w-3" />, bg: "bg-[#1A362B]/5" },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-2 px-3 sm:px-4 py-2 hover:bg-[#F9F7F2]/50 transition-colors">
                  <div className={`p-1 rounded-md flex-shrink-0 ${a.bg}`}>{a.icon}</div>
                  <p className="text-xs text-[#1A362B] flex-1 truncate">{a.text}</p>
                  <p className="text-[10px] text-[#1A362B]/30 flex-shrink-0">{a.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions - 2 cols on mobile, 2 on desktop (stays 2) */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Applications", icon: <Rocket className="h-3.5 w-3.5" />, count: "12", href: "/dashboard/admin/startups" },
              { label: "Investors", icon: <Briefcase className="h-3.5 w-3.5" />, count: "6", href: "/dashboard/admin/investors" },
              { label: "Mentors", icon: <GraduationCap className="h-3.5 w-3.5" />, count: "3", href: "/dashboard/admin/mentors" },
              { label: "Disputes", icon: <Clock className="h-3.5 w-3.5" />, count: "2", href: "/dashboard/admin/disputes" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#1A362B]/8 hover:border-[#1A362B]/30 transition-colors group"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[#1A362B] flex-shrink-0">{action.icon}</span>
                  <span className="text-[10px] font-medium text-[#1A362B] truncate">{action.label}</span>
                </div>
                <span className="text-[10px] bg-[#1A362B]/5 px-1.5 py-0.5 rounded-full text-[#1A362B] flex-shrink-0 ml-1">
                  {action.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}