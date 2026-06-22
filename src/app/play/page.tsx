"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { ActionConfig, Content } from "@/lib/content-schema";
import { loadPlayer, clearPlayer, type StoredPlayer } from "@/lib/player";
import { useSessionSnapshot } from "@/lib/useSessionSnapshot";
import { completeAction } from "@/lib/completeAction";
import { Button, Card, Pill, Screen } from "@/components/ui";
import { ActionRenderer } from "@/components/actions/ActionRenderer";
import type { ActionResult } from "@/components/actions/types";

export default function PlayPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<StoredPlayer | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [active, setActive] = useState<ActionConfig | null>(null);
  const [reward, setReward] = useState<number | null>(null);

  const snapshot = useSessionSnapshot(player?.sessionId);

  useEffect(() => {
    const p = loadPlayer();
    if (!p) {
      router.replace("/");
      return;
    }
    setPlayer(p);
  }, [router]);

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then(setContent);
  }, []);

  useEffect(() => {
    if (!player) return;
    fetch(`/api/players/${player.playerId}`)
      .then((r) => r.json())
      .then((d) => setCompleted(d.completedActionIds ?? []));
  }, [player]);

  if (!player || !content) {
    return (
      <Screen>
        <p className="py-20 text-center text-ink/50">Loading…</p>
      </Screen>
    );
  }

  const role = content.roles.find((r) => r.id === player.roleId);
  const actions = content.actions.filter((a) => a.roleId === player.roleId);
  const myDept = snapshot?.departments.find((d) => d.roleId === player.roleId);
  const doneCount = actions.filter((a) => completed.includes(a.id)).length;

  async function handleComplete(action: ActionConfig, result: ActionResult) {
    if (!player) return;
    const res = await completeAction({
      sessionId: player.sessionId,
      playerId: player.playerId,
      actionId: action.id,
      score: result.score,
      payload: result.payload,
    });
    if (res.ok) {
      setCompleted((c) => Array.from(new Set([...c, action.id])));
      setReward(res.awarded ?? action.points);
      setActive(null);
      setTimeout(() => setReward(null), 1700);
    }
  }

  return (
    <Screen className="space-y-5">
      {/* Role intro */}
      <Card className="space-y-2" >
        <div className="flex items-center justify-between">
          <Pill color={role?.color}>
            <span className="text-base">{role?.avatar}</span> {role?.name}
          </Pill>
          <button className="text-xs text-ink/40 underline" onClick={() => { clearPlayer(); router.replace("/"); }}>
            leave
          </button>
        </div>
        <p className="text-sm text-ink/70">{role?.blurb}</p>
        <div className="flex items-center gap-3 pt-1 text-sm">
          <span className="font-semibold" style={{ color: role?.color }}>
            {myDept?.earned ?? 0} pts
          </span>
          <span className="text-ink/40">·</span>
          <span className="text-ink/60">
            {doneCount}/{actions.length} actions done
          </span>
          <span className="text-ink/40">·</span>
          <span className="text-ink/60">Lvl {myDept?.level ?? 0}</span>
        </div>
      </Card>

      {/* Action feed */}
      <div className="space-y-3">
        {actions.map((a) => {
          const isDone = completed.includes(a.id);
          return (
            <button
              key={a.id}
              disabled={isDone}
              onClick={() => setActive(a)}
              className={`card flex w-full items-center gap-3 p-4 text-left transition ${
                isDone ? "opacity-60" : "hover:-translate-y-0.5"
              }`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-lg">
                {a.type === "quiz" ? "❓" : a.type === "swipe" ? "👆" : "💬"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{a.title}</span>
                {a.subtitle && <span className="block text-xs text-ink/50">{a.subtitle}</span>}
              </span>
              <span className="shrink-0 text-sm font-semibold text-brand">
                {isDone ? "✓" : `+${a.points}`}
              </span>
            </button>
          );
        })}
      </div>

      <a href="/dashboard" className="btn-ghost w-full">
        See the live dashboard →
      </a>

      {/* Active action sheet */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <motion.div
              className="card max-h-[88dvh] w-full max-w-md overflow-y-auto p-5"
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{active.title}</h2>
                  {active.subtitle && <p className="text-xs text-ink/50">{active.subtitle}</p>}
                </div>
                <button className="text-ink/40" onClick={() => setActive(null)}>
                  ✕
                </button>
              </div>
              <ActionRenderer action={active} onComplete={(r) => handleComplete(active, r)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reward burst */}
      <AnimatePresence>
        {reward !== null && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-30 grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.6, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="rounded-3xl bg-white px-8 py-6 text-center shadow-card"
            >
              <p className="text-5xl">🎉</p>
              <p className="mt-1 text-2xl font-extrabold text-brand">+{reward}</p>
              <p className="text-xs text-ink/50">readiness points</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  );
}
