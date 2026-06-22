import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getContent } from "@/lib/content";
import { buildSnapshot } from "@/lib/scoring";

export const dynamic = "force-dynamic";

// Cross-company leaderboard: every (public) company ranked by its Readiness
// Score. Only companies with leaderboardPublic = true are shown, so a company
// can opt out of the national board.
export async function GET() {
  const sessions = await prisma.session.findMany({
    where: { leaderboardPublic: true },
    include: { players: true, completions: true },
  });
  const content = getContent();

  const companies = sessions.map((s) => {
    const snap = buildSnapshot(s, content);
    return {
      id: s.id,
      code: s.code,
      name: s.name,
      readiness: snap.companyReadiness,
      players: snap.leaderboard.length,
      departments: snap.departments.length,
      participatingDepartments: snap.departments.filter((d) => d.participated).length,
    };
  });

  companies.sort(
    (a, b) => b.readiness - a.readiness || b.players - a.players || a.name.localeCompare(b.name),
  );

  return NextResponse.json({ companies });
}
