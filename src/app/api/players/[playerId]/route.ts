import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidAvatar } from "@/lib/avatar-config";

export const dynamic = "force-dynamic";

// Used by the play view on load: identity + which actions are already done + avatar.
export async function GET(_req: Request, { params }: { params: { playerId: string } }) {
  const player = await prisma.player.findUnique({
    where: { id: params.playerId },
    include: { completions: true },
  });
  if (!player) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({
    id: player.id,
    name: player.name,
    roleId: player.roleId,
    sessionId: player.sessionId,
    avatar: player.avatar,
    completedActionIds: player.completions.map((c) => c.actionId),
  });
}

// Update the player's avatar (the only thing they can edit). No auth in the
// prototype — possession of the playerId is enough.
export async function PATCH(req: Request, { params }: { params: { playerId: string } }) {
  const body = (await req.json().catch(() => ({}))) as { avatar?: unknown };
  if (!isValidAvatar(body.avatar)) {
    return NextResponse.json({ error: "invalid avatar" }, { status: 400 });
  }
  const player = await prisma.player
    .update({
      where: { id: params.playerId },
      data: { avatar: JSON.stringify(body.avatar) },
    })
    .catch(() => null);
  if (!player) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ ok: true, avatar: player.avatar });
}
