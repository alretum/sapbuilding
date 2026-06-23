import type {
  ActionConfig,
  CalculatorPayload,
  ChatbotPayload,
  Content,
  InputPayload,
  QuizPayload,
  SwipePayload,
} from "./content-schema";
import { buildSnapshot, type LoadedSession } from "./scoring";
import { recommend, type Recommendation } from "./recommendation";
import type { CompanyProfile } from "./profile";

// The challenge brief: turns everything the game already captured into a one-page
// summary the company (and whoever they take it to) can pick up from — so any
// follow-up starts on value, not orientation.

export interface BriefDept {
  name: string;
  avatar: string;
  color: string;
  players: number;
  readiness: number;
  signals: string[]; // human-readable highlights of what the team flagged/said
}

export interface Brief {
  company: { name: string } & CompanyProfile;
  preparationScore: number;
  participants: number;
  departments: BriefDept[];
  recommendation: Recommendation;
  generatedAt: string;
}

export function buildBrief(session: LoadedSession, content: Content): Brief {
  const snap = buildSnapshot(session, content);
  const profile: CompanyProfile = {
    industry: session.industry,
    country: session.country,
    sapVersion: session.sapVersion,
    companySize: session.companySize,
    dataSensitivity: session.dataSensitivity,
  };

  const departments: BriefDept[] = snap.departments
    .filter((d) => d.playerCount > 0)
    .map((d) => {
      const signals: string[] = [];
      for (const c of session.completions.filter((c) => c.roleId === d.roleId)) {
        const action = content.actions.find((a) => a.id === c.actionId);
        if (!action) continue;
        const s = summarize(action, c.payload);
        if (s) signals.push(s);
      }
      return {
        name: d.name,
        avatar: d.avatar,
        color: d.color,
        players: d.playerCount,
        readiness: Math.round(d.readiness * 100),
        signals: Array.from(new Set(signals)),
      };
    });

  return {
    company: { name: session.name, ...profile },
    preparationScore: snap.companyReadiness,
    participants: snap.leaderboard.length,
    departments,
    recommendation: recommend(profile),
    generatedAt: new Date().toISOString(),
  };
}

function summarize(action: ActionConfig, payload: unknown): string | null {
  const p = (payload ?? {}) as Record<string, unknown>;
  switch (action.type) {
    case "swipe": {
      const pl = action.payload as SwipePayload;
      const choices = (p.choices ?? {}) as Record<string, string>;
      const flagged = pl.cards.filter((c) => choices[c.id] === "right").map((c) => c.label);
      return flagged.length ? `${action.title} — ${pl.rightLabel}: ${flagged.join(", ")}` : null;
    }
    case "quiz": {
      const pl = action.payload as QuizPayload;
      const answers = (p.answers ?? {}) as Record<string, string>;
      const picks = pl.questions
        .map((q) => {
          const opt = q.options.find((o) => o.id === answers[q.id]);
          return opt ? `${q.prompt} → ${opt.label}` : null;
        })
        .filter(Boolean);
      return picks.length ? `${action.title}: ${picks.join(" · ")}` : null;
    }
    case "chatbot": {
      const pl = action.payload as ChatbotPayload;
      const path = (p.path ?? []) as string[];
      const labels: string[] = [];
      for (let i = 0; i < path.length - 1; i++) {
        const opt = pl.nodes[path[i]]?.options?.find((o) => o.next === path[i + 1]);
        if (opt) labels.push(opt.label);
      }
      return labels.length ? `${action.title}: “${labels[labels.length - 1]}”` : null;
    }
    case "input": {
      const pl = action.payload as InputPayload;
      if (p.value === undefined || p.value === null) return null;
      return `${action.title}: ${p.value}${pl.unit ? " " + pl.unit : ""}`;
    }
    case "calculator": {
      const pl = action.payload as CalculatorPayload;
      const values = (p.values ?? {}) as Record<string, number>;
      const parts = pl.fields
        .filter((f) => values[f.id] !== undefined)
        .map((f) => `${f.label}: ${values[f.id]}`);
      return parts.length ? `${action.title} — ${parts.join(" · ")}` : null;
    }
    case "dashboard-booster":
      return p.boosted ? "Captain reviewed every department and sent a booster to a lagging team." : null;
    default:
      return null;
  }
}
