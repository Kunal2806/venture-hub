"use client";

import { cn } from "@/lib/utils";
import {
  BookOpen,
  ChevronRight,
  FolderTree,
  Home,
  Mail,
  TrendingUp,
  Rocket,
  DollarSign,
  GraduationCap,
  MessageSquare,
  FileText,
  Calendar,
  Star,
  Briefcase,
  BarChart3,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Role = "ADMIN" | "STARTUP" | "INVESTOR" | "MENTOR";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
  group: "common" | "admin" | "startup" | "investor" | "mentor";
}

const NAV_ITEMS: NavItem[] = [
  // ── Common ────────────────────────────────────────────────────────────────
  {
    href: "/dashboard",
    label: "Overview",
    icon: <Home className="h-4 w-4" />,
    roles: ["STARTUP", "INVESTOR", "MENTOR", "ADMIN"],
    group: "common",
  },

  // ── Startup ───────────────────────────────────────────────────────────────
  {
    href: "/dashboard/startup/profile",
    label: "My Profile",
    icon: <Rocket className="h-4 w-4" />,
    roles: ["STARTUP"],
    group: "startup",
  },
  {
    href: "/dashboard/startup/eoi",
    label: "Expressions of Interest",
    icon: <FileText className="h-4 w-4" />,
    roles: ["STARTUP"],
    group: "startup",
  },
  {
    href: "/dashboard/startup/messages",
    label: "Messages",
    icon: <MessageSquare className="h-4 w-4" />,
    roles: ["STARTUP"],
    group: "startup",
  },
  {
    href: "/dashboard/startup/mentors",
    label: "Mentor Marketplace",
    icon: <GraduationCap className="h-4 w-4" />,
    roles: ["STARTUP"],
    group: "startup",
  },
  {
    href: "/dashboard/startup/sessions",
    label: "My Sessions",
    icon: <Calendar className="h-4 w-4" />,
    roles: ["STARTUP"],
    group: "startup",
  },

  // ── Investor ──────────────────────────────────────────────────────────────
  {
    href: "/dashboard/investor/startups",
    label: "Discover Startups",
    icon: <Briefcase className="h-4 w-4" />,
    roles: ["INVESTOR"],
    group: "investor",
  },
  {
    href: "/dashboard/investor/watchlist",
    label: "Watchlist",
    icon: <Star className="h-4 w-4" />,
    roles: ["INVESTOR"],
    group: "investor",
  },
  {
    href: "/dashboard/investor/pipeline",
    label: "Deal Pipeline",
    icon: <BarChart3 className="h-4 w-4" />,
    roles: ["INVESTOR"],
    group: "investor",
  },
  {
    href: "/dashboard/investor/messages",
    label: "Messages",
    icon: <MessageSquare className="h-4 w-4" />,
    roles: ["INVESTOR"],
    group: "investor",
  },

  // ── Mentor ────────────────────────────────────────────────────────────────
  {
    href: "/dashboard/mentor/profile",
    label: "My Profile",
    icon: <GraduationCap className="h-4 w-4" />,
    roles: ["MENTOR"],
    group: "mentor",
  },
  {
    href: "/dashboard/mentor/sessions",
    label: "Sessions",
    icon: <Calendar className="h-4 w-4" />,
    roles: ["MENTOR"],
    group: "mentor",
  },
  {
    href: "/dashboard/mentor/availability",
    label: "Availability",
    icon: <Settings className="h-4 w-4" />,
    roles: ["MENTOR"],
    group: "mentor",
  },
  {
    href: "/dashboard/mentor/earnings",
    label: "Earnings",
    icon: <DollarSign className="h-4 w-4" />,
    roles: ["MENTOR"],
    group: "mentor",
  },

  // ── Admin ──────────────────────────────────────────────────────────────
  {
    href: "/dashboard/admin/startups",
    label: "Startup Applications",
    icon: <Rocket className="h-4 w-4" />,
    roles: ["ADMIN"],
    group: "admin",
  },
  {
    href: "/dashboard/admin/investors",
    label: "Investors",
    icon: <Briefcase className="h-4 w-4" />,
    roles: ["ADMIN"],
    group: "admin",
  },
  {
    href: "/dashboard/admin/mentors",
    label: "Mentors",
    icon: <GraduationCap className="h-4 w-4" />,
    roles: ["ADMIN"],
    group: "admin",
  },
  {
    href: "/dashboard/admin/content",
    label: "Content",
    icon: <BookOpen className="h-4 w-4" />,
    roles: ["ADMIN"],
    group: "admin",
  },
  {
    href: "/dashboard/admin/categories",
    label: "Categories",
    icon: <FolderTree className="h-4 w-4" />,
    roles: ["ADMIN"],
    group: "admin",
  },
  {
    href: "/dashboard/admin/story-submissions",
    label: "Story Submissions",
    icon: <TrendingUp className="h-4 w-4" />,
    roles: ["ADMIN"],
    group: "admin",
  },
  {
    href: "/dashboard/admin/contact-submissions",
    label: "Contact Messages",
    icon: <Mail className="h-4 w-4" />,
    roles: ["ADMIN"],
    group: "admin",
  },

];

const GROUP_LABELS: Record<string, string> = {
  common: "",
  startup: "Startup",
  investor: "Investor",
  mentor: "Mentor",
  admin: "Administration",
};

const ROLE_META: Record<
  Role,
  { title: string; description: string; accent: string; icon: React.ReactNode }
> = {
  ADMIN: {
    title: "Admin Panel",
    description: "Govern startups, investors & mentors.",
    accent: "from-[#1A362B] to-[#4A5D4E]",
    icon: <Settings className="h-3.5 w-3.5" />,
  },
  STARTUP: {
    title: "Startup Dashboard",
    description: "Build your profile. Connect with investors.",
    accent: "from-[#1A362B] to-emerald-600",
    icon: <Rocket className="h-3.5 w-3.5" />,
  },
  INVESTOR: {
    title: "Investor Dashboard",
    description: "Discover startups. Manage your pipeline.",
    accent: "from-[#1A362B] to-blue-700",
    icon: <Briefcase className="h-3.5 w-3.5" />,
  },
  MENTOR: {
    title: "Mentor Dashboard",
    description: "Manage sessions. Track your earnings.",
    accent: "from-[#1A362B] to-amber-700",
    icon: <GraduationCap className="h-3.5 w-3.5" />,
  },
};

interface DashboardSidebarProps {
  role: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function DashboardSidebar({
  role,
  mobileOpen = false,
  onMobileClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const filtered = NAV_ITEMS.filter((item) =>
    item.roles.includes(role as Role)
  );

  const groups = (
    [
      "common",
      "startup",
      "investor",
      "mentor",
      "admin",
    ] as const
  )
    .map((g) => ({ name: g, items: filtered.filter((i) => i.group === g) }))
    .filter((g) => g.items.length > 0);

  const meta = ROLE_META[role as Role] ?? ROLE_META.STARTUP;

  const sidebarContent = (
    <aside
      className={cn(
        "w-64 bg-card border-r border-border flex flex-col",
        // Desktop: always visible, full height
        "hidden lg:flex lg:min-h-[calc(100vh-4rem)]",
        // Mobile: fixed overlay
        "lg:relative lg:translate-x-0 lg:shadow-none"
      )}
    >
      <SidebarInner
        groups={groups}
        pathname={pathname}
        meta={meta}
        onLinkClick={onMobileClose}
      />
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      {sidebarContent}

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <aside className="relative z-50 w-72 bg-card flex flex-col h-full shadow-2xl border-r border-border animate-in slide-in-from-left duration-200">
            {/* Close button */}
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarInner
              groups={groups}
              pathname={pathname}
              meta={meta}
              onLinkClick={onMobileClose}
            />
          </aside>
        </div>
      )}
    </>
  );
}

// ── Extracted inner content shared between desktop + mobile ──────────────────
function SidebarInner({
  groups,
  pathname,
  meta,
  onLinkClick,
}: {
  groups: { name: string; items: NavItem[] }[];
  pathname: string;
  meta: (typeof ROLE_META)[Role];
  onLinkClick?: () => void;
}) {
  return (
    <>
      {/* Role badge strip */}
      <div
        className={cn(
          "px-4 py-3 bg-gradient-to-r text-white flex items-center gap-2",
          meta.accent
        )}
      >
        <span className="opacity-80">{meta.icon}</span>
        <span className="text-xs font-semibold tracking-wide uppercase">
          {meta.title}
        </span>
      </div>

      {/* Nav */}
      <nav className="p-3 flex-1 space-y-5 overflow-y-auto custom-scrollbar">
        {groups.map(({ name, items }) => (
          <div key={name}>
            {GROUP_LABELS[name] && (
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-1.5">
                {GROUP_LABELS[name]}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href ||
                      pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onLinkClick}
                    className={cn(
                      "group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
                      isActive
                        ? "bg-[#1A362B]/10 text-[#1A362B] border-l-2 border-[#1A362B]"
                        : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground hover:border-l-2 hover:border-[#1A362B]/30"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "transition-colors flex-shrink-0",
                          isActive
                            ? "text-[#1A362B]"
                            : "group-hover:text-foreground"
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="text-sm font-medium leading-none">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 transition-all duration-150 flex-shrink-0",
                        isActive
                          ? "text-[#1A362B] translate-x-0.5 opacity-100"
                          : "opacity-0 group-hover:opacity-50"
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Role info footer */}
      <div className="mx-3 mb-3 p-3 bg-gradient-to-br from-[#1A362B]/5 to-[#EFEBE3]/50 rounded-lg border border-border">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
          {meta.title}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {meta.description}
        </p>
      </div>
    </>
  );
}