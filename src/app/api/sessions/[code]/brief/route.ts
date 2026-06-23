import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getContent } from "@/lib/content";
import { getBriefForSession } from "@/lib/brief-store";

export const dynamic = "force-dynamic";

// Serves the persisted brief if it's current (incl. one auto-generated in the
// background once everyone finished — so the CEO opens it instantly), otherwise
// generates it on demand. AI synthesis with a deterministic fallback, all in
// the store. See docs/challenge-brief-rebuild.md.
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await prisma.session.findUnique({
    where: { code: code.toUpperCase() },
    include: { players: true, completions: true },
  });
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { source, doc, company, generatedAt } = await getBriefForSession(session, getContent());
  return NextResponse.json({ source, doc, company, sessionId: session.id, generatedAt });
}
