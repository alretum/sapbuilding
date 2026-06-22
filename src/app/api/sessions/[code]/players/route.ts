import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// List players already in a session (optionally filtered by role). Powers the
// "pick your name, or add a new one" login — no credentials, just identity.
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; // params is async in Next 15+

  const session = await prisma.session.findUnique({ where: { code: code.toUpperCase() } });
  if (!session) return NextResponse.json({ error: "session not found" }, { status: 404 });

  const roleId = new URL(req.url).searchParams.get("roleId") ?? undefined;

  const players = await prisma.player.findMany({
    where: { sessionId: session.id, ...(roleId ? { roleId } : {}) },
    select: { id: true, name: true, roleId: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ sessionId: session.id, code: session.code, name: session.name, players });
}
