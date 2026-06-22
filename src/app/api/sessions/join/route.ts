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

  // Assign a random avatar by default — no onboarding step; editable later.
  const player = await prisma.player.create({
    data: { sessionId: session.id, name: name.trim(), roleId, avatar: JSON.stringify(defaultAvatar()) },
  });

  return NextResponse.json({
    sessionId: session.id,
    code: session.code,
    playerId: player.id,
    roleId,
    avatar: player.avatar,
  });
}
