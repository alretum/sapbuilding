import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// List players already in a session (optionally filtered by role). Powers the
// "pick your name, or add a new one" login — no credentials, just identity.
export async function GET(req: Request, { params }: { params: { code: string } }) {
  // Next 15 makes route `params` a Promise; awaiting also works on Next 14
  // (awaiting a plain object returns it), so this is safe on both.
  const { code } = await params;
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
