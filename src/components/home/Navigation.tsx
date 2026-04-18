"use client";

import Link from "next/link";
import { Leaf, Home, Sprout, Landmark, Users, User, LayoutDashboard } from "lucide-react";
import { useSession } from "next-auth/react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavigationProps {
  activeItem?: "home" | "startups" | "investors" | "mentorship" | "mission" | "cohort" | "profile";
  // NOTE: `isLoggedIn` prop has been removed.
  // Auth is resolved internally via useSession — pages no longer need to pass it.
}

// ─── Constants ────────────────────────────────────────────────────────────────

const topNavLinks = [
  { key: "startups",   label: "Startups",   href: "/startups" },
  { key: "investors",  label: "Investors",  href: "/investors" },
  { key: "mentorship", label: "Mentorship", href: "/mentorship" },
  { key: "profile",    label: "Profile",    href: "/profile" },
];

const bottomTabs = [
  { key: "home",       label: "Home",      href: "/",           Icon: Home },
  { key: "startups",   label: "Startups",  href: "/startups",   Icon: Sprout },
  { key: "investors",  label: "Portfolio", href: "/investors",  Icon: Landmark },
  { key: "mentorship", label: "Mentors",   href: "/mentorship", Icon: Users },
  { key: "profile",    label: "Profile",   href: "/profile",    Icon: User },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Navigation is the single source of auth truth across the app.
 *
 * Before:  <Navigation activeItem="home" isLoggedIn={!!session?.user} />
 * After:   <Navigation activeItem="home" />
 *
 * Pages no longer import useSession or pass isLoggedIn — this component
 * handles the session check internally so that logic lives in exactly one place.
 */
export function Navigation({ activeItem = "home" }: NavigationProps) {
  // Auth resolved here — not on the page
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;

  return (
    <>
      {/* ── Top Navbar ── */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-cream/90 backdrop-blur-md border-b border-forest/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity flex-shrink-0">
            <Leaf className="text-forest w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            <span className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-forest">
              VentureHub
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8 xl:gap-10 text-sm font-medium uppercase tracking-widest text-forest/80">
            {topNavLinks.map(({ key, label, href }) => (
              <Link
                key={key}
                href={href}
                className={`relative py-1 transition-colors hover:text-forest ${
                  activeItem === key ? "border-b border-forest text-forest" : ""
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions — Dashboard if logged in, Log In + Join if guest */}
          <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-6 xl:px-8 py-3 bg-forest text-white text-xs font-bold uppercase tracking-widest hover:bg-forest/90 transition-all shadow-lg shadow-forest/10"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-bold uppercase tracking-widest text-forest hover:opacity-70 transition-opacity"
                >
                  Log In
                </Link>
                <Link
                  href="/startups"
                  className="px-6 xl:px-8 py-3 bg-forest text-white text-xs font-bold uppercase tracking-widest hover:bg-forest/90 transition-all shadow-lg shadow-forest/10"
                >
                  Join the Hub
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile Bottom Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-forest/10">

        {/* Mobile auth strip */}
        {isLoggedIn ? (
          <div className="px-4 py-2 border-b border-forest/10">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full py-2 bg-forest text-white text-xs font-bold uppercase tracking-widest hover:bg-forest/90 transition-colors shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-forest/10">
            <Link
              href="/auth/login"
              className="flex-1 text-center py-2 text-xs font-bold uppercase tracking-widest text-forest border border-forest/30 hover:bg-forest/5 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/startups"
              className="flex-1 text-center py-2 bg-forest text-white text-xs font-bold uppercase tracking-widest hover:bg-forest/90 transition-colors shadow-sm"
            >
              Join the Hub
            </Link>
          </div>
        )}

        {/* Tab bar */}
        <nav
          className="flex items-center justify-around px-1"
          style={{ height: "56px", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {bottomTabs.map(({ key, label, href, Icon }) => {
            const isActive = activeItem === key;
            return (
              <Link
                key={key}
                href={href}
                className={`flex flex-col items-center justify-center gap-[3px] min-w-[56px] py-2 transition-opacity active:opacity-50 relative ${
                  isActive ? "text-forest" : "text-forest/30"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-forest" />
                )}
                <Icon
                  className="w-[22px] h-[22px]"
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                  isActive ? "text-forest" : "text-forest/30"
                }`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}