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

export interface BriefResult {
  source: "ai" | "baseline";
  doc: BriefDoc;
  company: EvidencePack["company"];
  generatedAt: Date;
}

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

const DEMO_BRIEF: BriefDoc = {
  headline:
    "Hartmann Antriebstechnik: is the move to SAP S/4HANA Cloud worth it, can we manage the risk, and why now?",
  standToday: {
    summary:
      "Where Hartmann Antriebstechnik stands today — the facts this decision rests on, including what isn't fully known yet.",
    facts: [
      "SAP version: SAP ECC (on ECC for 20 years).",
      "Profile: ~1,200 · Industrial Machine Builder (Family-owned) · Germany.",
      "Maintenance clock: Mainstream support ends December 2027.",
      "Data sensitivity: High (Family-owned / IP protection).",
      "8 participant(s) across 4 of 5 departments completed their input tasks.",
    ],
    unknowns: [
      "Not all teams have weighed in yet: Tech Team.",
      "Complete custom-code inventory and usage statistics are not fully documented.",
    ],
  },
  ourPeopleSaid: {
    summary: "Your own people surfaced the points below. This is Hartmann's voice, not a vendor's.",
    byDepartment: [
      {
        department: "Captain",
        points: [
          "Prioritize the Risks: most said 'No tested rollback plan if go-live fails'",
          "Sets the Vision: clear commitment to standardizing core processes",
        ],
      },
      {
        department: "Finance-Pros",
        points: [
          "CFO Sabine Wagner notes: 'I'm not against the cloud. I'm against signing a number I can't defend.'",
          "Pain Point → Cloud Benefit: most said 'More real-time insights for inventory and P&L control'",
          "First Closing After Go-Live: most said 'Incomplete financial postings'",
        ],
      },
      {
        department: "Tech Team",
        points: [
          "Custom Code Reality Check: most said 'High complexity and custom code volume'",
          "Interface Risk Radar: most said 'Database-level interfaces create high migration risk'",
          "Clean Core Decision Gate: most said 'Strong commitment to clean-core standards'",
        ],
      },
      {
        department: "Ops-heroes",
        points: [
          "Real-time Potential: most said 'Quality Defects'",
          "Downtime Check: most said 'Assembly Line'",
        ],
      },
      {
        department: "People-Chamions",
        points: [
          "Change Booster or Blocker?: most said 'Booster'",
          "Training Match: most said 'Hands-on process testing'",
          "Resistance Ranking: most said 'Employees do not understand why the change is happening'",
        ],
      },
    ],
    alignment: ["Finance and Production were split on the urgency of the cloud reporting benefits."],
  },
  worth: {
    summary: "The value, in your terms — not generic SAP features, and not a number we made up.",
    valueDrivers: [
      "Sabine isn't blocking the future. She's protecting 1,200 jobs and 60 years of a family's name. 'Show me the number' is her job.",
      "Finance reported ~5 days for the monthly close — shortening this is real value.",
      "Production flagged Assembly Line downtime as the highest risk — live data targets this directly.",
      "AI you'd unlock: Joule and SAP Business AI across finance and operations.",
    ],
    peerOutcome:
      "Companies your size who moved: shortened monthly close by 2 days; got real-time operational reporting; unlocked SAP Business AI. (Illustrative — real attributed references available on request.)",
    roiPointer:
      "We deliberately don't invent a savings figure. Your real number deserves SAP's own modelling — use SAP's official ROI calculator.",
  },
  costAndHard: {
    summary: "The honest costs and the parts that are genuinely hard — the section a skeptical CFO checks first.",
    items: [
      "This is real work — typically around a six-month effort, with genuine business disruption to plan for.",
      "Customisation doesn't all carry over: clean-core means some custom code is replaced with standard or retired.",
      "Connected systems are affected — interfaces and integrations need review and re-testing.",
      "The commercial model shifts from capex to opex.",
    ],
  },
  derisking: {
    summary: "What could go wrong, and how it's managed — turning the loudest fear into a plan.",
    scenario:
      "The scenario to plan against: a process your team ranked least able to tolerate standstill ('Assembly Line') going down at go-live.",
    mitigations: [
      "A tested first month-end close (a dress rehearsal) before go-live.",
      "Phased rollout rather than big-bang where the landscape allows.",
      "A tested rollback and business-continuity plan, agreed up front.",
    ],
  },
  whyNow: {
    summary: "Why now — grounded in your clock and your competitive context, not a generic countdown.",
    points: [
      "Hartmann Antriebstechnik is still on SAP ECC, whose mainstream maintenance ends at the end of 2027. Transitioning now avoids support premiums.",
      "Every month on ECC is a month without the AI competitors may already be deploying.",
    ],
  },
  path: {
    recommended: "RISE",
    label: "RISE with SAP",
    confident: true,
    reasoning: [
      "At your size and with standard data needs, RISE gets you to value — and AI — fastest.",
      "Best-practice standard processes mean less to maintain and the lowest total cost of ownership.",
    ],
    sovereignty: "Sovereignty fits your profile — standard public-cloud regions are fine.",
  },
  nextStep: {
    summary: "The next step isn't 'buy the cloud.' It's a free EvoKit session — a low-commitment, honest readiness check.",
    whatYouGet: [
      "A real SAP Readiness Check against your actual system",
      "A roadmap grounded in your estate, not a template",
      "An honest assessment of effort, cost and risk",
      "No commitment — you walk away with the analysis either way",
    ],
  },
};

const DEMO_COMPANY = {
  name: "Hartmann Antriebstechnik",
  industry: "Industrial Machine Builder (Family-owned)",
  country: "Germany",
  sapVersion: "SAP ECC",
  companySize: "~1,200",
  dataSensitivity: "High (Family-owned / IP protection)",
};

// On-demand path (the API route): serve the persisted brief if it matches the
// current data, otherwise generate + persist now.
export async function getBriefForSession(session: LoadedSession, content: Content): Promise<BriefResult> {
  // DEMO session always returns the hardcoded Sabine Wagner brief — no DB or AI call needed.
  // This guarantees consistent demo quality on any machine, regardless of seed state.
  if (session.code === "DEMO") {
    return {
      source: "baseline",
      doc: DEMO_BRIEF,
      company: DEMO_COMPANY,
      generatedAt: new Date("2025-06-01T09:00:00Z"),
    };
  }

  const pack = buildEvidencePack(session, content);
  const hash = evidenceHash(pack);

  const existing = await prisma.generatedBrief.findUnique({ where: { sessionId: session.id } });
  if (existing && existing.inputHash === hash) {
    // Already generated for this exact data — serve it, no API call.
    if (existing.status === "ready") {
      return {
        source: existing.source === "ai" ? "ai" : "baseline",
        doc: existing.doc as BriefDoc,
        company: pack.company,
        generatedAt: existing.generatedAt,
      };
    }
    // Another request (or the background worker) is already generating this exact
    // brief — don't spend a second API call; serve the deterministic baseline now.
    if (existing.status === "generating") {
      return { source: "baseline", doc: buildDeterministicBriefDoc(pack), company: pack.company, generatedAt: new Date() };
    }
  }

  // Claim the slot so concurrent opens don't each call the model.
  await prisma.generatedBrief.upsert({
    where: { sessionId: session.id },
    create: { sessionId: session.id, inputHash: hash, status: "generating", source: "baseline", doc: {} as never },
    update: { inputHash: hash, status: "generating" },
  });
  const { source, doc, model } = await produceBrief(pack);
  const saved = await persist(session.id, hash, source, doc, model);
  return { source, doc, company: pack.company, generatedAt: saved.generatedAt };
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
