import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getContent } from "@/lib/content";
import { loadOrStartBrief } from "@/lib/brief-store";

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

  const result = await loadOrStartBrief(session, getContent());
  if (result.state === "generating") {
    return NextResponse.json({ state: "generating", company: result.company, sessionId: session.id });
  }
  return NextResponse.json({
    state: "ready",
    source: result.source,
    doc: result.doc,
    company: result.company,
    sessionId: session.id,
    generatedAt: result.generatedAt,
  });
}
