// src/app/api/countries/route.ts

import { NextResponse } from "next/server";

interface RestCountry {
  cca2: string;
  name: { common: string };
  flags: { png: string; svg: string; alt?: string };
  idd?: { root?: string; suffixes?: string[] };
  currencies?: Record<string, { name: string; symbol?: string }>;
}

export interface CountryData {
  code: string;
  name: string;
  flag: string;
  dial: string;
  currency: string;
}

let cache: CountryData[] | null = null;
let cacheAt = 0;
const TTL = 24 * 60 * 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cacheAt < TTL) {
    return NextResponse.json(cache, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
    });
  }

  try {
    const res = await fetch(
      "https://restcountries.com/v3.1/all?fields=cca2,name,flags,idd,currencies", // ← flags not flag
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) throw new Error(`restcountries responded ${res.status}`);

    const raw: RestCountry[] = await res.json();

    const countries: CountryData[] = raw
      .filter(c =>
        c.idd?.root &&
        c.idd.root.length > 0 &&
        c.idd.suffixes &&
        c.idd.suffixes.length > 0
      )
      .map(c => {
        const root = c.idd!.root!;
        const suffixes = c.idd!.suffixes!;

        const dial = suffixes.length === 1
          ? `${root}${suffixes[0]}`
          : root;

        const currency = c.currencies
          ? Object.keys(c.currencies)[0] ?? "USD"
          : "USD";

        return {
          code:     c.cca2,
          name:     c.name.common,
          flag:     c.flags.svg, // ← now works because flags is actually returned
          dial,
          currency,
        };
      })
      .filter(c => c.dial.startsWith("+") && c.dial.length > 1)
      .sort((a, b) => a.name.localeCompare(b.name));

    cache   = countries;
    cacheAt = Date.now();

    return NextResponse.json(countries, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
    });
  } catch (err) {
    console.error("[/api/countries]", err);
    return NextResponse.json([], { status: 503 });
  }
}