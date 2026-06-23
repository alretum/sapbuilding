import { prisma } from "./prisma";
import { actionsForRole, getContent } from "./content";
import type { Content } from "./content-schema";
import type { LoadedSession } from "./scoring";
import { buildEvidencePack, evidenceHash, type EvidencePack } from "./evidence-pack";
import { buildDeterministicBriefDoc, type BriefDoc } from "./brief-doc";
import { generateBriefDoc } from "./brief-ai";

// ---------------------------------------------------------------------------
// Brief store: produce → persist → serve. One place both the on-demand route
// and the background trigger go through, so a brief is generated at most once
// per evidence-pack hash and survives restarts (the CEO opens it instantly).
// ---------------------------------------------------------------------------

export type BriefState =
  | { state: "ready"; source: "ai" | "baseline"; doc: BriefDoc; company: EvidencePack["company"]; generatedAt: Date }
  | { state: "generating"; company: EvidencePack["company"] };

// Re-kick a generation if a "generating" claim is older than this (e.g. the
// process restarted mid-generation), so the client never polls forever.
const STALE_GENERATING_MS = 3 * 60 * 1000;

const DEFAULT_MODEL = process.env.BRIEF_MODEL || "claude-haiku-4-5";

// "All participants completed" = at least one player, and every player has
// finished every action available to their role.
export function isSessionComplete(session: LoadedSession, content: Content): boolean {
  const validRoles = new Set(content.roles.map((r) => r.id));
  const players = session.players.filter((p) => validRoles.has(p.roleId));
  if (players.length === 0) return false;
  for (const p of players) {
    const required = actionsForRole(content, p.roleId).map((a) => a.id);
    if (required.length === 0) continue;
    const done = new Set(session.completions.filter((c) => c.playerId === p.id).map((c) => c.actionId));
    if (!required.every((id) => done.has(id))) return false;
  }
  return true;
}

async function produceBrief(pack: EvidencePack): Promise<{ source: "ai" | "baseline"; doc: BriefDoc; model: string | null }> {
  try {
    const doc = await generateBriefDoc(pack);
    return { source: "ai", doc, model: DEFAULT_MODEL };
  } catch (err) {
    console.warn(`[brief] AI synthesis unavailable, using deterministic baseline: ${(err as Error).message}`);
    return { source: "baseline", doc: buildDeterministicBriefDoc(pack), model: null };
  }
}

async function persist(sessionId: string, inputHash: string, source: "ai" | "baseline", doc: BriefDoc, model: string | null) {
  return prisma.generatedBrief.upsert({
    where: { sessionId },
    create: { sessionId, inputHash, status: "ready", source, doc: doc as never, model },
    update: { inputHash, status: "ready", source, doc: doc as never, model, generatedAt: new Date() },
  });
}

// On-demand path (the API route): serve the persisted brief if it matches the
// current data, otherwise generate + persist now.
// Background-safe generation: never throws (so a fire-and-forget call can't crash
// the process), and always leaves the row in a terminal "ready" state so the
// client's poll resolves.
async function produceAndPersist(sessionId: string, pack: EvidencePack, hash: string): Promise<void> {
  try {
    const { source, doc, model } = await produceBrief(pack);
    await persist(sessionId, hash, source, doc, model);
  } catch (err) {
    console.error(`[brief] generation failed for ${sessionId}: ${(err as Error).message}`);
    try {
      await persist(sessionId, hash, "baseline", buildDeterministicBriefDoc(pack), null);
    } catch {
      /* leave as generating; the staleness check will re-kick on a later open */
    }
  }
}

// On-demand entry point. Returns the ready brief if it exists for the current
// data; otherwise kicks generation off in the BACKGROUND and returns "generating"
// immediately, so the page never hangs on a ~40s request and the user only ever
// sees the AI version (no deterministic baseline flash while it's still cooking).
export async function loadOrStartBrief(session: LoadedSession, content: Content): Promise<BriefState> {
  const pack = buildEvidencePack(session, content);
  const hash = evidenceHash(pack);

  const existing = await prisma.generatedBrief.findUnique({ where: { sessionId: session.id } });
  if (existing && existing.inputHash === hash) {
    if (existing.status === "ready") {
      return {
        state: "ready",
        source: existing.source === "ai" ? "ai" : "baseline",
        doc: existing.doc as BriefDoc,
        company: pack.company,
        generatedAt: existing.generatedAt,
      };
    }
    // Already in flight (this request, a concurrent open, or the background worker)
    // — don't start a second generation; tell the client to keep polling.
    if (existing.status === "generating" && Date.now() - existing.updatedAt.getTime() < STALE_GENERATING_MS) {
      return { state: "generating", company: pack.company };
    }
    // stale claim → fall through and re-kick
  }

  // Claim the slot, then generate in the background (the custom server stays alive
  // after the response is sent, so the fire-and-forget promise runs to completion).
  await prisma.generatedBrief.upsert({
    where: { sessionId: session.id },
    create: { sessionId: session.id, inputHash: hash, status: "generating", source: "baseline", doc: {} as never },
    update: { inputHash: hash, status: "generating", source: "baseline" },
  });
  void produceAndPersist(session.id, pack, hash);
  return { state: "generating", company: pack.company };
}

// Background path (the socket hook): when everyone has finished, generate the
// brief ahead of time. Returns { generated, code } when it produced a fresh one.
export async function ensureBriefForCompletedSession(sessionId: string): Promise<{ generated: boolean; code: string } | null> {
  // Speculative pre-generation is OFF by default — it would spend API calls on
  // briefs nobody opens. Opt in with BRIEF_AUTOGEN=1 (own key / real pilot).
  // When off, the brief is still generated on demand the first time it's opened.
  if (process.env.BRIEF_AUTOGEN !== "1") return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { players: true, completions: true },
  });
  if (!session) return null;

  const content = getContent();
  if (!isSessionComplete(session, content)) return null;

  const pack = buildEvidencePack(session, content);
  const hash = evidenceHash(pack);

  const existing = await prisma.generatedBrief.findUnique({ where: { sessionId } });
  if (existing && existing.inputHash === hash && (existing.status === "ready" || existing.status === "generating")) {
    return null; // already current, or another worker is on it
  }

  // Claim the slot so a second completion event doesn't double-generate.
  await prisma.generatedBrief.upsert({
    where: { sessionId },
    create: { sessionId, inputHash: hash, status: "generating", source: "baseline", doc: {} as never },
    update: { inputHash: hash, status: "generating" },
  });

  const { source, doc, model } = await produceBrief(pack);
  await persist(sessionId, hash, source, doc, model);
  return { generated: true, code: session.code };
}
