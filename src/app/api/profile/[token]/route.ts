import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getContent } from "@/lib/content";
import { buildSnapshot } from "@/lib/scoring";

export const dynamic = "force-dynamic";

// Read the pre-filled company profile + how far the team has participated (so the
// decision-maker view can gate the grounded report behind real participation).
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await prisma.session.findUnique({
    where: { profileToken: token },
    include: { players: true, completions: true },
  });
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });

  const snap = buildSnapshot(session, getContent());

  return NextResponse.json({
    name: session.name,
    code: session.code,
    confirmed: session.profileConfirmedAt !== null,
    profile: {
      industry: session.industry,
      country: session.country,
      sapVersion: session.sapVersion,
      companySize: session.companySize,
      dataSensitivity: session.dataSensitivity,
    },
    participation: {
      participants: snap.leaderboard.length,
      departmentsPlayed: snap.departments.filter((d) => d.participated).length,
      totalDepartments: snap.departments.length,
      preparationScore: snap.companyReadiness,
    },
  });
}

// Confirm (and optionally adjust) the profile.
export async function PATCH(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

  const updated = await prisma.session
    .update({
      where: { profileToken: token },
      data: {
        industry: str(body.industry),
        country: str(body.country),
        sapVersion: str(body.sapVersion),
        companySize: str(body.companySize),
        dataSensitivity: str(body.dataSensitivity),
        profileConfirmedAt: new Date(),
      },
    })
    .catch(() => null);
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
