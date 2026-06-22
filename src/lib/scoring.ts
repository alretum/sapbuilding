import { prisma } from "./prisma";
import { getContent, maxPointsForRole } from "./content";
import { MAX_LEVEL, type DepartmentSnapshot, type SessionSnapshot } from "./snapshot-types";

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
  const content = getContent();

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { players: true, completions: true },
  });
  if (!session) return null;

  const involved = session.involvedRoles.length ? session.involvedRoles : content.roles.map((r) => r.id);

  const departments: DepartmentSnapshot[] = involved.map((roleId) => {
    const role = content.roles.find((r) => r.id === roleId);
    const max = maxPointsForRole(content, roleId);
    const comps = session.completions.filter((c) => c.roleId === roleId);
    const earned = comps.reduce((sum, c) => sum + c.score, 0);
    const readiness = max > 0 ? Math.min(1, earned / max) : 0;

    return {
      roleId,
      name: role?.name ?? roleId,
      color: role?.color ?? "#888888",
      avatar: role?.avatar ?? "⭐",
      earned,
      max,
      readiness,
      participated: comps.length > 0,
      playerCount: session.players.filter((p) => p.roleId === roleId).length,
      level: Math.floor(readiness * MAX_LEVEL),
    };
  });

  const meanReadiness =
    departments.length > 0 ? departments.reduce((sum, d) => sum + d.readiness, 0) / departments.length : 0;

  let companyReadiness = meanReadiness;
  if (session.strictGate && departments.length > 0) {
    const participatedShare = departments.filter((d) => d.participated).length / departments.length;
    companyReadiness = meanReadiness * participatedShare;
  }

  return {
    sessionId: session.id,
    code: session.code,
    name: session.name,
    status: session.status,
    companyReadiness: Math.round(companyReadiness * 100),
    departments,
    totalPoints: departments.reduce((sum, d) => sum + d.earned, 0),
    involvedRoles: involved,
    updatedAt: new Date().toISOString(),
  };
}
