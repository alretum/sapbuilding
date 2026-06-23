import { z } from "zod";
import type { ActionEvidence, DistItem, EvidencePack } from "./evidence-pack";

// ---------------------------------------------------------------------------
// BriefDoc: the render contract for the challenge brief — the 8 board-ready
// sections from the interview findings. ONE shape, TWO producers:
//   - buildDeterministicBriefDoc()  (always available; also the AI fallback)
//   - the AI synthesis layer in brief-ai.ts (writes the same shape)
// The renderer (/brief) only ever knows about BriefDoc, never about the model.
// ---------------------------------------------------------------------------

export const briefDocSchema = z.object({
  headline: z.string(),
  standToday: z.object({
    summary: z.string(),
    facts: z.array(z.string()),
    unknowns: z.array(z.string()),
  }),
  ourPeopleSaid: z.object({
    summary: z.string(),
    byDepartment: z.array(z.object({ department: z.string(), points: z.array(z.string()) })),
    alignment: z.array(z.string()),
  }),
  worth: z.object({
    summary: z.string(),
    valueDrivers: z.array(z.string()),
    peerOutcome: z.string(),
    roiPointer: z.string(),
  }),
  costAndHard: z.object({
    summary: z.string(),
    items: z.array(z.string()),
  }),
  derisking: z.object({
    summary: z.string(),
    scenario: z.string(),
    mitigations: z.array(z.string()),
  }),
  whyNow: z.object({
    summary: z.string(),
    points: z.array(z.string()),
  }),
  path: z.object({
    recommended: z.enum(["GROW", "RISE", "PREPARE"]),
    label: z.string(),
    confident: z.boolean(),
    reasoning: z.array(z.string()),
    sovereignty: z.string(),
  }),
  nextStep: z.object({
    summary: z.string(),
    whatYouGet: z.array(z.string()),
  }),
});

export type BriefDoc = z.infer<typeof briefDocSchema>;

// ---- Deterministic producer (templated, honest, no fabricated numbers) -----

function findEvidence(pack: EvidencePack, actionId: string): ActionEvidence | undefined {
  for (const d of pack.departments) {
    const e = d.signals.find((s) => s.actionId === actionId);
    if (e) return e;
  }
  return undefined;
}

function topCount(it: DistItem): number {
  return it.distribution[0]?.count ?? 0;
}

function signalLine(ev: ActionEvidence): string {
  switch (ev.kind) {
    case "distribution": {
      const it = ev.items[0];
      if (!it) return ev.title;
      const split = it.consensus === "split" ? " — team split" : "";
      const base = `${ev.title}: most said “${it.modal}” (${topCount(it)}/${ev.respondents})${split}`;
      return ev.note ? `${base}. ${ev.note}` : base;
    }
    case "numeric": {
      const parts = ev.metrics.map((m) => {
        const range = m.min === m.max ? `${m.median}` : `${m.min}–${m.max}`;
        return `${m.label}: ${range}${m.unit ? ` ${m.unit}` : ""}`;
      });
      return `${ev.title} — ${parts.join("; ")}`;
    }
    case "freetext": {
      const more = ev.responses.length > 1 ? ` (+${ev.responses.length - 1} more)` : "";
      return `${ev.title}: “${ev.responses[0]}”${more}`;
    }
    case "note":
      return ev.text;
  }
}

function valueDrivers(pack: EvidencePack): string[] {
  const out: string[] = [];
  const roi = findEvidence(pack, "finance-roi-builder");
  if (roi && roi.kind === "numeric") {
    const close = roi.metrics.find((m) => /close/i.test(m.label));
    if (close) {
      const span = close.min === close.max ? `${close.median}` : `${close.min}–${close.max}`;
      out.push(
        `Finance reported ~${span} days for the monthly close — shortening that is real value (we won't invent the euro figure).`,
      );
    }
    const excel = roi.metrics.find((m) => /excel/i.test(m.label));
    if (excel) out.push(`~${excel.max} manual Excel reports flagged — automating these removes recurring effort.`);
  }
  const bn = findEvidence(pack, "prod-bottleneck");
  if (bn && bn.kind === "distribution") {
    const flagged = bn.items.filter((i) => /bottleneck/i.test(i.modal)).map((i) => i.label);
    if (flagged.length) out.push(`Production flagged ${flagged.slice(0, 3).join(", ")} as daily friction — live data targets exactly these.`);
  }
  const rt = findEvidence(pack, "prod-realtime");
  if (rt && rt.kind === "distribution" && rt.items[0]) out.push(`The team most wants live data for ${rt.items[0].modal.toLowerCase()}.`);
  out.push(pack.recommendation.aiUnlocked);
  return out;
}

function costItems(pack: EvidencePack): string[] {
  const out: string[] = [];
  const cc = findEvidence(pack, "it-reality-check");
  if (cc && cc.kind === "distribution") {
    const volume = cc.items.find((i) => /object/i.test(i.label)) ?? cc.items[0];
    if (volume) out.push(`Custom code is a real scope driver — IT's own read on “${volume.label}” was “${volume.modal}”.`);
  }
  const ops = findEvidence(pack, "it-ops-check");
  if (ops && ops.note) out.push(ops.note);
  out.push("This is real work — typically around a six-month effort, with genuine business disruption to plan for.");
  out.push("Customisation doesn't all carry over: clean-core means some custom code is replaced with standard or retired.");
  out.push("Connected systems are affected — interfaces and integrations need review and re-testing.");
  out.push("The commercial model shifts from capex to opex.");
  for (const cav of pack.recommendation.caveats) if (!out.includes(cav)) out.push(cav);
  return out;
}

function deriskingSection(pack: EvidencePack): { scenario: string; mitigations: string[] } {
  let scenario =
    "The scenario to plan against is an operations- or finance-critical process failing at go-live — the disruption that makes this feel risky.";
  const downtime = findEvidence(pack, "prod-downtime");
  if (downtime && downtime.kind === "distribution" && downtime.items[0]) {
    scenario = `The scenario to plan against: a process your team ranked least able to tolerate standstill (“${downtime.items[0].modal}”) going down at go-live.`;
  }
  const mitigations: string[] = [];
  const hr = findEvidence(pack, "hr-starter-pack");
  if (hr && hr.kind === "distribution") {
    const chosen = hr.items.filter((i) => i.modal === "chose").slice(0, 3).map((i) => i.label);
    if (chosen.length) mitigations.push(`Change management your HR team already values: ${chosen.join("; ")}.`);
  }
  const shield = findEvidence(pack, "finance-shield");
  if (shield && shield.kind === "distribution") {
    const chosen = shield.items.filter((i) => i.modal === "chose").slice(0, 3).map((i) => i.label);
    if (chosen.length) mitigations.push(`Finance safeguards your team flagged: ${chosen.join("; ")}.`);
  }
  mitigations.push("A tested first month-end close (a dress rehearsal) before go-live.");
  mitigations.push("Phased rollout rather than big-bang where the landscape allows.");
  mitigations.push("A tested rollback and business-continuity plan, agreed up front.");
  return { scenario, mitigations };
}

export function buildDeterministicBriefDoc(pack: EvidencePack): BriefDoc {
  const c = pack.company;

  const facts: string[] = [];
  facts.push(`SAP version: ${c.sapVersion ?? "not yet confirmed"}.`);
  if (pack.clock.onEcc) facts.push(`ECC mainstream maintenance ends ${pack.clock.mainstreamEnd} (extended support to ${pack.clock.extendedEnd}, at a premium).`);
  const profileBits = [c.companySize, c.industry, c.country].filter(Boolean);
  if (profileBits.length) facts.push(`Profile: ${profileBits.join(" · ")}.`);
  if (c.dataSensitivity) facts.push(`Data sensitivity: ${c.dataSensitivity}.`);
  facts.push(`${pack.coverage.participants} participant(s) across ${pack.coverage.playedRoles.length} of ${pack.coverage.involvedRoles.length} departments took part.`);

  const unknowns = [...pack.knowledgeGaps];
  if (pack.coverage.missingRoles.length) unknowns.push(`Not all teams have weighed in yet: ${pack.coverage.missingRoles.join(", ")}.`);
  if (unknowns.length === 0)
    unknowns.push("Like many long-running ECC estates, some specifics — older custom code, undocumented interfaces — still need confirming before a firm plan.");

  // Include every involved department — even ones nobody joined — so missing
  // teams render as an empty card rather than silently dropping out.
  const byDepartment = pack.departments.map((d) => ({
    department: d.name,
    points: d.signals.slice(0, 5).map(signalLine),
  }));

  const alignment: string[] = [];
  for (const d of pack.departments) {
    for (const ev of d.signals) {
      if (ev.kind !== "distribution") continue;
      for (const it of ev.items) {
        if (it.consensus === "split") alignment.push(`${d.name} were split on “${it.label}”.`);
      }
    }
  }

  const drisk = deriskingSection(pack);

  return {
    headline: `${c.name}: is the move to SAP S/4HANA Cloud worth it, can we manage the risk, and why now?`,
    standToday: {
      summary: `Where ${c.name} stands today — the facts this decision rests on, including what isn't fully known yet.`,
      facts,
      unknowns,
    },
    ourPeopleSaid: {
      summary: `Your own people — ${pack.coverage.participants} across ${pack.coverage.playedRoles.length} department(s) — surfaced the points below. This is your organisation's voice, not a vendor's.`,
      byDepartment,
      alignment: alignment.slice(0, 6),
    },
    worth: {
      summary: "The value, in your terms — not SAP features, and not a number we made up.",
      valueDrivers: valueDrivers(pack),
      peerOutcome: `${pack.peers.summary}: ${pack.peers.outcomes.join("; ")}. (Illustrative — real attributed references available on request.)`,
      roiPointer: "We deliberately don't invent a savings figure. Your real number deserves SAP's own modelling — use SAP's official ROI calculator.",
    },
    costAndHard: {
      summary: "The honest costs and the parts that are genuinely hard — the section a skeptical CFO checks first.",
      items: costItems(pack),
    },
    derisking: {
      summary: "What could go wrong, and how it's managed — turning the loudest fear into a plan.",
      scenario: drisk.scenario,
      mitigations: drisk.mitigations,
    },
    whyNow: {
      summary: "Why now — grounded in your clock and your competitive context, not a generic countdown.",
      points: [
        pack.clock.headline,
        ...(pack.clock.onEcc ? ["Every month on ECC is a month without the AI competitors may already be deploying."] : []),
        pack.recommendation.aiUnlocked,
      ],
    },
    path: {
      recommended: pack.recommendation.path,
      label: pack.recommendation.pathLabel,
      confident: pack.recommendation.confident,
      reasoning: pack.recommendation.rationale,
      sovereignty: pack.recommendation.sovereignty,
    },
    nextStep: {
      summary: "The next step isn't “buy the cloud.” It's a free EvoKit session — a low-commitment, honest readiness check.",
      whatYouGet: [
        "A real SAP Readiness Check against your actual system",
        "A roadmap grounded in your estate, not a template",
        "An honest assessment of effort, cost and risk",
        "No commitment — you walk away with the analysis either way",
      ],
    },
  };
}
