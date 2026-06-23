"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getSocket } from "@/lib/socketClient";
import { loadPlayer } from "@/lib/player";
import { Card, NavButton, Screen, ProgressBar } from "@/components/ui";
import { AnimatedNumber } from "@/components/AnimatedNumber";

type Company = {
  id: string;
  code: string;
  name: string;
  readiness: number;
  players: number;
  departments: number;
  participatingDepartments: number;
};

// Cross-company leaderboard: every competing company ranked by Readiness Score.
// Updates live — it refetches whenever any company's score moves.
export default function CompanyLeaderboardPage() {
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [mySession, setMySession] = useState<string | undefined>();

  const refetch = useCallback(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setCompanies(d.companies ?? []))
      .catch(() => setCompanies([]));
  }, []);

  useEffect(() => {
    setMySession(loadPlayer()?.sessionId);
    refetch();

    const socket = getSocket();
    let timer: ReturnType<typeof setTimeout>;
    const onDirty = () => {
      clearTimeout(timer);
      timer = setTimeout(refetch, 500); // coalesce bursts
    };
    const subscribe = () => socket.emit("companies:subscribe");

    socket.on("companies:dirty", onDirty);
    socket.on("connect", subscribe);
    if (socket.connected) subscribe();

    return () => {
      socket.off("companies:dirty", onDirty);
      socket.off("connect", subscribe);
      clearTimeout(timer);
    };
  }, [refetch]);

  return (
    <Screen className="space-y-5">
      <header className="space-y-1 pt-2 text-center">
        <p className="text-4xl">🏆</p>
        <h1 className="font-display text-2xl font-bold">Company Leaderboard</h1>
        <p className="text-sm text-ink/60">Every company competing, ranked by Preparation Score.</p>
      </header>

      {companies === null ? (
        <Card className="text-center text-sm text-ink/50">Loading the standings…</Card>
      ) : companies.length === 0 ? (
        <Card className="text-center text-sm text-ink/50">No companies on the board yet.</Card>
      ) : (
        <div className="space-y-3">
          {companies.map((c, i) => {
            const isMine = c.id === mySession;
            return (
              <motion.div
                key={c.id}
                layout
                transition={{ type: "spring", stiffness: 200, damping: 26 }}
                className={`card p-4 ${isMine ? "ring-2 ring-brand" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 shrink-0 text-center font-display text-lg font-bold text-ink/40">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-semibold">
                      {c.name}
                      {isMine && <span className="ml-1 text-xs font-bold text-brand">(your company)</span>}
                    </p>
                    <p className="text-xs text-ink/50">
                      {c.participatingDepartments}/{c.departments} departments active · {c.players} player
                      {c.players === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-xl font-bold text-brand">
                    <AnimatedNumber value={c.readiness} suffix="%" />
                  </span>
                </div>
                <ProgressBar value={c.readiness / 100} color="#6d5df6" className="mt-3" />
              </motion.div>
            );
          })}
        </div>
      )}

      <a href="/map" className="btn-ghost w-full">
        🗺️ See the preparation map →
      </a>
      <div className="text-center">
        <NavButton href="/dashboard">← Back to your dashboard</NavButton>
      </div>
    </Screen>
  );
}
