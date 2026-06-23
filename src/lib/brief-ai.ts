import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { briefDocSchema, type BriefDoc } from "./brief-doc";
import type { EvidencePack } from "./evidence-pack";
import { SAP_READINESS_CHECK, SAP_ROI_CALCULATOR } from "./sap-links";

// ---------------------------------------------------------------------------
// AI synthesis layer. The ONLY place an LLM is used in the whole app.
// It is a *writer over a fixed evidence base*: it turns the deterministic
// evidence pack into the 8-section BriefDoc, obeying the honesty rules. It
// does NOT compute numbers or decide the path (that stays in recommendation.ts
// and is forced back in). Server-side only — the key never reaches the client.
// On any failure the caller falls back to the deterministic brief.
// ---------------------------------------------------------------------------

const MODEL = process.env.BRIEF_MODEL || "claude-haiku-4-5";

const SYSTEM = `You are writing a board-ready decision brief for a mid-size SAP customer weighing a move from SAP ECC to SAP S/4HANA Cloud. A champion takes this brief INTERNALLY to their C-suite to answer three questions: is it worth it, can we manage the risk, and why now.

Five non-negotiable rules:
1. Speak the customer's business, not SAP's product. Lead with their monthly close, their custom code, their operations and their competitors — never state a benefit as a SAP feature.
2. Honesty over persuasion. Name costs, effort and limits plainly. Sections 4 (cost / what's hard) and 5 (de-risking) MUST be real and specific to the company's own flagged signals, not boilerplate.
3. Evidence, not assertions. Every claim must trace to the evidence pack, a clearly-labelled illustrative peer, or a real SAP tool. NEVER invent a number. NEVER state a euro or dollar savings figure — if value needs a number, say so and route to SAP's ROI calculator. You may cite the company's OWN input numbers from the pack.
4. Answer the board's real questions: worth it (value, downside-tested), risk (what breaks, what mitigates), timing (why now vs wait).
5. It must read like the company's own team assembled it — sober, forwardable, specific.

Hard bans: no game or score language whatsoever (no "readiness score", "preparation score", "points", "leaderboard", "level up", "confetti", no game framing); no fabricated ROI or savings figures; no peer "proof" that isn't clearly labelled illustrative.

Use the frequency distributions: where the team was "split", say so — disagreement is honest, board-relevant content and an alignment signal. Lead sections 1 and 2 with the open-ended status answers and the team's own words and numbers (the "statusSignal" items). Keep prose tight and concrete; prefer the company's specifics over generic statements.

The litmus test for every line: a skeptical CFO who assumes everything from SAP is marketing must find nothing to dismiss as a sales pitch, and be willing to forward this under their own name. Emit the brief by calling the emit_brief tool.`;

function toolSchema(): Anthropic.Tool["input_schema"] {
  const s = z.toJSONSchema(briefDocSchema) as Record<string, unknown>;
  delete s.$schema;
  return s as Anthropic.Tool["input_schema"];
}

function buildUserPrompt(pack: EvidencePack): string {
  return [
    "EVIDENCE PACK — aggregated, de-identified signals captured from this company's own employees. Build the brief ONLY from these facts:",
    "```json",
    JSON.stringify(pack, null, 2),
    "```",
    `The recommended path is already decided by a transparent rules engine: ${pack.recommendation.path} (${pack.recommendation.pathLabel}); confident=${pack.recommendation.confident}. Use exactly this path in section 7 and make the reasoning visible from the rationale ("you said X, Y, Z → therefore this").`,
    `When you route to SAP's real tools, refer to SAP's official Readiness Check (${SAP_READINESS_CHECK}) and ROI calculator (${SAP_ROI_CALCULATOR}).`,
    `In ourPeopleSaid.byDepartment, include an entry for EVERY involved department using its exact "name" from the pack (${pack.departments.map((d) => d.name).join(", ")}); for a department with no participants, leave its points array empty.`,
    "Now call emit_brief with all 8 sections, obeying every rule.",
  ].join("\n");
}

// Guarantee every involved department appears (in canonical order), even ones
// nobody joined — match the model's entries case-insensitively, fill the rest empty.
function withAllDepartments(doc: BriefDoc, pack: EvidencePack): BriefDoc {
  const norm = (s: string) => s.trim().toLowerCase();
  const byName = new Map(doc.ourPeopleSaid.byDepartment.map((d) => [norm(d.department), d.points]));
  const byDepartment = pack.departments.map((d) => ({ department: d.name, points: byName.get(norm(d.name)) ?? [] }));
  return { ...doc, ourPeopleSaid: { ...doc.ourPeopleSaid, byDepartment } };
}

function forcePath(doc: BriefDoc, pack: EvidencePack): BriefDoc {
  return {
    ...doc,
    path: {
      ...doc.path,
      recommended: pack.recommendation.path,
      label: pack.recommendation.pathLabel,
      confident: pack.recommendation.confident,
      sovereignty: doc.path.sovereignty || pack.recommendation.sovereignty,
    },
  };
}

const BANNED: RegExp[] = [/confetti/i, /readiness score/i, /preparation score/i, /\bleaderboard\b/i, /level[\s-]?up/i, /gamif/i];

function allowedNumbers(pack: EvidencePack): Set<string> {
  const set = new Set<string>();
  for (const d of pack.departments)
    for (const ev of d.signals)
      if (ev.kind === "numeric") for (const m of ev.metrics) for (const v of m.values) set.add(String(v));
  return set;
}

// Deterministic honesty linter — enforces the litmus test the model was told to obey.
function lint(doc: BriefDoc, pack: EvidencePack): string[] {
  const text = JSON.stringify(doc);
  const out: string[] = [];
  for (const re of BANNED) if (re.test(text)) out.push(`Remove game/score language matching ${re}.`);

  const allowed = allowedNumbers(pack);
  const moneyRe = /[€$£]\s?\d[\d.,]*|\b\d[\d.,]*\s?(?:eur|euros?|usd|dollars?)\b/gi;
  for (const m of text.match(moneyRe) ?? []) {
    const digits = m.replace(/[^\d]/g, "");
    if (digits && !allowed.has(digits))
      out.push(`Remove the unsourced monetary figure “${m}”. Only the company's own ROI inputs may be cited; route euro estimates to SAP's ROI calculator instead.`);
  }
  if (doc.costAndHard.items.length === 0) out.push("Section 4 (cost / what's hard) must not be empty.");
  if (doc.derisking.mitigations.length === 0) out.push("Section 5 (de-risking) must list concrete mitigations.");
  return out;
}

export async function generateBriefDoc(pack: EvidencePack): Promise<BriefDoc> {
  if (process.env.BRIEF_AI_DISABLED === "1") throw new Error("brief AI disabled via BRIEF_AI_DISABLED");
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });
  const userPrompt = buildUserPrompt(pack);
  const tool: Anthropic.Tool = {
    name: "emit_brief",
    description: "Emit the board-ready challenge brief as structured data (the 8 sections).",
    input_schema: toolSchema(),
  };

  let violations: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const content =
      attempt === 0
        ? userPrompt
        : `${userPrompt}\n\nYour previous draft was rejected. Fix these and call emit_brief again:\n- ${violations.join("\n- ")}`;

    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      tools: [tool],
      tool_choice: { type: "tool", name: "emit_brief" },
      messages: [{ role: "user", content }],
    });

    const block = resp.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("model did not call emit_brief");

    const parsed = briefDocSchema.safeParse(block.input);
    if (!parsed.success) {
      violations = parsed.error.issues.slice(0, 8).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
      continue;
    }
    const doc = withAllDepartments(forcePath(parsed.data, pack), pack);
    violations = lint(doc, pack);
    if (violations.length === 0) return doc;
  }

  throw new Error(`brief failed validation/honesty checks after retry: ${violations.join("; ")}`);
}
