import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getContent } from "@/lib/content";
import { generateCode } from "@/lib/code";
import { isAdminAuthorized } from "@/lib/admin";
import { REGIONS } from "@/lib/germany";

export const dynamic = "force-dynamic";

// List company challenges (SAP admin view).
export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { players: true } } },
  });
  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      involvedRoles: s.involvedRoles,
      strictGate: s.strictGate,
      players: s._count.players,
      createdAt: s.createdAt,
    })),
  });
}

// Create a company challenge. SAP sets these up on behalf of the company;
// employees then just join with the code. Admin-gated (see isAdminAuthorized).
export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const content = getContent();

  const involvedRoles =
    Array.isArray(body.involvedRoles) && body.involvedRoles.length > 0
      ? (body.involvedRoles as string[]).filter((id) => content.roles.some((r) => r.id === id))
      : content.roles.map((r) => r.id);

  // Optional location for the readiness map. Only stored if a region is given;
  // we trust the curated city/coords the admin form selects.
  const regionCode = REGIONS.some((r) => r.code === body.regionCode) ? (body.regionCode as string) : null;
  const city = regionCode && typeof body.city === "string" ? body.city : null;
  const lat = regionCode && typeof body.lat === "number" ? body.lat : null;
  const lng = regionCode && typeof body.lng === "number" ? body.lng : null;

  // Generate a unique join code (retry a few times on the rare collision).
  let code = generateCode();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.session.findUnique({ where: { code } });
    if (!exists) break;
    code = generateCode();
  }

  const session = await prisma.session.create({
    data: {
      code,
      name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Cloud Readiness Challenge",
      involvedRoles,
      status: "active",
      startedAt: new Date(),
      strictGate: Boolean(body.strictGate),
      leaderboardPublic: body.leaderboardPublic === undefined ? true : Boolean(body.leaderboardPublic),
      regionCode,
      city,
      lat,
      lng,
    },
  });

  return NextResponse.json({ id: session.id, code: session.code });
}
