"use client";

import { useEffect, useState } from "react";
import { loadPlayer } from "@/lib/player";
import { useSessionSnapshot } from "@/lib/useSessionSnapshot";
import { Dashboard } from "@/components/Dashboard";
import { Card, NavButton, Screen } from "@/components/ui";

// Live dashboard. Resolves which session to show from ?session=<id> (host link)
// or from the stored player (a participant peeking at the standings).
export default function DashboardPage() {
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [myRole, setMyRole] = useState<string | undefined>();
  const [myPlayerId, setMyPlayerId] = useState<string | undefined>();

  useEffect(() => {
    const player = loadPlayer();
    if (player) {
      setMyRole(player.roleId);
      setMyPlayerId(player.playerId);
    }
    const fromQuery = new URLSearchParams(window.location.search).get("session");
    if (fromQuery) {
      setSessionId(fromQuery);
      return;
    }
    if (player) setSessionId(player.sessionId);
  }, []);

  const snapshot = useSessionSnapshot(sessionId);

  return (
    <Screen className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold">{snapshot?.name ?? "Live Dashboard"}</h1>
          {snapshot && <p className="text-xs text-ink/50">Session {snapshot.code}</p>}
        </div>
        <NavButton href="/play">← Play</NavButton>
      </header>

      {!sessionId ? (
        <Card className="text-center text-sm text-ink/60">
          No session selected. Join a challenge first, or open a host dashboard link.
        </Card>
      ) : !snapshot ? (
        <Card className="text-center text-sm text-ink/50">Connecting to the live scores…</Card>
      ) : (
        <Dashboard snapshot={snapshot} highlightRole={myRole} highlightPlayerId={myPlayerId} />
      )}

      <a href="/leaderboard" className="btn-ghost w-full">
        🏆 See how you rank against other companies →
      </a>
    </Screen>
  );
}
