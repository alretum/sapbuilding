"use client";

import { getSocket } from "./socketClient";
import type { SessionSnapshot } from "./snapshot-types";

export interface CompleteActionInput {
  sessionId: string;
  playerId: string;
  actionId: string;
  score?: number; // omit to award the action's full points
  payload?: unknown; // raw answers/choices, stored for later analysis
}

export interface CompleteActionResult {
  ok: boolean;
  awarded?: number;
  snapshot?: SessionSnapshot;
  error?: string;
}

// Submit a completed action over the socket and resolve with the server's ack.
export function completeAction(input: CompleteActionInput): Promise<CompleteActionResult> {
  return new Promise((resolve) => {
    getSocket().emit("action:complete", input, (res: CompleteActionResult) => {
      resolve(res ?? { ok: false, error: "no response from server" });
    });
  });
}
