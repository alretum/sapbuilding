import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Used by the play view on load to know which actions the player already did.
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
    completedActionIds: player.completions.map((c) => c.actionId),
  });
}
