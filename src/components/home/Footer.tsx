"use client";

import Link from "next/link";
import { Leaf, Twitter, Linkedin, Instagram } from "lucide-react";

const platformLinks = [
  { label: "Explore Startups", href: "/dashboard/investor/discover" },
  { label: "Investor Dashboard", href: "/dashboard/investor" },
  { label: "Startup Dashboard", href: "/dashboard/startup" },
  { label: "Mentorship", href: "/mentors" },
  { label: "Impact Metrics", href: "/cohort" },
];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Careers", href: "/careers" },
  { label: "Blog", href: "/blog" },
];

const resourceLinks = [
  { label: "How it Works", href: "/about#how-it-works" },
  { label: "FAQs", href: "/faq" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

const socialLinks = [
  { icon: Twitter, href: "#twitter", label: "Twitter" },
  { icon: Linkedin, href: "#linkedin", label: "LinkedIn" },
  { icon: Instagram, href: "#instagram", label: "Instagram" },
];

const legalLinks = ["Privacy Policy", "Terms of Use", "SLA"] as const;

export function Footer() {
  return (
    <footer className="bg-cream border-t border-forest/10 px-6 pt-14 pb-8 sm:px-10 sm:pt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-5">
            <Leaf className="text-forest w-5 h-5" />
            <span className="font-serif text-[22px] font-semibold tracking-tight text-forest">
              VentureHub
            </span>
          </div>
          <p className="text-[13px] text-forest/55 leading-relaxed max-w-[220px] mb-6">
            Connecting startups, investors, and mentors through structured collaboration.
          </p>
          <div className="flex gap-2.5">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="w-9 h-9 rounded-full border border-forest/15 flex items-center justify-center text-forest hover:bg-forest hover:text-cream transition-all duration-200"
              >
                <Icon className="w-[15px] h-[15px]" />
              </Link>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div>
          <h5 className="text-[10px] font-bold uppercase tracking-[0.25em] text-forest/35 mb-5">
            Platform
          </h5>
          <ul className="space-y-3">
            {platformLinks.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-[13.5px] font-medium text-forest/65 hover:text-forest transition-colors duration-200"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h5 className="text-[10px] font-bold uppercase tracking-[0.25em] text-forest/35 mb-5">
            Company
          </h5>
          <ul className="space-y-3">
            {companyLinks.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-[13.5px] font-medium text-forest/65 hover:text-forest transition-colors duration-200"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h5 className="text-[10px] font-bold uppercase tracking-[0.25em] text-forest/35 mb-5">
            Resources
          </h5>
          <ul className="space-y-3">
            {resourceLinks.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-[13.5px] font-medium text-forest/65 hover:text-forest transition-colors duration-200"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="sm:col-span-2 lg:col-span-1">
          <h5 className="text-[10px] font-bold uppercase tracking-[0.25em] text-forest/35 mb-5">
            Get Started
          </h5>
          <p className="text-[13px] text-forest/55 leading-relaxed mb-5">
            Join the ecosystem built for those who build with purpose.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/startups"
              className="block bg-forest text-cream text-[11px] font-bold uppercase tracking-[0.07em] text-center py-[11px] px-4 border border-forest hover:bg-moss hover:border-moss transition-all duration-200"
            >
              Join as Startup
            </Link>
            <Link
              href="/investors"
              className="block bg-transparent text-forest text-[11px] font-bold uppercase tracking-[0.07em] text-center py-[11px] px-4 border border-forest/30 hover:border-forest hover:bg-forest/5 transition-all duration-200"
            >
              Join as Investor
            </Link>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-14 pt-6 border-t border-forest/[0.07] flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-forest/28">
          © 2026 VentureHub Technologies. All rights reserved.
        </p>
        <div className="flex gap-5 sm:gap-7">
          {legalLinks.map((item) => (
            <Link
              key={item}
              href={item === "Privacy Policy" ? "/privacy" : item === "Terms of Use" ? "/terms" : "/sla"}
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-forest/28 hover:text-forest transition-colors duration-200"
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}