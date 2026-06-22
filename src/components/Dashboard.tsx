"use client";

import { motion } from "framer-motion";
import { MAX_LEVEL, type SessionSnapshot } from "@/lib/snapshot-types";

// The shared dashboard: company Readiness Score + every department side by side.
// Used standalone (CEO view) and embedded in the player view. `highlightRole`
// emphasises the viewer's own department.
export function Dashboard({
  snapshot,
  highlightRole,
}: {
  snapshot: SessionSnapshot;
  highlightRole?: string;
}) {
  const ranked = [...snapshot.departments].sort((a, b) => b.readiness - a.readiness);

  return (
    <div className="space-y-5">
      <ReadinessGauge value={snapshot.companyReadiness} />

      <div className="space-y-3">
        {ranked.map((d, i) => {
          const isMe = d.roleId === highlightRole;
          return (
            <motion.div
              key={d.roleId}
              layout
              className={[
                "card p-4",
                isMe ? "ring-2 ring-brand" : "",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden>
                  {d.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">
                      {d.name}
                      {isMe && <span className="ml-1 text-xs text-brand">(you)</span>}
                    </p>
                    <span className="shrink-0 text-xs text-ink/50">#{i + 1}</span>
                  </div>
                  <p className="text-xs text-ink/50">
                    Lvl {d.level}/{MAX_LEVEL} · {d.earned}/{d.max} pts · {d.playerCount} player
                    {d.playerCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: d.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(d.readiness * 100)}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
              {!d.participated && (
                <p className="mt-2 text-xs text-amber-600">Not started yet — dragging the score down 👀</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ReadinessGauge({ value }: { value: number }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-6 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-ink/50">Company Readiness</p>
      <div
        className="grid h-40 w-40 place-items-center rounded-full"
        style={{
          background: `conic-gradient(#6d5df6 ${value * 3.6}deg, rgba(0,0,0,0.06) 0deg)`,
        }}
      >
        <div className="grid h-32 w-32 place-items-center rounded-full bg-white">
          <motion.span
            key={value}
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            className="text-4xl font-extrabold text-brand"
          >
            {value}%
          </motion.span>
        </div>
      </div>
      <p className="text-xs text-ink/50">Arithmetic mean of all departments&apos; readiness</p>
    </div>
  );
}
