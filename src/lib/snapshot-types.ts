// Shared shape of a live session snapshot. Kept in its own pure module so both
// the server (scoring.ts) and client components can import it without pulling
// in server-only dependencies (prisma, fs).

export interface DepartmentSnapshot {
  roleId: string;
  name: string;
  color: string;
  avatar: string;
  earned: number;
  max: number;
  readiness: number; // 0..1
  participated: boolean;
  playerCount: number;
  level: number; // 0..MAX_LEVEL
}

export interface PlayerScore {
  playerId: string;
  name: string;
  roleId: string;
  roleName: string;
  color: string;
  points: number;
  avatar: string | null; // JSON AvatarConfig, or null
}

export interface SessionSnapshot {
  sessionId: string;
  code: string;
  name: string;
  status: string;
  companyReadiness: number; // 0..100 — arithmetic mean of department readiness
  departments: DepartmentSnapshot[];
  leaderboard: PlayerScore[]; // every employee, ranked by points within the company
  totalPoints: number;
  involvedRoles: string[];
  updatedAt: string;
  financeROI: number | null;
  boosterSent: boolean;
}

export const MAX_LEVEL = 5;
