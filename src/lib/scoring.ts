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
  const validRoleIds = new Set(content.roles.map((r) => r.id));

  const involved = (session.involvedRoles.length ? session.involvedRoles : content.roles.map((r) => r.id))
    .filter((roleId) => validRoleIds.has(roleId));

  const players = session.players.filter((p) => validRoleIds.has(p.roleId));
  const completions = session.completions.filter((c) => validRoleIds.has(c.roleId));

  const departments: DepartmentSnapshot[] = involved.map((roleId) => {
    const role = content.roles.find((r) => r.id === roleId);
    const maxPerPlayer = maxPointsForRole(content, roleId);
    const dePlayers = players.filter((p) => p.roleId === roleId);
    const comps = completions.filter((c) => c.roleId === roleId);
    const earned = comps.reduce((sum, c) => sum + c.score, 0);

    // Per-member participation: each member is expected to complete ALL of their
    // department's actions. Department readiness = average of per-member readiness,
    // so full readiness is only reached when everyone finishes everything.
    const perPlayerReadiness = dePlayers.map((p) => {
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
      department: role?.department ?? "Unknown",
      color: role?.color ?? "#888888",
      avatar: role?.avatar ?? "⭐",
      earned,
      max: maxPerPlayer * dePlayers.length,
      readiness,
      participated: comps.length > 0,
      playerCount: dePlayers.length,
      level: Math.floor(readiness * MAX_LEVEL),
    };
  });

  // Internal leaderboard: every employee ranked by their own points company-wide.
  const pointsByPlayer = new Map<string, number>();
  for (const c of completions) {
    pointsByPlayer.set(c.playerId, (pointsByPlayer.get(c.playerId) ?? 0) + c.score);
  }
  const leaderboard: PlayerScore[] = players
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

  const boosterSent = completions.some(c => c.actionId === "captain-booster");

  const roiComps = completions.filter(c => c.actionId === "finance-roi-builder" && c.payload);
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
    const comp = completions.find(c => c.actionId === actionId);
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

  const roiComp = completions.find(c => c.actionId === "finance-roi-builder");
  if (roiComp) financeBadges.push("Business Case Builder");

  const captainBadges: string[] = [];
  const checkCaptainBadge = (actionId: string, badgeName: string) => {
    const comp = completions.find(c => c.actionId === actionId);
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
  const itMissingBadges: string[] = [];
  const checkItBadge = (actionId: string, badgeName: string) => {
    const comp = completions.find(c => c.actionId === actionId);
    const actionDef = content.actions.find(a => a.id === actionId);
    if (actionDef) {
       if (comp && comp.score >= actionDef.points) {
         itBadges.push(badgeName);
       } else {
         itMissingBadges.push(badgeName);
       }
    }
  };

  checkItBadge("it-reality-check", "Custom Code Scanner");
  checkItBadge("it-cloud-fit", "Cloud Fit Architect");
  checkItBadge("it-risk-radar", "Interface Radar Expert");
  checkItBadge("it-decision-gate", "Clean-Core Decision Maker");
  checkItBadge("it-ops-check", "Cloud Ops Guardian");

  const hrBadges: string[] = [];
  const checkHrBadge = (actionId: string, badgeName: string) => {
    const comp = completions.find(c => c.actionId === actionId);
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

  let captainFeedback: string | null = null;
  const captainRole = departments.find(d => d.roleId === "captain");
  if (captainRole && captainRole.participated) {
    const score = captainRole.earned;
    if (score <= 70) {
      captainFeedback = "Level: Unclear Direction - Cloud is still seen mainly as an IT project or deadline topic. Business value and risk ownership are unclear.";
    } else if (score <= 130) {
      captainFeedback = "Level: First Direction Set - Some business drivers are understood, but decision evidence and risk trade-offs need more clarity.";
    } else if (score <= 175) {
      captainFeedback = "Level: Decision Conversation Ready - Management can enter a structured migration discussion with clear expectations around value, risk, and department input.";
    } else {
      captainFeedback = "Level: Cloud Direction Leader - Management has strong strategic clarity, understands business-critical risks, and can motivate departments around a shared cloud direction.";
    }
  }

  let itFeedback: any = null;
  const itRole = departments.find(d => d.roleId === "it");
  if (itRole && itRole.participated) {
    const realityComp = completions.find(c => c.actionId === "it-reality-check");
    const cloudFitComp = completions.find(c => c.actionId === "it-cloud-fit");
    const riskRadarComp = completions.find(c => c.actionId === "it-risk-radar");
    const decisionGateComp = completions.find(c => c.actionId === "it-decision-gate");
    const opsCheckComp = completions.find(c => c.actionId === "it-ops-check");

    const realityScore = realityComp?.score ?? 0;
    const customCode = realityScore <= 20
      ? "Low. You have high technical debt and limited transparency over custom code usage."
      : realityScore <= 32
      ? "Medium. You have a basic view of custom developments, but usage transparency is incomplete."
      : "High. Excellent custom code transparency and cleanup processes are in place.";

    const decisionScore = decisionGateComp?.score ?? 0;
    const cleanCore = decisionScore <= 20
      ? "Low. Clean-core principles are not yet prioritized in extension and customization decisions."
      : decisionScore <= 32
      ? "Medium / High. You understand that not every Z-object should be migrated unchanged."
      : "High. Strong clean-core understanding and dedication to standardization.";

    const riskScore = riskRadarComp?.score ?? 0;
    const interfaces = riskScore <= 20
      ? "Low. Undocumented and database-level interfaces create high migration risk."
      : riskScore <= 32
      ? "Medium. Critical interfaces need clearer ownership, monitoring, and fallback planning."
      : "High. Robust interface catalog with clear technology and ownership.";

    const opsScore = opsCheckComp?.score ?? 0;
    const operations = opsScore <= 20
      ? "Low. Basic cutover, rollback, and test validation plans are missing."
      : opsScore <= 30
      ? "Medium. Testing, roles, security, cutover, and rollback need to be prepared before go-live."
      : "High. Operations are well-prepared with proper testing, rollbacks, and concepts.";

    itFeedback = {
      customCode,
      cleanCore,
      interfaces,
      operations,
      biggestRisk: "Custom code and undocumented interfaces.",
      strongestDriver: "Clean-core awareness and willingness to standardize.",
      recommendedNextStep: "Create a technical migration inventory covering: Z/Y custom objects, usage statistics, owners, interfaces, data volume, roles and authorizations, business-critical dependencies.",
      finalMessage: "You are not blocked for SAP Cloud, but your system needs a clean-core and interface readiness check before a safe migration decision."
    };
  }

  const productionBadges: string[] = [];
  const productionMissingBadges: string[] = [];
  const checkProductionBadge = (actionId: string, badgeName: string) => {
    const comp = completions.find(c => c.actionId === actionId);
    const actionDef = content.actions.find(a => a.id === actionId);
    if (actionDef) {
       if (comp && comp.score >= actionDef.points) {
         productionBadges.push(badgeName);
       } else {
         productionMissingBadges.push(badgeName);
       }
    }
  };

  checkProductionBadge("prod-bottleneck", "Bottleneck Buster");
  checkProductionBadge("prod-downtime", "Downtime Minimizer");
  checkProductionBadge("prod-realtime", "Live Data Spotter");
  checkProductionBadge("prod-pp-risk-radar", "PP Risk Radar Expert");
  checkProductionBadge("prod-minigame", "Flow Architect");

  let productionFeedback: any = null;
  const productionRole = departments.find(d => d.roleId === "production");
  if (productionRole && productionRole.participated) {
    const realtimeComp = completions.find(c => c.actionId === "prod-realtime");
    let unplannedDowntime = "Not analyzed yet.";
    let scrapRate = "Not analyzed yet.";
    let planAlignment = "Not analyzed yet.";
    let biggestRisk = "Lack of shopfloor transparency.";
    let strongestDriver = "Willingness to digitize production data.";
    let recommendedNextStep = "Implement digital confirmations and real-time shopfloor feedback.";
    let finalMessage = "Production is ready to support standard SAP PP integrations once basic data accuracy is solved.";

    if (realtimeComp && realtimeComp.payload) {
      const answers = (realtimeComp.payload as any).answers || [];
      const selectedArea = answers[0] || "";
      const selectedValue = answers[1] || "";

      if (selectedArea === "Unplanned Downtime") {
        unplannedDowntime = `Estimated downtime per week: ${selectedValue}.`;
        biggestRisk = "High machine downtime causes bottleneck issues.";
        recommendedNextStep = "Implement SAP PM (Plant Maintenance) and real-time status monitoring.";
        finalMessage = "Unplanned downtime is dragging OEE down; resolving it via SAP PM is a high value priority.";
      } else if (selectedArea === "Quality Defects") {
        scrapRate = `Estimated scrap/rework rate: ${selectedValue}.`;
        biggestRisk = "High scrap rates drag production cost up.";
        recommendedNextStep = "Activate SAP QM (Quality Management) in-process inspections.";
        finalMessage = "High scrap rate detected. Activating standard SAP QM will increase traceability.";
      } else if (selectedArea === "Order Progress") {
        planAlignment = `Production plan misalignment frequency: ${selectedValue}.`;
        biggestRisk = "Shopfloor plan is out of sync with actual status.";
        recommendedNextStep = "Deploy Fiori confirmations or digital shopfloor terminals.";
        finalMessage = "Misaligned plans create scheduling noise; real-time order confirmations will resolve this.";
      } else if (selectedArea === "Material Availability") {
        biggestRisk = "Material availability checks are not real-time, halting production.";
        recommendedNextStep = "Integrate PP/MM for real-time stock status and automated material staging.";
        finalMessage = "Real-time material tracking will prevent line stops and reduce warehouse buffers.";
      }
    }

    productionFeedback = {
      unplannedDowntime,
      scrapRate,
      planAlignment,
      biggestRisk,
      strongestDriver,
      recommendedNextStep,
      finalMessage,
    };
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
    captainFeedback,
    captainBadges,
    itBadges,
    itMissingBadges,
    itFeedback,
    hrBadges,
    productionBadges,
    productionMissingBadges,
    productionFeedback,
  };
}
