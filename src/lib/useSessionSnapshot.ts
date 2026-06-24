"use client";

import { useEffect, useState } from "react";
import { getSocket } from "./socketClient";
import type { SessionSnapshot } from "./snapshot-types";

// Subscribe to a session's live score snapshot. Used by both the player view
// and the dashboard — they render the same data, two layouts.
export function useSessionSnapshot(sessionId?: string): SessionSnapshot | null | false {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null | false>(null);

  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();
    const subscribe = () => socket.emit("session:subscribe", { sessionId });

    const handleUpdate = (s: SessionSnapshot) => setSnapshot(s);
    const handleError = () => setSnapshot(false);

    socket.on("score:update", handleUpdate);
    socket.on("session:error", handleError);
    socket.on("connect", subscribe);
    if (socket.connected) subscribe();

    return () => {
      socket.off("score:update", handleUpdate);
      socket.off("session:error", handleError);
      socket.off("connect", subscribe);
    };
  }, [sessionId]);

  return snapshot;
}
