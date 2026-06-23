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
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-10 space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold">{snapshot?.name ?? "Live Dashboard"}</h1>
          {snapshot && <p className="text-xs text-ink/50">Session {snapshot.code}</p>}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <a href="/play" title="Play Tasks" className="flex items-center justify-center h-9 w-9 rounded-xl bg-ink/[0.05] hover:bg-ink/[0.1] text-lg transition">🎮</a>
          <a href="/dashboard" title="Dashboard" className="flex items-center justify-center h-9 w-9 rounded-xl bg-ink/[0.05] hover:bg-ink/[0.1] text-lg transition font-bold border border-brand bg-brand/5">📊</a>
          <a href="/leaderboard" title="Company Leaderboard" className="flex items-center justify-center h-9 w-9 rounded-xl bg-ink/[0.05] hover:bg-ink/[0.1] text-lg transition">🏆</a>
          <a href="/map" title="Readiness Map" className="flex items-center justify-center h-9 w-9 rounded-xl bg-ink/[0.05] hover:bg-ink/[0.1] text-lg transition">🗺️</a>
          <a href="/admin" title="SAP Admin" className="flex items-center justify-center h-9 w-9 rounded-xl bg-ink/[0.05] hover:bg-ink/[0.1] text-lg transition">⚙️</a>
        </div>
      </header>

      {!sessionId ? (
        <Card className="text-center text-sm text-ink/60 max-w-md mx-auto">
          No session selected. Join a challenge first, or open a host dashboard link.
        </Card>
      ) : !snapshot ? (
        <Card className="text-center text-sm text-ink/50 max-w-md mx-auto">Connecting to the live scores…</Card>
      ) : (
        <Dashboard snapshot={snapshot} highlightRole={myRole} highlightPlayerId={myPlayerId} />
      )}
    </main>
  );
}
