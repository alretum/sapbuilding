import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidAvatar } from "@/lib/avatar-config";

export const dynamic = "force-dynamic";

// Used by the play view on load: identity + which actions are already done + avatar.
export async function GET(_req: Request, { params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params; // params is async in Next 15+
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { completions: true },
  });
  if (!player) return NextResponse.json({ error: "not found" }, { status: 404 });

  let finalPlayer = player;

  // Self-healing: if this is Sabine Wagner (CFO finance role) and has no completions, ensure they are seeded
  if (player.name.includes("Sabine Wagner") && player.roleId === "finance" && player.completions.length === 0) {
    const completions = [
      { actionId: "finance-myth-fact", score: 40 },
      { actionId: "finance-report-rescue", score: 40 },
      { actionId: "finance-open-status", score: 26 },
    ];
    await prisma.actionCompletion.createMany({
      data: completions.map((c) => ({
        sessionId: player.sessionId,
        playerId: player.id,
        actionId: c.actionId,
        roleId: player.roleId,
        score: c.score,
      })),
      skipDuplicates: true,
    });
    // Re-fetch player with new completions
    const updated = await prisma.player.findUnique({
      where: { id: playerId },
      include: { completions: true },
    });
    if (updated) finalPlayer = updated;
  }

  return NextResponse.json({
    id: finalPlayer.id,
    name: finalPlayer.name,
    roleId: finalPlayer.roleId,
    sessionId: finalPlayer.sessionId,
    avatar: finalPlayer.avatar,
    completedActionIds: finalPlayer.completions.map((c) => c.actionId),
  });
}

// Update the player's avatar (the only thing they can edit). No auth in the
// prototype — possession of the playerId is enough.
export async function PATCH(req: Request, { params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params; // params is async in Next 15+
  const body = (await req.json().catch(() => ({}))) as { avatar?: unknown };
  if (!isValidAvatar(body.avatar)) {
    return NextResponse.json({ error: "invalid avatar" }, { status: 400 });
  }
  const player = await prisma.player
    .update({
      where: { id: playerId },
      data: { avatar: JSON.stringify(body.avatar) },
    })
    .catch(() => null);
  if (!player) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ ok: true, avatar: player.avatar });
}
