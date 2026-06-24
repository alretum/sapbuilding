import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getContent } from "@/lib/content";
import { defaultAvatar } from "@/lib/avatar-config";

// Join a session by code, picking a role. Creates a player.
export async function POST(req: Request) {
  const { code, name, roleId } = (await req.json().catch(() => ({}))) as {
    code?: string;
    name?: string;
    roleId?: string;
  };

  if (!code || !name || !roleId) {
    return NextResponse.json({ error: "code, name and roleId are required" }, { status: 400 });
  }

  const content = getContent();
  if (!content.roles.some((r) => r.id === roleId)) {
    return NextResponse.json({ error: "unknown role" }, { status: 400 });
  }

  const session = await prisma.session.findUnique({ where: { code: code.toUpperCase() } });
  if (!session) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }

  let player;
  const isSabineDemo = code.toUpperCase() === "DEMO" && name.includes("Sabine Wagner") && roleId === "finance";

  if (isSabineDemo) {
    const existing = await prisma.player.findFirst({
      where: {
        sessionId: session.id,
        name: { contains: "Sabine Wagner" },
        roleId: "finance",
      },
    });

    if (existing) {
      player = existing;
      // Delete existing completions to reset Sabine to starting state
      await prisma.actionCompletion.deleteMany({
        where: { playerId: player.id },
      });
    }
  }

  if (!player) {
    // Assign a random avatar by default — no onboarding step; editable later.
    player = await prisma.player.create({
      data: { sessionId: session.id, name: name.trim(), roleId, avatar: JSON.stringify(defaultAvatar()) },
    });
  }

  // If this is Sabine Wagner (CFO finance role), pre-seed her completions automatically
  if (name.includes("Sabine Wagner") && roleId === "finance") {
    const completions = [
      { actionId: "finance-myth-fact", score: 40 },
      { actionId: "finance-report-rescue", score: 40 },
      { actionId: "finance-open-status", score: 26 },
    ];
    await prisma.actionCompletion.createMany({
      data: completions.map((c) => ({
        sessionId: session.id,
        playerId: player.id,
        actionId: c.actionId,
        roleId,
        score: c.score,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({
    sessionId: session.id,
    code: session.code,
    playerId: player.id,
    roleId,
    avatar: player.avatar,
  });
}
