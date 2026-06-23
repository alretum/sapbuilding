import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getContent } from "@/lib/content";
import { buildSnapshot } from "@/lib/scoring";
import { REGIONS } from "@/lib/germany";

export const dynamic = "force-dynamic";

type Agg = { sum: number; companies: number; participants: number };

export async function GET() {
  const sessions = await prisma.session.findMany({
    // Only companies that opted in to public visibility appear on the map.
    where: { regionCode: { not: null }, leaderboardPublic: true },
    include: { players: true, completions: true },
  });
  const content = getContent();

  const byRegion = new Map<string, Agg>();
  const byCity = new Map<string, Agg & { name: string; regionCode: string; lat: number; lng: number }>();

  for (const s of sessions) {
    const snap = buildSnapshot(s, content);
    const readiness = snap.companyReadiness;
    const participants = snap.leaderboard.length;

    const r = byRegion.get(s.regionCode!) ?? { sum: 0, companies: 0, participants: 0 };
    r.sum += readiness;
    r.companies += 1;
    r.participants += participants;
    byRegion.set(s.regionCode!, r);

    if (s.city && s.lat != null && s.lng != null) {
      const key = `${s.regionCode}|${s.city}`;
      const c =
        byCity.get(key) ??
        ({ sum: 0, companies: 0, participants: 0, name: s.city, regionCode: s.regionCode!, lat: s.lat, lng: s.lng } as const);
      const next = { ...c, sum: c.sum + readiness, companies: c.companies + 1, participants: c.participants + participants };
      byCity.set(key, next);
    }
  }

  const regions = REGIONS.map(({ code, name }) => {
    const a = byRegion.get(code);
    return {
      code,
      name,
      avgReadiness: a ? Math.round(a.sum / a.companies) : null,
      companies: a?.companies ?? 0,
      participants: a?.participants ?? 0,
    };
  });

  const cities = [...byCity.values()].map((c) => ({
    name: c.name,
    regionCode: c.regionCode,
    lat: c.lat,
    lng: c.lng,
    avgReadiness: Math.round(c.sum / c.companies),
    companies: c.companies,
  }));

  return NextResponse.json({ regions, cities });
}
