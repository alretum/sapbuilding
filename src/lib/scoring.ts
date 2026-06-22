import type { ActionCompletion, Player, Session } from "@prisma/client";
import { prisma } from "./prisma";
import { getContent, maxPointsForRole } from "./content";
import type { Content } from "./content-schema";
import { MAX_LEVEL, type DepartmentSnapshot, type PlayerScore, type SessionSnapshot } from "./snapshot-types";

export type LoadedSession = Session & { players: Player[]; completions: ActionCompletion[] };

// ---------------------------------------------------------------------------
// Scoring — the coverage model.
//
//   department readiness  R_d = earned / max            (0..1)
//   company readiness     = arithmetic mean of R_d over the involved depts
//
// Because a non-participating department contributes R_d = 0, the mean is
// naturally dragged down until *every* involved department joins in — that is
// the whole "we're only ready when everyone's ready" message, for free.
//
// strictGate (optional, off by default) makes that explicit/harsher by also
// scaling the mean by the share of departments that have started at all.
// ---------------------------------------------------------------------------

export async function computeSessionSnapshot(sessionId: string): Promise<SessionSnapshot | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { players: true, completions: true },
  });
  if (!session) return null;
  return buildSnapshot(session, getContent());
}

// Pure snapshot builder from an already-loaded session — so callers that fetch
// many sessions at once (e.g. the company leaderboard) avoid N round-trips.
export function buildSnapshot(session: LoadedSession, content: Content): SessionSnapshot {
  const involved = session.involvedRoles.length ? session.involvedRoles : content.roles.map((r) => r.id);

  const departments: DepartmentSnapshot[] = involved.map((roleId) => {
    const role = content.roles.find((r) => r.id === roleId);
    const maxPerPlayer = maxPointsForRole(content, roleId);
    const players = session.players.filter((p) => p.roleId === roleId);
    const comps = session.completions.filter((c) => c.roleId === roleId);
    const earned = comps.reduce((sum, c) => sum + c.score, 0);

    // Per-member participation: each member is expected to complete ALL of their
    // department's actions. Department readiness = average of per-member readiness,
    // so full readiness is only reached when everyone finishes everything.
    const perPlayerReadiness = players.map((p) => {
      const e = comps.filter((c) => c.playerId === p.id).reduce((s, c) => s + c.score, 0);
      return maxPerPlayer > 0 ? Math.min(1, e / maxPerPlayer) : 0;
    });
    const readiness =
      perPlayerReadiness.length > 0
        ? perPlayerReadiness.reduce((s, r) => s + r, 0) / perPlayerReadiness.length
        : 0;

    return {
      roleId,
      name: role?.name ?? roleId,
      color: role?.color ?? "#888888",
      avatar: role?.avatar ?? "⭐",
      earned,
      max: maxPerPlayer * players.length,
      readiness,
      participated: comps.length > 0,
      playerCount: players.length,
      level: Math.floor(readiness * MAX_LEVEL),
    };
  });

  // Internal leaderboard: every employee ranked by their own points company-wide.
  const pointsByPlayer = new Map<string, number>();
  for (const c of session.completions) {
    pointsByPlayer.set(c.playerId, (pointsByPlayer.get(c.playerId) ?? 0) + c.score);
  }
  const leaderboard: PlayerScore[] = session.players
    .map((p) => {
      const role = content.roles.find((r) => r.id === p.roleId);
      return {
        playerId: p.id,
        name: p.name,
        roleId: p.roleId,
        roleName: role?.name ?? p.roleId,
        color: role?.color ?? "#888888",
        points: pointsByPlayer.get(p.id) ?? 0,
        avatar: p.avatar ?? null,
      };
    })
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  const meanReadiness =
    departments.length > 0 ? departments.reduce((sum, d) => sum + d.readiness, 0) / departments.length : 0;

  let companyReadiness = meanReadiness;
  if (session.strictGate && departments.length > 0) {
    const participatedShare = departments.filter((d) => d.participated).length / departments.length;
    companyReadiness = meanReadiness * participatedShare;
  }

  const boosterSent = session.completions.some(c => c.actionId === "captain-booster");

  const roiComps = session.completions.filter(c => c.actionId === "finance-roi-builder" && c.payload);
  let financeROI: number | null = null;
  if (roiComps.length > 0) {
    let totalSavings = 0;
    for (const c of roiComps) {
       const v = (c.payload as any)?.values || {};
       const users = v.users || 100;
       const maint = v.maint || 10000;
       totalSavings += (users * 500) + (maint * 0.2);
    }
    financeROI = Math.round(totalSavings / roiComps.length);
  }

  const financeBadges: string[] = [];
  const financeMissingBadges: string[] = [];

  const checkBadge = (actionId: string, badgeName: string, requiresPerfect = true) => {
    const comp = session.completions.find(c => c.actionId === actionId);
    if (!comp) return; 
    
    const actionDef = content.actions.find(a => a.id === actionId);
    if (actionDef) {
       const isPerfect = comp.score >= actionDef.points; 
       if (requiresPerfect) {
         if (isPerfect) financeBadges.push(badgeName);
         else financeMissingBadges.push(badgeName);
       } else {
         financeBadges.push(badgeName);
       }
    }
  };

  checkBadge("finance-report-rescue", "Report Rescuer");
  checkBadge("finance-myth-fact", "Myth Breaker");
  checkBadge("finance-first-closing", "Close Controller");
  checkBadge("finance-pain-benefit", "Value Matcher");
  checkBadge("finance-shield", "Compliance Guardian");

  const roiComp = session.completions.find(c => c.actionId === "finance-roi-builder");
  if (roiComp) financeBadges.push("Business Case Builder");

  const captainBadges: string[] = [];
  const checkCaptainBadge = (actionId: string, badgeName: string) => {
    const comp = session.completions.find(c => c.actionId === actionId);
    if (!comp) return; 
    const actionDef = content.actions.find(a => a.id === actionId);
    if (actionDef && comp.score >= actionDef.points) {
       captainBadges.push(badgeName);
    }
  };

  checkCaptainBadge("captain-vision", "Vision Setter");
  checkCaptainBadge("captain-decision", "Decision Captain");
  checkCaptainBadge("captain-risk", "Risk Prioritizer");
  checkCaptainBadge("captain-benefit", "Benefit Builder");
  checkCaptainBadge("captain-booster", "Team Booster");

  const itBadges: string[] = [];
  const checkItBadge = (actionId: string, badgeName: string) => {
    const comp = session.completions.find(c => c.actionId === actionId);
    if (!comp) return; 
    const actionDef = content.actions.find(a => a.id === actionId);
    if (actionDef && comp.score >= actionDef.points) {
       itBadges.push(badgeName);
    }
  };

  checkItBadge("it-reality-check", "Custom Code Scanner");
  checkItBadge("it-cloud-fit", "Cloud Fit Architect");
  checkItBadge("it-risk-radar", "Interface Radar Expert");
  checkItBadge("it-decision-gate", "Clean-Core Decision Maker");
  checkItBadge("it-ops-check", "Cloud Ops Guardian");

  const hrBadges: string[] = [];
  const checkHrBadge = (actionId: string, badgeName: string) => {
    const comp = session.completions.find(c => c.actionId === actionId);
    if (!comp) return; 
    const actionDef = content.actions.find(a => a.id === actionId);
    if (actionDef && comp.score >= actionDef.points) {
       hrBadges.push(badgeName);
    }
  };

  checkHrBadge("hr-change-booster", "Change Spotter");
  checkHrBadge("hr-training-match", "Training Designer");
  checkHrBadge("hr-resistance-ranking", "Resistance Reader");
  checkHrBadge("hr-starter-pack", "Change Champion");
  checkHrBadge("hr-communication-check", "Trust Builder");

  let financeFeedback: string | null = null;
  const financeRole = departments.find(d => d.roleId === "finance");
  if (financeRole && financeRole.participated) {
    if (financeBadges.includes("Compliance Guardian")) {
      financeFeedback = "Finance understands the main cloud benefits and recognizes the most critical closing and compliance risks. Well done!";
    } else if (financeMissingBadges.includes("Compliance Guardian")) {
      financeFeedback = "Finance understands the main cloud benefits and recognizes the most critical closing and compliance risks. The biggest next step is to validate critical reports and test the first month-end closing before go-live.";
    }
  }

  return {
    sessionId: session.id,
    code: session.code,
    name: session.name,
    status: session.status,
    companyReadiness: Math.round(companyReadiness * 100),
    departments,
    leaderboard,
    totalPoints: departments.reduce((sum, d) => sum + d.earned, 0),
    involvedRoles: involved,
    updatedAt: new Date().toISOString(),
    financeROI,
    boosterSent,
    financeBadges,
    financeMissingBadges,
    financeFeedback,
    captainBadges,
    itBadges,
    hrBadges,
  };
}
