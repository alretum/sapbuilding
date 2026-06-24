import type { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma";
import { computeSessionSnapshot } from "../lib/scoring";
import { getContent } from "../lib/content";
import { ensureBriefForCompletedSession } from "../lib/brief-store";

// Socket.IO event handlers. This is the realtime backbone:
//   - clients subscribe to a session room and get the current snapshot
//   - clients submit completed actions; we persist + rebroadcast the new score

const room = (sessionId: string) => `session:${sessionId}`;
const COMPANIES_ROOM = "companies"; // cross-company leaderboard subscribers

function clampScore(max: number, score?: number): number {
  if (typeof score !== "number" || Number.isNaN(score)) return max; // default: full points
  return Math.max(0, Math.min(max, Math.round(score)));
}

export function registerSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    socket.on("session:subscribe", async ({ sessionId }: { sessionId?: string }) => {
      if (!sessionId) return;
      socket.join(room(sessionId));
      const snapshot = await computeSessionSnapshot(sessionId);
      if (snapshot) {
        socket.emit("score:update", snapshot);
      } else {
        socket.emit("session:error", "Session not found");
      }
    });

    // The national/company leaderboard subscribes here; it refetches whenever any
    // company's score changes (signalled by "companies:dirty").
    socket.on("companies:subscribe", () => {
      socket.join(COMPANIES_ROOM);
    });

    socket.on(
      "action:complete",
      async (
        data: { sessionId?: string; playerId?: string; actionId?: string; score?: number; payload?: unknown },
        ack?: (res: unknown) => void,
      ) => {
        try {
          const { sessionId, playerId, actionId, score, payload } = data ?? {};
          if (!sessionId || !playerId || !actionId) throw new Error("sessionId, playerId and actionId are required");

          const action = getContent().actions.find((a) => a.id === actionId);
          if (!action) throw new Error(`unknown action: ${actionId}`);

          const player = await prisma.player.findUnique({ where: { id: playerId } });
          if (!player) throw new Error("unknown player");

          const awarded = clampScore(action.points, score);

          await prisma.actionCompletion.upsert({
            where: { playerId_actionId: { playerId, actionId } },
            create: {
              sessionId,
              playerId,
              actionId,
              roleId: player.roleId,
              score: awarded,
              payload: payload as never,
            },
            update: { score: awarded, payload: payload as never },
          });

          const snapshot = await computeSessionSnapshot(sessionId);
          io.to(room(sessionId)).emit("score:update", snapshot);
          io.to(COMPANIES_ROOM).emit("companies:dirty"); // a company's score moved
          ack?.({ ok: true, awarded, snapshot });

          // Once everyone has finished, generate the brief in the background so the
          // decision-maker can open it instantly. Fire-and-forget — never blocks play.
          ensureBriefForCompletedSession(sessionId)
            .then((res) => {
              if (res?.generated) io.to(room(sessionId)).emit("brief:ready", { code: res.code });
            })
            .catch((e) => console.warn(`[brief] background generation failed: ${(e as Error).message}`));
        } catch (err) {
          ack?.({ ok: false, error: (err as Error).message });
        }
      },
    );
  });
}
