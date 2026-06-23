"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { ActionConfig, Content } from "@/lib/content-schema";
import { loadPlayer, savePlayer, clearPlayer, type StoredPlayer } from "@/lib/player";
import { parseAvatar, type AvatarConfig } from "@/lib/avatar-config";
import { useSessionSnapshot } from "@/lib/useSessionSnapshot";
import { completeAction } from "@/lib/completeAction";
import { celebrateBig, celebrateSmall } from "@/lib/celebrate";
import { haptic } from "@/lib/haptics";
import { Button, Card, NavButton, Pill, ProgressBar, Screen } from "@/components/ui";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { LevelBadge } from "@/components/LevelBadge";
import { DeptAvatar, UserAvatar } from "@/components/Avatar";
import { AvatarEditor } from "@/components/AvatarEditor";
import { BookEvoKitCTA } from "@/components/BookEvoKitCTA";
import { ActionRenderer } from "@/components/actions/ActionRenderer";
import type { ActionResult } from "@/components/actions/types";

export default function PlayPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<StoredPlayer | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [active, setActive] = useState<ActionConfig | null>(null);
  const [reward, setReward] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

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
      .then((d) => {
        setCompleted(d.completedActionIds ?? []);
        if (d.avatar && d.avatar !== player.avatar) {
          const updated = { ...player, avatar: d.avatar };
          setPlayer(updated);
          savePlayer(updated);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.playerId]);

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
  const myEntry = snapshot?.leaderboard.find((p) => p.playerId === player.playerId);
  const myRank = snapshot ? snapshot.leaderboard.findIndex((p) => p.playerId === player.playerId) + 1 : 0;
  const doneCount = actions.filter((a) => completed.includes(a.id)).length;
  const progress = actions.length > 0 ? doneCount / actions.length : 0;

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
      const nextDone = Array.from(new Set([...completed, action.id]));
      setCompleted(nextDone);
      setActive(null);
      setReward(res.awarded ?? action.points);
      haptic([12, 30, 12]);
      if (nextDone.length === actions.length) celebrateBig();
      else celebrateSmall();
      setTimeout(() => setReward(null), 1800);
    }
  }

  async function saveAvatar(config: AvatarConfig) {
    if (!player) return;
    setSavingAvatar(true);
    try {
      const res = await fetch(`/api/players/${player.playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: config }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = { ...player, avatar: data.avatar };
        setPlayer(updated);
        savePlayer(updated);
        setEditing(false);
      }
    } finally {
      setSavingAvatar(false);
    }
  }

  return (
    <Screen className="space-y-5">
      {/* Top bar: editable avatar + identity */}
      <div className="flex items-center gap-3">
        <UserAvatar raw={player.avatar} fallbackSeed={player.name} size={52} onClick={() => setEditing(true)} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold leading-tight">{player.name}</p>
          <Pill color={role?.color}>
            <span>{role?.avatar}</span> {role?.name}
          </Pill>
        </div>
        <NavButton
          onClick={() => {
            clearPlayer();
            router.replace("/");
          }}
        >
          🚪 Leave
        </NavButton>
      </div>

      {/* Role hero */}
      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <DeptAvatar emoji={role?.avatar ?? "⭐"} color={role?.color ?? "#6d5df6"} size={56} />
          <div>
            <p className="font-display text-lg font-bold leading-tight">{role?.name}</p>
            <p className="text-xs text-ink/50">{role?.department}</p>
          </div>
        </div>
        <p className="text-sm text-ink/70">{role?.blurb}</p>
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <Stat label="Your points" value={<AnimatedNumber value={myEntry?.points ?? 0} />} color={role?.color} />
          <Stat label="Level" value={<LevelBadge level={myDept?.level ?? 0} color={role?.color} />} />
          <Stat label="Rank" value={myRank ? `#${myRank}` : "—"} />
        </div>
      </Card>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1 text-xs font-semibold text-ink/50">
          <span>Your tasks</span>
          <span>
            {doneCount}/{actions.length} done
          </span>
        </div>
        <ProgressBar value={progress} color={role?.color ?? "#6d5df6"} />
      </div>

      {/* Action feed */}
      <div className="space-y-3">
        {actions.map((a) => {
          const isDone = completed.includes(a.id);
          return (
            <button
              key={a.id}
              disabled={isDone}
              onClick={() => {
                haptic(10);
                setActive(a);
              }}
              className={`card flex w-full items-center gap-3 p-4 text-left transition ${
                isDone ? "opacity-60" : "hover:-translate-y-0.5 hover:shadow-pop"
              }`}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-xl">
                {a.type === "quiz" ? "❓" : a.type === "swipe" ? "👆" : "💬"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display font-semibold">{a.title}</span>
                {a.subtitle && <span className="block text-xs text-ink/50">{a.subtitle}</span>}
              </span>
              <span className="shrink-0 font-display text-sm font-bold text-brand">
                {isDone ? "✓ done" : `+${a.points}`}
              </span>
            </button>
          );
        })}
      </div>

      {doneCount === actions.length && actions.length > 0 && <BookEvoKitCTA code={player.code} />}

      <a href="/dashboard" className="btn-ghost w-full">
        🏆 Leaderboard & dashboard →
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
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              exit={{ y: 60 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold">{active.title}</h2>
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
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="rounded-xl3 bg-white px-10 py-7 text-center shadow-pop"
            >
              <p className="text-5xl">🎉</p>
              <p className="mt-1 font-display text-3xl font-extrabold text-brand">
                +<AnimatedNumber value={reward} duration={900} />
              </p>
              <p className="text-xs font-semibold text-ink/50">preparation points</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar editor */}
      <AnimatePresence>
        {editing && (
          <AvatarEditor
            initial={parseAvatar(player.avatar, player.name)}
            saving={savingAvatar}
            onSave={saveAvatar}
            onClose={() => setEditing(false)}
          />
        )}
      </AnimatePresence>
    </Screen>
  );
}

function Stat({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="rounded-2xl bg-ink/[0.03] py-2">
      <div className="font-display text-base font-bold" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">{label}</div>
    </div>
  );
}
