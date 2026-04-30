// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CountryData {
  code:     string;
  name:     string;
  flag:     string;
  dial:     string;
  currency: string;
}

export type VResult = { error?: string; warning?: string; success?: string };

// ─── Step metadata ─────────────────────────────────────────────────────────────

export const steps = [
  { num: "01", title: "Identity",        sub: "Name & Contact",       icon: "👤" },
  { num: "02", title: "Firm Profile",    sub: "Background & Focus",   icon: "🏢" },
  { num: "03", title: "Investment Lens", sub: "Preferences & Thesis", icon: "🔭" },
  { num: "04", title: "Ticket Size",     sub: "Capital Parameters",   icon: "💰" },
  { num: "05", title: "Review",          sub: "Confirm & Submit",     icon: "✅" },
];

// ─── Select options ────────────────────────────────────────────────────────────

export const sectorOptions: { value: string; label: string }[] = [
  { value: "climatetech", label: "Climatetech" },
  { value: "biotech",     label: "Biotechnology" },
  { value: "agtech",      label: "Agtech" },
  { value: "deeptech",    label: "Deeptech" },
  { value: "fintech",     label: "Fintech" },
  { value: "healthtech",  label: "Healthtech" },
  { value: "edtech",      label: "Edtech" },
  { value: "cleantech",   label: "Cleantech" },
  { value: "saas",        label: "SaaS" },
  { value: "ecommerce",   label: "E-commerce" },
  { value: "ai-ml",       label: "AI/ML" },
  { value: "robotics",    label: "Robotics" },
];

export const stageOptions: { value: string; label: string }[] = [
  { value: "IDEA",     label: "Idea / Pre-product" },
  { value: "PRE_SEED", label: "Pre-Seed / MVP" },
  { value: "SEED",     label: "Seed" },
  { value: "SERIES_A", label: "Series A" },
  { value: "SERIES_B", label: "Series B+" },
  { value: "GROWTH",   label: "Growth" },
];

export const geoOptions = [
  "North America", "South America", "Europe", "Middle East & Africa",
  "South Asia", "Southeast Asia", "East Asia", "Oceania", "Global",
];

export const investorTypeOptions: { value: string; label: string }[] = [
  { value: "ANGEL",           label: "Angel Investor" },
  { value: "VENTURE_CAPITAL", label: "Venture Capital" },
  { value: "PRIVATE_EQUITY",  label: "Private Equity" },
  { value: "CORPORATE",       label: "Corporate / CVC" },
  { value: "FAMILY_OFFICE",   label: "Family Office" },
  { value: "ACCELERATOR",     label: "Accelerator / Incubator" },
];

// ─── Validation helpers ────────────────────────────────────────────────────────

export const FREE_EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com", "icloud.com",
];

export const TZ_TO_CC: Record<string, string> = {
  "Africa/Addis_Ababa": "ET", "Africa/Cairo": "EG", "Africa/Casablanca": "MA",
  "Africa/Lagos": "NG", "Africa/Nairobi": "KE", "Africa/Tunis": "TN",
  "America/Bogota": "CO", "America/Buenos_Aires": "AR", "America/Chicago": "US",
  "America/Denver": "US", "America/Lima": "PE", "America/Los_Angeles": "US",
  "America/Mexico_City": "MX", "America/New_York": "US", "America/Phoenix": "US",
  "America/Santiago": "CL", "America/Sao_Paulo": "BR", "America/Toronto": "CA",
  "America/Vancouver": "CA", "Asia/Baghdad": "IQ", "Asia/Baku": "AZ",
  "Asia/Bangkok": "TH", "Asia/Colombo": "LK", "Asia/Dhaka": "BD",
  "Asia/Dubai": "AE", "Asia/Ho_Chi_Minh": "VN", "Asia/Hong_Kong": "HK",
  "Asia/Jakarta": "ID", "Asia/Karachi": "PK", "Asia/Kathmandu": "NP",
  "Asia/Kolkata": "IN", "Asia/Kuala_Lumpur": "MY", "Asia/Kuwait": "KW",
  "Asia/Manila": "PH", "Asia/Qatar": "QA", "Asia/Riyadh": "SA",
  "Asia/Seoul": "KR", "Asia/Shanghai": "CN", "Asia/Singapore": "SG",
  "Asia/Taipei": "TW", "Asia/Tashkent": "UZ", "Asia/Tehran": "IR",
  "Asia/Tokyo": "JP", "Asia/Yangon": "MM", "Australia/Melbourne": "AU",
  "Australia/Perth": "AU", "Australia/Sydney": "AU", "Europe/Amsterdam": "NL",
  "Europe/Athens": "GR", "Europe/Belgrade": "RS", "Europe/Berlin": "DE",
  "Europe/Brussels": "BE", "Europe/Bucharest": "RO", "Europe/Budapest": "HU",
  "Europe/Copenhagen": "DK", "Europe/Dublin": "IE", "Europe/Helsinki": "FI",
  "Europe/Istanbul": "TR", "Europe/Kyiv": "UA", "Europe/Lisbon": "PT",
  "Europe/London": "GB", "Europe/Madrid": "ES", "Europe/Moscow": "RU",
  "Europe/Oslo": "NO", "Europe/Paris": "FR", "Europe/Prague": "CZ",
  "Europe/Rome": "IT", "Europe/Sofia": "BG", "Europe/Stockholm": "SE",
  "Europe/Warsaw": "PL", "Europe/Zurich": "CH", "Pacific/Auckland": "NZ",
};

// ─── Currency data ─────────────────────────────────────────────────────────────

export const CURRENCIES = [
  { code: "USD", symbol: "$",    name: "US Dollar" },
  { code: "EUR", symbol: "€",    name: "Euro" },
  { code: "GBP", symbol: "£",    name: "British Pound" },
  { code: "INR", symbol: "₹",    name: "Indian Rupee" },
  { code: "AED", symbol: "د.إ",  name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼",    name: "Saudi Riyal" },
  { code: "SGD", symbol: "S$",   name: "Singapore Dollar" },
  { code: "AUD", symbol: "A$",   name: "Australian Dollar" },
  { code: "CAD", symbol: "C$",   name: "Canadian Dollar" },
  { code: "JPY", symbol: "¥",    name: "Japanese Yen" },
  { code: "CNY", symbol: "¥",    name: "Chinese Yuan" },
  { code: "CHF", symbol: "Fr",   name: "Swiss Franc" },
  { code: "BRL", symbol: "R$",   name: "Brazilian Real" },
  { code: "ZAR", symbol: "R",    name: "South African Rand" },
  { code: "NGN", symbol: "₦",    name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh",  name: "Kenyan Shilling" },
  { code: "PKR", symbol: "₨",    name: "Pakistani Rupee" },
  { code: "BDT", symbol: "৳",    name: "Bangladeshi Taka" },
  { code: "MYR", symbol: "RM",   name: "Malaysian Ringgit" },
  { code: "IDR", symbol: "Rp",   name: "Indonesian Rupiah" },
  { code: "PHP", symbol: "₱",    name: "Philippine Peso" },
  { code: "THB", symbol: "฿",    name: "Thai Baht" },
  { code: "KRW", symbol: "₩",    name: "South Korean Won" },
  { code: "TRY", symbol: "₺",    name: "Turkish Lira" },
  { code: "MXN", symbol: "Mex$", name: "Mexican Peso" },
  { code: "RUB", symbol: "₽",    name: "Russian Ruble" },
  { code: "SEK", symbol: "kr",   name: "Swedish Krona" },
  { code: "NOK", symbol: "kr",   name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr",   name: "Danish Krone" },
  { code: "NZD", symbol: "NZ$",  name: "New Zealand Dollar" },
  { code: "HKD", symbol: "HK$",  name: "Hong Kong Dollar" },
  { code: "QAR", symbol: "QR",   name: "Qatari Riyal" },
  { code: "KWD", symbol: "KD",   name: "Kuwaiti Dinar" },
  { code: "EGP", symbol: "E£",   name: "Egyptian Pound" },
];

export const VALID_CURRENCY_CODES = new Set(CURRENCIES.map(c => c.code));

export const MAX_TICKET_BY_CURRENCY: Record<string, number> = {
  INR:     990_000_000,
  USD:     100_000_000,
  EUR:     100_000_000,
  GBP:     100_000_000,
  DEFAULT: 999_999_999,
};

export const MIN_TICKET = 500;

// ─── Ticket formatting helpers ─────────────────────────────────────────────────

export function formatTicketAmount(raw: string, currencyCode: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  if (isNaN(num)) return "";
  const max = MAX_TICKET_BY_CURRENCY[currencyCode] ?? MAX_TICKET_BY_CURRENCY.DEFAULT;
  const clamped = Math.min(num, max);
  if (currencyCode === "INR") {
    const s = clamped.toString();
    if (s.length <= 3) return s;
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  }
  return clamped.toLocaleString("en-US");
}

export function parseTicketAmount(formatted: string): number {
  return Number(formatted.replace(/,/g, ""));
}

// ─── Password validation ───────────────────────────────────────────────────────

export function validatePasswordValue(password: string): string | null {
  if (password.length < 8)             return "At least 8 characters required.";
  if (!/[a-z]/.test(password))         return "Needs a lowercase letter.";
  if (!/[0-9]/.test(password))         return "Needs a number.";
  if (!/[^A-Za-z0-9]/.test(password))  return "Needs a special character.";
  return null;
}

// ─── Field-level validation ────────────────────────────────────────────────────

import {
  INVESTOR_CHAR_LIMITS,
  INVESTOR_TYPE_VALUES,
} from "@/lib/investor/Investorschema ";

export function validate(
  id: string,
  value: string,
  ctx: { dialCountry?: string; currency?: string; confirmPassword?: string; password?: string } = {}
): VResult {
  switch (id) {
    case "name":
      if (!value.trim()) return { error: "Please enter your full name" };
      if (value.trim().length < 2) return { error: "At least 2 characters" };
      if (value.length > INVESTOR_CHAR_LIMITS.name) return { error: `Max ${INVESTOR_CHAR_LIMITS.name} characters` };
      if (!/^[A-Za-z\u00C0-\u017E\s'\-]+$/.test(value.trim()))
        return { error: "Only letters, spaces, hyphens and apostrophes" };
      return { success: "Looks good" };

    case "email": {
      if (!value.trim()) return { error: "Email is required" };
      if (value.length > INVESTOR_CHAR_LIMITS.email) return { error: "Email is too long" };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()))
        return { error: "Doesn't look valid — try name@company.com" };
      if (value.toLowerCase().endsWith(".con") || value.toLowerCase().endsWith(".cmo"))
        return { error: "Possible typo — did you mean .com?" };
      const domain = value.split("@")[1]?.toLowerCase();
      if (FREE_EMAIL_DOMAINS.includes(domain))
        return { warning: "A professional email builds more trust with startups" };
      return { success: "Valid email" };
    }

    case "password": {
      if (!value) return { error: "Password is required" };
      const err = validatePasswordValue(value);
      if (err) return { error: err };
      return { success: "Password looks strong" };
    }

    case "confirmPassword": {
      if (!value) return { error: "Please confirm your password" };
      if (value !== ctx.password) return { error: "Passwords do not match" };
      return { success: "Passwords match" };
    }

    case "mobile": {
      if (!value.trim()) return {};
      if (!ctx.dialCountry) return { warning: "Select a country code to validate" };
      try {
        const { isValidPhoneNumber, parsePhoneNumber } = require("libphonenumber-js");
        if (!isValidPhoneNumber(value, ctx.dialCountry))
          return { error: "Invalid number for the selected country" };
        const p = parsePhoneNumber(value, ctx.dialCountry);
        return { success: `Valid · ${p.formatInternational()}` };
      } catch {
        return { error: "Could not parse — check the format" };
      }
    }

    case "firmName":
      if (!value.trim()) return { warning: "Adding your firm or fund name increases credibility" };
      if (value.length > INVESTOR_CHAR_LIMITS.firmName) return { error: `Max ${INVESTOR_CHAR_LIMITS.firmName} characters` };
      return { success: "Looks good" };

    case "designation":
      if (!value.trim()) return { warning: "Your title helps startups understand your role" };
      if (value.length > INVESTOR_CHAR_LIMITS.designation) return { error: `Max ${INVESTOR_CHAR_LIMITS.designation} characters` };
      return {};

    case "investorType":
      if (!value) return { error: "Please select your investor type" };
      if (!(INVESTOR_TYPE_VALUES as readonly string[]).includes(value))
        return { error: "Please select a valid investor type" };
      return {};

    case "bio":
      if (value.length > INVESTOR_CHAR_LIMITS.bio) return { error: `Max ${INVESTOR_CHAR_LIMITS.bio} characters` };
      return {};

    case "websiteUrl":
      if (!value.trim()) return {};
      if (!value.trim().startsWith("https://")) return { error: "Must start with https://" };
      if (!/^https:\/\/.+\..+/.test(value.trim())) return { error: "Must be a valid URL — e.g. https://yourfirm.com" };
      if (value.length > INVESTOR_CHAR_LIMITS.websiteUrl) return { error: `Max ${INVESTOR_CHAR_LIMITS.websiteUrl} characters` };
      return { success: "Valid URL" };

    case "linkedinUrl":
      if (!value.trim()) return {};
      if (!value.trim().startsWith("https://")) return { error: "Must start with https://" };
      if (!value.includes("linkedin.com")) return { warning: "This doesn't look like a LinkedIn URL" };
      if (value.length > INVESTOR_CHAR_LIMITS.linkedinUrl) return { error: `Max ${INVESTOR_CHAR_LIMITS.linkedinUrl} characters` };
      return { success: "Valid LinkedIn profile" };

    case "investmentThesis":
      if (!value.trim()) return { warning: "A clear thesis attracts better-aligned founders" };
      if (value.trim().length > 30) return { success: "Great — founders will appreciate the clarity" };
      return {};

    case "ticketSizeMin":
    case "ticketSizeMax": {
      if (!value.trim()) return { warning: "Specify a ticket size for better matches" };
      const num = parseTicketAmount(value);
      const currency = ctx.currency ?? "USD";
      const maxVal = MAX_TICKET_BY_CURRENCY[currency] ?? MAX_TICKET_BY_CURRENCY.DEFAULT;
      if (num < MIN_TICKET) return { error: `Minimum is ${MIN_TICKET.toLocaleString()}` };
      if (num > maxVal) return { error: `Maximum is ${maxVal.toLocaleString()}` };
      return { success: `${value}` };
    }

    default:
      return {};
  }
}