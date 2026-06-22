import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeSessionSnapshot } from "@/lib/scoring";

export const dynamic = "force-dynamic";

// Initial snapshot fetch (REST fallback); live updates come over the socket.
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; // params is async in Next 15+
  const session = await prisma.session.findUnique({ where: { code: code.toUpperCase() } });
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });

  const snapshot = await computeSessionSnapshot(session.id);
  return NextResponse.json(snapshot);
}
