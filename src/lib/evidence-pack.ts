import { createHash } from "node:crypto";
import type { ActionCompletion } from "@prisma/client";
import type {
  ActionConfig,
  CalculatorPayload,
  Content,
  InputPayload,
  MatchPayload,
  MultiselectPayload,
  QuizPayload,
  SortPayload,
  SwipePayload,
} from "./content-schema";
import { buildSnapshot, type LoadedSession } from "./scoring";
import { maintenanceClock, type MaintenanceClock } from "./maintenance";
import { recommend, type Recommendation } from "./recommendation";
import { peersFor, type PeerProof } from "./peers";
import type { CompanyProfile } from "./profile";

// ---------------------------------------------------------------------------
// The evidence pack: a decoded, *aggregated*, de-identified view of everything
// the game captured — the grounded input for the brief (deterministic baseline
// or AI synthesis). Two kinds of signal matter most:
//   (a) frequency distributions for every closed-form action (quiz/swipe/sort/
//       match/multiselect) — with a consensus flag (aligned vs split);
//   (b) open-ended, no-right/wrong *status* answers (calculator ranges, the
//       real-time chatbot, free-text) — flagged `statusSignal` and surfaced first.
// No PII: player names are never included; everything is aggregated per dept.
// ---------------------------------------------------------------------------

export interface OptionCount {
  option: string;
  count: number;
}

export interface DistItem {
  label: string; // the question / card / item being answered
  distribution: OptionCount[]; // per-option counts, sorted desc
  modal: string; // the most common answer
  consensus: "aligned" | "split"; // split = no clear majority (an alignment signal)
  expected: string | null; // the correct/expected answer, where one exists
}

export interface NumericMetric {
  label: string;
  values: number[];
  min: number;
  median: number;
  max: number;
  unit?: string;
  respondents: number;
}

interface BaseEvidence {
  actionId: string;
  title: string;
  theme?: string;
  respondents: number;
  statusSignal?: boolean;
  note?: string;
}

export interface DistributionEvidence extends BaseEvidence {
  kind: "distribution";
  prompt?: string;
  items: DistItem[];
}

export interface NumericEvidence extends BaseEvidence {
  kind: "numeric";
  metrics: NumericMetric[];
}

export interface FreeTextEvidence extends BaseEvidence {
  kind: "freetext";
  prompt: string;
  responses: string[]; // verbatim, de-identified
}

export interface NoteEvidence extends BaseEvidence {
  kind: "note";
  text: string;
}

export type ActionEvidence = DistributionEvidence | NumericEvidence | FreeTextEvidence | NoteEvidence;

export interface DeptEvidence {
  roleId: string;
  name: string;
  department: string;
  color: string;
  players: number;
  readiness: number; // 0..100
  participated: boolean;
  signals: ActionEvidence[];
}

export interface Coverage {
  involvedRoles: string[];
  playedRoles: string[];
  missingRoles: string[];
  participants: number;
  overallCompletion: number; // 0..1
}

export interface EvidencePack {
  company: { name: string } & CompanyProfile;
  clock: MaintenanceClock;
  recommendation: Recommendation;
  peers: PeerProof;
  coverage: Coverage;
  knowledgeGaps: string[]; // explicit "we don't fully know yet" signals (for §1)
  departments: DeptEvidence[];
  generatedAt: string;
}

// Theme tags route signals to the section(s) they serve. Optional — defaults to none.
const THEMES: Record<string, string> = {
  "it-reality-check": "status: custom-code landscape",
  "finance-roi-builder": "status: finance baseline (value drivers)",
  "prod-realtime": "status: where live data is needed",
  "prod-bottleneck": "status: production bottlenecks felt today",
  "prod-downtime": "risk: downtime tolerance / business continuity",
  "captain-risk": "risk priorities (leadership)",
  "finance-first-closing": "risk: first month-end close",
  "it-risk-radar": "risk: integrations / interfaces",
  "prod-pp-risk-radar": "risk: production migration",
  "hr-resistance-ranking": "people: causes of resistance",
  "captain-vision": "leadership: cloud ambition / drivers",
  "captain-decision": "leadership: decision-gate evidence",
  "captain-benefit": "leadership: fears → arguments",
  "finance-pain-benefit": "finance: pains → cloud benefits",
  "finance-shield": "risk mitigation: finance",
  "hr-starter-pack": "risk mitigation: change management",
  "hr-training-match": "people: training plan",
  "captain-open-status": "status: in their own words",
  "finance-open-status": "status: in their own words",
  "it-open-status": "status: in their own words",
  "production-open-status": "status: in their own words",
  "hr-open-status": "status: in their own words",
};

// Actions whose *answer is a status fact* (where the company stands), even when scored.
const STATUS_ACTIONS = new Set([
  "finance-roi-builder",
  "prod-realtime",
  "prod-bottleneck",
  "it-reality-check",
  "captain-open-status",
  "finance-open-status",
  "it-open-status",
  "production-open-status",
  "hr-open-status",
]);

const GAP_RE = /unknown|no clear overview|no overview|not sure|don'?t know/i;

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function distribution(counts: Map<string, number>): OptionCount[] {
  return [...counts.entries()].map(([option, count]) => ({ option, count })).sort((a, b) => b.count - a.count);
}

function consensusOf(top: number, respondents: number): "aligned" | "split" {
  if (respondents <= 1) return "aligned";
  return top / respondents > 0.5 ? "aligned" : "split";
}

function payloadOf(c: ActionCompletion): Record<string, unknown> {
  return (c.payload ?? {}) as Record<string, unknown>;
}

export function buildEvidencePack(session: LoadedSession, content: Content): EvidencePack {
  const snap = buildSnapshot(session, content);
  const profile: CompanyProfile = {
    industry: session.industry,
    country: session.country,
    sapVersion: session.sapVersion,
    companySize: session.companySize,
    dataSensitivity: session.dataSensitivity,
  };

  const knowledgeGaps: string[] = [];
  const departments: DeptEvidence[] = snap.departments.map((d) => {
    const byAction = new Map<string, ActionCompletion[]>();
    for (const c of session.completions.filter((c) => c.roleId === d.roleId)) {
      const arr = byAction.get(c.actionId) ?? [];
      arr.push(c);
      byAction.set(c.actionId, arr);
    }
    const signals: ActionEvidence[] = [];
    for (const [actionId, comps] of byAction) {
      const action = content.actions.find((a) => a.id === actionId);
      if (!action) continue;
      const ev = decode(action, comps, d.name, knowledgeGaps);
      if (ev) signals.push(ev);
    }
    // Surface status signals first — they describe where the company actually stands.
    signals.sort((a, b) => Number(Boolean(b.statusSignal)) - Number(Boolean(a.statusSignal)));
    return {
      roleId: d.roleId,
      name: d.name,
      department: d.department,
      color: d.color,
      players: d.playerCount,
      readiness: Math.round(d.readiness * 100),
      participated: d.participated,
      signals,
    };
  });

  const coverage: Coverage = {
    involvedRoles: snap.departments.map((d) => d.name),
    playedRoles: snap.departments.filter((d) => d.participated).map((d) => d.name),
    missingRoles: snap.departments.filter((d) => !d.participated).map((d) => d.name),
    participants: snap.leaderboard.length,
    overallCompletion: snap.companyReadiness / 100,
  };

  return {
    company: { name: session.name, ...profile },
    clock: maintenanceClock(profile.sapVersion),
    recommendation: recommend(profile),
    peers: peersFor(profile.industry),
    coverage,
    knowledgeGaps: Array.from(new Set(knowledgeGaps)),
    departments,
    generatedAt: new Date().toISOString(),
  };
}

// Stable hash of the meaningful content (excludes the timestamp) — the cache key.
export function evidenceHash(pack: EvidencePack): string {
  const stable = { ...pack, generatedAt: undefined };
  return createHash("sha256").update(JSON.stringify(stable)).digest("hex").slice(0, 16);
}

function decode(
  action: ActionConfig,
  comps: ActionCompletion[],
  deptName: string,
  knowledgeGaps: string[],
): ActionEvidence | null {
  const base = { actionId: action.id, title: action.title, theme: THEMES[action.id], respondents: comps.length };
  const isStatus = STATUS_ACTIONS.has(action.id);

  switch (action.type) {
    case "quiz": {
      const pl = action.payload as QuizPayload;
      const items: DistItem[] = [];
      for (const q of pl.questions) {
        const counts = new Map<string, number>();
        let answered = 0;
        const correctOpt = q.options.find((o) => o.correct === true);
        for (const c of comps) {
          const ans = (payloadOf(c).answers ?? {}) as Record<string, string>;
          const opt = q.options.find((o) => o.id === ans[q.id]);
          if (!opt) continue;
          answered++;
          counts.set(opt.label, (counts.get(opt.label) ?? 0) + 1);
          if (GAP_RE.test(opt.label)) knowledgeGaps.push(`${deptName}: “${opt.label}” — ${q.prompt}`);
        }
        if (answered === 0) continue;
        const dist = distribution(counts);
        items.push({
          label: q.prompt,
          distribution: dist,
          modal: dist[0].option,
          consensus: consensusOf(dist[0].count, answered),
          expected: correctOpt ? correctOpt.label : null,
        });
      }
      if (items.length === 0) return null;
      const hasKnowledge = pl.questions.some((q) => q.options.some((o) => o.correct !== undefined));
      return { kind: "distribution", ...base, prompt: action.subtitle, items, statusSignal: isStatus || !hasKnowledge };
    }

    case "swipe": {
      const pl = action.payload as SwipePayload;
      const items: DistItem[] = [];
      let anyCorrect = false;
      for (const card of pl.cards) {
        const correctSide = (card as { correctSide?: "left" | "right" }).correctSide;
        if (correctSide) anyCorrect = true;
        const counts = new Map<string, number>();
        let answered = 0;
        for (const c of comps) {
          const choices = (payloadOf(c).choices ?? {}) as Record<string, "left" | "right">;
          const side = choices[card.id];
          if (!side) continue;
          answered++;
          const label = side === "right" ? pl.rightLabel : pl.leftLabel;
          counts.set(label, (counts.get(label) ?? 0) + 1);
        }
        if (answered === 0) continue;
        const dist = distribution(counts);
        items.push({
          label: card.label,
          distribution: dist,
          modal: dist[0].option,
          consensus: consensusOf(dist[0].count, answered),
          expected: correctSide ? (correctSide === "right" ? pl.rightLabel : pl.leftLabel) : null,
        });
      }
      if (items.length === 0) return null;
      return { kind: "distribution", ...base, prompt: pl.prompt, items, statusSignal: isStatus || !anyCorrect };
    }

    case "sort": {
      const pl = action.payload as SortPayload;
      const labelById = new Map(pl.items.map((i) => [i.id, i.label]));
      const rankSum = new Map<string, number>();
      const rankCount = new Map<string, number>();
      const topCounts = new Map<string, number>();
      let answered = 0;
      for (const c of comps) {
        const ordered = (payloadOf(c).items ?? []) as { id: string; label?: string }[];
        if (!Array.isArray(ordered) || ordered.length === 0) continue;
        answered++;
        ordered.forEach((it, idx) => {
          const label = labelById.get(it.id) ?? it.label ?? it.id;
          rankSum.set(label, (rankSum.get(label) ?? 0) + (idx + 1));
          rankCount.set(label, (rankCount.get(label) ?? 0) + 1);
        });
        const top = ordered[0];
        const topLabel = labelById.get(top.id) ?? top.label ?? top.id;
        topCounts.set(topLabel, (topCounts.get(topLabel) ?? 0) + 1);
      }
      if (answered === 0) return null;
      const topDist = distribution(topCounts);
      const order = [...rankCount.keys()]
        .map((label) => ({ label, mean: (rankSum.get(label) ?? 0) / (rankCount.get(label) ?? 1) }))
        .sort((a, b) => a.mean - b.mean)
        .map((x) => x.label);
      const correctOrder = (pl as { correctOrder?: string[] }).correctOrder;
      const expectedTop = correctOrder && correctOrder.length ? labelById.get(correctOrder[0]) ?? null : null;
      return {
        kind: "distribution",
        ...base,
        prompt: `${action.title}: what the team ranked most critical`,
        note: `Team's aggregate priority (most → least): ${order.join(" › ")}`,
        items: [
          {
            label: "Ranked most critical",
            distribution: topDist,
            modal: topDist[0].option,
            consensus: consensusOf(topDist[0].count, answered),
            expected: expectedTop,
          },
        ],
        statusSignal: isStatus,
      };
    }

    case "match": {
      const pl = action.payload as MatchPayload;
      const itemLabel = new Map(pl.items.map((i) => [i.id, i.label]));
      const targetLabel = new Map(pl.targets.map((t) => [t.id, t.label]));
      const correct = (pl.correctMatches ?? {}) as Record<string, string | string[]>;
      const items: DistItem[] = [];
      for (const item of pl.items) {
        const counts = new Map<string, number>();
        let answered = 0;
        for (const c of comps) {
          const matches = (payloadOf(c).matches ?? {}) as Record<string, string>;
          const tgt = matches[item.id];
          if (!tgt) continue;
          answered++;
          const tl = targetLabel.get(tgt) ?? tgt;
          counts.set(tl, (counts.get(tl) ?? 0) + 1);
        }
        if (answered === 0) continue;
        const dist = distribution(counts);
        const corr = correct[item.id];
        const expected = corr
          ? (Array.isArray(corr) ? corr : [corr]).map((t) => targetLabel.get(t) ?? t).join(" / ")
          : null;
        items.push({
          label: itemLabel.get(item.id) ?? item.id,
          distribution: dist,
          modal: dist[0].option,
          consensus: consensusOf(dist[0].count, answered),
          expected,
        });
      }
      if (items.length === 0) return null;
      return { kind: "distribution", ...base, prompt: pl.prompt, items, statusSignal: isStatus };
    }

    case "multiselect": {
      const pl = action.payload as MultiselectPayload;
      const optLabel = new Map(pl.options.map((o) => [o.id, o.label]));
      const n = comps.length;
      const sel = new Map<string, number>();
      for (const c of comps) {
        const arr = (payloadOf(c).selected ?? []) as string[];
        for (const id of arr) sel.set(id, (sel.get(id) ?? 0) + 1);
      }
      const items: DistItem[] = [...sel.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id, count]) => {
          const opt = pl.options.find((o) => o.id === id);
          return {
            label: optLabel.get(id) ?? id,
            distribution: [
              { option: "chose", count },
              { option: "did not", count: n - count },
            ],
            modal: count > n - count ? "chose" : "did not",
            consensus: consensusOf(count, n),
            expected: opt?.correct === true ? "chose" : opt?.correct === false ? "did not" : null,
          };
        });
      if (items.length === 0) return null;
      const missed = pl.options.filter((o) => o.correct === true && (sel.get(o.id) ?? 0) === 0).map((o) => o.label);
      return {
        kind: "distribution",
        ...base,
        prompt: pl.prompt,
        note: missed.length ? `Recommended actions no one selected: ${missed.join("; ")}` : undefined,
        items,
        statusSignal: isStatus,
      };
    }

    case "calculator": {
      const pl = action.payload as CalculatorPayload;
      const metrics: NumericMetric[] = pl.fields
        .map((f) => {
          const values: number[] = [];
          for (const c of comps) {
            const v = (payloadOf(c).values ?? {}) as Record<string, number>;
            if (typeof v[f.id] === "number" && !Number.isNaN(v[f.id])) values.push(v[f.id]);
          }
          return {
            label: f.label,
            values,
            min: values.length ? Math.min(...values) : 0,
            median: median(values),
            max: values.length ? Math.max(...values) : 0,
            respondents: values.length,
          };
        })
        .filter((m) => m.values.length > 0);
      if (metrics.length === 0) return null;
      return {
        kind: "numeric",
        ...base,
        metrics,
        note: "Value drivers in the company's own terms — do NOT compute a savings figure; route to SAP's ROI calculator.",
        statusSignal: true,
      };
    }

    case "input": {
      const pl = action.payload as InputPayload;
      if (pl.inputType === "text") {
        const responses: string[] = [];
        for (const c of comps) {
          const v = payloadOf(c).value;
          if (typeof v === "string" && v.trim()) responses.push(v.trim());
        }
        if (responses.length === 0) return null;
        return { kind: "freetext", ...base, prompt: pl.prompt, responses, statusSignal: true };
      }
      const values: number[] = [];
      for (const c of comps) {
        const v = payloadOf(c).value;
        if (typeof v === "number" && !Number.isNaN(v)) values.push(v);
      }
      if (values.length === 0) return null;
      return {
        kind: "numeric",
        ...base,
        metrics: [
          {
            label: pl.prompt,
            values,
            min: Math.min(...values),
            median: median(values),
            max: Math.max(...values),
            unit: pl.unit ?? undefined,
            respondents: values.length,
          },
        ],
        statusSignal: true,
      };
    }

    case "chatbot": {
      const firstCounts = new Map<string, number>();
      const estimateCounts = new Map<string, number>();
      let answered = 0;
      for (const c of comps) {
        const answers = (payloadOf(c).answers ?? []) as string[];
        if (!Array.isArray(answers) || answers.length === 0) continue;
        answered++;
        firstCounts.set(answers[0], (firstCounts.get(answers[0]) ?? 0) + 1);
        if (answers[1]) estimateCounts.set(answers[1], (estimateCounts.get(answers[1]) ?? 0) + 1);
      }
      if (answered === 0) return null;
      const firstDist = distribution(firstCounts);
      const items: DistItem[] = [
        {
          label: "Where live data is needed most",
          distribution: firstDist,
          modal: firstDist[0].option,
          consensus: consensusOf(firstDist[0].count, answered),
          expected: null,
        },
      ];
      if (estimateCounts.size > 0) {
        const estDist = distribution(estimateCounts);
        items.push({
          label: "Their own estimate of the impact",
          distribution: estDist,
          modal: estDist[0].option,
          consensus: consensusOf(estDist[0].count, answered),
          expected: null,
        });
      }
      return { kind: "distribution", ...base, prompt: action.subtitle, items, statusSignal: true };
    }

    case "dashboard-booster": {
      const boosted = comps.some((c) => Boolean(payloadOf(c).boosted));
      if (!boosted) return null;
      return {
        kind: "note",
        ...base,
        text: "The Captain reviewed every department and sent a booster to a lagging team.",
        statusSignal: false,
      };
    }

    default:
      return null;
  }
}
