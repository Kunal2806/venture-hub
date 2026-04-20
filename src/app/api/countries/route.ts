

import { NextResponse } from "next/server";
import phoneData from "country-telephone-data";
import isoCountries from "i18n-iso-countries";
import flagEmoji from "country-flag-emoji-json";
import en from "i18n-iso-countries/langs/en.json";

isoCountries.registerLocale(en);

export interface CountryData {
  code: string;     // "IN"
  name: string;     // "India"
  flag: string;     // "https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/images/IN.svg"
  dial: string;     // "+91"
  currency: string; // "INR"
}

// ─── Currency map (ISO-2 → ISO-4217) ─────────────────────────────────────
const CURRENCY_MAP: Record<string, string> = {
  AC: "SHP", AD: "EUR", AE: "AED", AF: "AFN", AG: "XCD", AI: "XCD",
  AL: "ALL", AM: "AMD", AO: "AOA", AQ: "USD", AR: "ARS", AS: "USD",
  AT: "EUR", AU: "AUD", AW: "AWG", AX: "EUR", AZ: "AZN",
  BA: "BAM", BB: "BBD", BD: "BDT", BE: "EUR", BF: "XOF", BG: "BGN",
  BH: "BHD", BI: "BIF", BJ: "XOF", BL: "EUR", BM: "BMD", BN: "BND",
  BO: "BOB", BQ: "USD", BR: "BRL", BS: "BSD", BT: "BTN", BW: "BWP",
  BY: "BYN", BZ: "BZD",
  CA: "CAD", CC: "AUD", CD: "CDF", CF: "XAF", CG: "XAF", CH: "CHF",
  CI: "XOF", CK: "NZD", CL: "CLP", CM: "XAF", CN: "CNY", CO: "COP",
  CR: "CRC", CU: "CUP", CV: "CVE", CW: "ANG", CX: "AUD", CY: "EUR",
  CZ: "CZK",
  DE: "EUR", DJ: "DJF", DK: "DKK", DM: "XCD", DO: "DOP", DZ: "DZD",
  EC: "USD", EE: "EUR", EG: "EGP", EH: "MAD", ER: "ERN", ES: "EUR",
  ET: "ETB",
  FI: "EUR", FJ: "FJD", FK: "FKP", FM: "USD", FO: "DKK", FR: "EUR",
  GA: "XAF", GB: "GBP", GD: "XCD", GE: "GEL", GF: "EUR", GG: "GBP",
  GH: "GHS", GI: "GIP", GL: "DKK", GM: "GMD", GN: "GNF", GP: "EUR",
  GQ: "XAF", GR: "EUR", GS: "GBP", GT: "GTQ", GU: "USD", GW: "XOF",
  GY: "GYD",
  HK: "HKD", HN: "HNL", HR: "EUR", HT: "HTG", HU: "HUF",
  ID: "IDR", IE: "EUR", IL: "ILS", IM: "GBP", IN: "INR", IO: "USD",
  IQ: "IQD", IR: "IRR", IS: "ISK", IT: "EUR",
  JE: "GBP", JM: "JMD", JO: "JOD", JP: "JPY",
  KE: "KES", KG: "KGS", KH: "KHR", KI: "AUD", KM: "KMF", KN: "XCD",
  KP: "KPW", KR: "KRW", KW: "KWD", KY: "KYD", KZ: "KZT",
  LA: "LAK", LB: "LBP", LC: "XCD", LI: "CHF", LK: "LKR", LR: "LRD",
  LS: "LSL", LT: "EUR", LU: "EUR", LV: "EUR", LY: "LYD",
  MA: "MAD", MC: "EUR", MD: "MDL", ME: "EUR", MF: "EUR", MG: "MGA",
  MH: "USD", MK: "MKD", ML: "XOF", MM: "MMK", MN: "MNT", MO: "MOP",
  MP: "USD", MQ: "EUR", MR: "MRU", MS: "XCD", MT: "EUR", MU: "MUR",
  MV: "MVR", MW: "MWK", MX: "MXN", MY: "MYR", MZ: "MZN",
  NA: "NAD", NC: "XPF", NE: "XOF", NF: "AUD", NG: "NGN", NI: "NIO",
  NL: "EUR", NO: "NOK", NP: "NPR", NR: "AUD", NU: "NZD", NZ: "NZD",
  OM: "OMR",
  PA: "PAB", PE: "PEN", PF: "XPF", PG: "PGK", PH: "PHP", PK: "PKR",
  PL: "PLN", PM: "EUR", PN: "NZD", PR: "USD", PS: "ILS", PT: "EUR",
  PW: "USD", PY: "PYG",
  QA: "QAR",
  RE: "EUR", RO: "RON", RS: "RSD", RU: "RUB", RW: "RWF",
  SA: "SAR", SB: "SBD", SC: "SCR", SD: "SDG", SE: "SEK", SG: "SGD",
  SH: "SHP", SI: "EUR", SJ: "NOK", SK: "EUR", SL: "SLL", SM: "EUR",
  SN: "XOF", SO: "SOS", SR: "SRD", SS: "SSP", ST: "STN", SV: "USD",
  SX: "ANG", SY: "SYP", SZ: "SZL",
  TA: "GBP", TC: "USD", TD: "XAF", TF: "EUR", TG: "XOF", TH: "THB",
  TJ: "TJS", TK: "NZD", TL: "USD", TM: "TMT", TN: "TND", TO: "TOP",
  TR: "TRY", TT: "TTD", TV: "AUD", TW: "TWD", TZ: "TZS",
  UA: "UAH", UG: "UGX", UM: "USD", US: "USD", UY: "UYU", UZ: "UZS",
  VA: "EUR", VC: "XCD", VE: "VES", VG: "USD", VI: "USD", VN: "VND",
  VU: "VUV",
  WF: "XPF", WS: "WST",
  XK: "EUR",
  YE: "YER", YT: "EUR",
  ZA: "ZAR", ZM: "ZMW", ZW: "ZWL",
};

// ─── Build dataset once at module load (~1 ms, no I/O) ───────────────────
const isoNames: Record<string, string> = isoCountries.getNames("en");

// flagEmoji shape: [{ code: "IN", image: "https://cdn.jsdelivr.net/...", emoji: "🇮🇳" }]
const flagMap: Record<string, string> = Object.fromEntries(
  (flagEmoji as Array<{ code: string; image: string }>).map((f) => [f.code, f.image])
);

interface RawCountry {
  iso2: string;
  dialCode: string;
  priority?: number;
}

const COUNTRIES: CountryData[] = (phoneData.allCountries as RawCountry[])
  // priority > 0 = secondary row for the same dial code (e.g. +1 shared by US & CA)
  // keeping priority === 0 (or undefined) gives one clean entry per country
  .filter((c) => (c.priority ?? 0) === 0)
  .map((c) => {
    const code = c.iso2.toUpperCase();
    return {
      code,
      name:     isoNames[code] ?? code,
      flag:     flagMap[code]  ?? "",
      dial:     `+${c.dialCode}`,
      currency: CURRENCY_MAP[code] ?? "USD",
    };
  })
  .filter((c) => c.name && c.flag && c.dial.length > 1)
  .sort((a, b) => a.name.localeCompare(b.name));

// ─── Route handler ────────────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json(COUNTRIES, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}