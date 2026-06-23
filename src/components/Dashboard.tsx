"use client";

import { motion } from "framer-motion";
import { type SessionSnapshot } from "@/lib/snapshot-types";
import { AnimatedNumber } from "./AnimatedNumber";
import { LevelBadge } from "./LevelBadge";
import { DeptAvatar, UserAvatar } from "./Avatar";
import { BookEvoKitCTA } from "./BookEvoKitCTA";
import { ProgressBar } from "./ui";

// The shared dashboard: company Readiness Score, every department side by side,
// and the internal employee leaderboard. Used standalone (CEO view) and embedded
// in the player view. `highlightRole` / `highlightPlayerId` emphasise the viewer.
export function Dashboard({
  snapshot,
  highlightRole,
  highlightPlayerId,
}: {
  snapshot: SessionSnapshot;
  highlightRole?: string;
  highlightPlayerId?: string;
}) {
  const ranked = [...snapshot.departments].sort((a, b) => b.readiness - a.readiness);
  const leaderId = ranked[0]?.participated ? ranked[0].roleId : undefined;
  const topPlayers = snapshot.leaderboard.slice(0, 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <section className="space-y-4">
        <ReadinessGauge value={snapshot.companyReadiness} />
        <div className="pt-4">
          <a href="/leaderboard" className="btn-ghost w-full">
            🏆 See how you rank against other companies →
          </a>
        </div>
        <BookEvoKitCTA code={snapshot.code} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink/45">Departments</h2>
          {snapshot.boosterSent && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">🚀 Booster Active</span>
          )}
        </div>
        {ranked.map((d, i) => {
          const isMe = d.roleId === highlightRole;
          const isLeader = d.roleId === leaderId;
          const isCaptain = d.roleId === "captain";
          return (
            <motion.div
              key={d.roleId}
              layout
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
              className={["card p-4", isMe ? "ring-2 ring-brand" : "", isCaptain ? "bg-brand/5 border-brand/20" : ""].join(" ")}
            >
              <div className="flex items-center gap-3">
                <DeptAvatar emoji={d.avatar} color={d.color} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1 truncate font-display text-[15px] font-semibold">
                      {isLeader && <span title="In the lead">👑</span>}
                      {d.department}
                      {isMe && <span className="text-xs font-bold text-brand">(you)</span>}
                    </p>
                    <span className="shrink-0 text-xs font-bold text-ink/40">#{i + 1}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink/50">
                    <LevelBadge level={d.level} color={d.color} />
                    <span>·</span>
                    <span>
                      {d.playerCount} player{d.playerCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 font-display text-lg font-bold" style={{ color: d.color }}>
                  <AnimatedNumber value={Math.round(d.readiness * 100)} suffix="%" />
                </span>
              </div>

              <ProgressBar value={d.readiness} color={d.color} className="mt-3" />
              {!d.participated && (
                <p className="mt-2 text-xs font-semibold text-sun">Not started yet — pulling the score down 👀</p>
              )}
              {d.roleId === "finance" && snapshot.financeROI !== null && (
                <div className="mt-3 rounded-lg bg-green-50/50 p-2 text-xs font-medium text-green-800 ring-1 ring-inset ring-green-200">
                  <span className="font-bold">Calculated Savings Potential:</span> ~€{snapshot.financeROI.toLocaleString()} / year
                </div>
              )}
              {d.roleId === "finance" && (snapshot.financeBadges?.length > 0 || snapshot.financeFeedback) && (
                <div className="mt-3 rounded-lg bg-blue-50/50 p-3 text-xs text-blue-900 ring-1 ring-inset ring-blue-200 space-y-2">
                  {snapshot.financeBadges?.length > 0 && (
                    <div>
                      <span className="font-bold block mb-1">Unlocked Badges:</span>
                      <div className="flex flex-wrap gap-1">
                        {snapshot.financeBadges.map(b => (
                           <span key={b} className="bg-blue-100 px-2 py-0.5 rounded text-blue-800 font-medium">🏅 {b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {snapshot.financeMissingBadges?.length > 0 && (
                    <div>
                       <span className="font-bold block mb-1 text-red-700">Missing Badges:</span>
                       <div className="flex flex-wrap gap-1">
                        {snapshot.financeMissingBadges.map(b => (
                           <span key={b} className="bg-red-50 text-red-700 ring-1 ring-red-200 px-2 py-0.5 rounded font-medium opacity-70">🏅 {b}</span>
                        ))}
                       </div>
                    </div>
                  )}
                  {snapshot.financeFeedback && (
                    <div className="pt-2 border-t border-blue-200/50 italic text-blue-800/80">
                      {snapshot.financeFeedback}
                    </div>
                  )}
                </div>
              )}
              {d.roleId === "captain" && (snapshot.captainBadges?.length > 0 || snapshot.captainFeedback) && (
                <div className="mt-3 rounded-lg bg-indigo-50/50 p-3 text-xs text-indigo-900 ring-1 ring-inset ring-indigo-200 space-y-2">
                  {snapshot.captainBadges?.length > 0 && (
                    <div>
                      <span className="font-bold block mb-1">Earned Badges:</span>
                      <div className="flex flex-wrap gap-1">
                        {snapshot.captainBadges.map(b => (
                           <span key={b} className="bg-indigo-100 px-2 py-0.5 rounded text-indigo-800 font-medium">🏅 {b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {snapshot.captainFeedback && (
                    <div className="pt-2 border-t border-indigo-200/50 italic text-indigo-800/80">
                      {snapshot.captainFeedback}
                    </div>
                  )}
                </div>
              )}
              {d.roleId === "it" && (snapshot.itBadges?.length > 0 || snapshot.itFeedback) && (
                <div className="mt-3 rounded-lg bg-orange-50/50 p-3 text-xs text-orange-900 ring-1 ring-inset ring-orange-200 space-y-2">
                  {snapshot.itBadges?.length > 0 && (
                    <div>
                      <span className="font-bold block mb-1">Earned Badges:</span>
                      <div className="flex flex-wrap gap-1">
                        {snapshot.itBadges.map(b => (
                           <span key={b} className="bg-orange-100 px-2 py-0.5 rounded text-orange-800 font-medium">🏅 {b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {snapshot.itMissingBadges?.length > 0 && (
                    <div>
                       <span className="font-bold block mb-1 text-red-700">Missing Badges:</span>
                       <div className="flex flex-wrap gap-1">
                        {snapshot.itMissingBadges.map(b => (
                           <span key={b} className="bg-red-50 text-red-700 ring-1 ring-red-200 px-2 py-0.5 rounded font-medium opacity-70">🏅 {b}</span>
                        ))}
                       </div>
                    </div>
                  )}
                  {snapshot.itFeedback && (
                    <div className="pt-2 border-t border-orange-200/50 space-y-1.5 text-[11px] text-orange-950/90">
                      <div><span className="font-bold">Custom Code:</span> {snapshot.itFeedback.customCode}</div>
                      <div><span className="font-bold">Clean Core:</span> {snapshot.itFeedback.cleanCore}</div>
                      <div><span className="font-bold">Interfaces:</span> {snapshot.itFeedback.interfaces}</div>
                      <div><span className="font-bold">Operations:</span> {snapshot.itFeedback.operations}</div>
                      <div className="pt-1.5 border-t border-orange-200/50"><span className="font-bold text-red-800">Biggest Risk:</span> {snapshot.itFeedback.biggestRisk}</div>
                      <div><span className="font-bold text-green-800">Strongest Driver:</span> {snapshot.itFeedback.strongestDriver}</div>
                      <div><span className="font-bold text-ink/75">Next Step:</span> {snapshot.itFeedback.recommendedNextStep}</div>
                      <div className="pt-1.5 border-t border-orange-200/50 italic font-medium">{snapshot.itFeedback.finalMessage}</div>
                    </div>
                  )}
                </div>
              )}
              {d.roleId === "production" && (snapshot.productionBadges?.length > 0 || snapshot.productionFeedback) && (
                <div className="mt-3 rounded-lg bg-green-50/50 p-3 text-xs text-green-900 ring-1 ring-inset ring-green-200 space-y-2">
                  {snapshot.productionBadges?.length > 0 && (
                    <div>
                      <span className="font-bold block mb-1">Earned Badges:</span>
                      <div className="flex flex-wrap gap-1">
                        {snapshot.productionBadges.map(b => (
                           <span key={b} className="bg-green-100 px-2 py-0.5 rounded text-green-800 font-medium">🏅 {b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {snapshot.productionMissingBadges?.length > 0 && (
                    <div>
                       <span className="font-bold block mb-1 text-red-700">Missing Badges:</span>
                       <div className="flex flex-wrap gap-1">
                        {snapshot.productionMissingBadges.map(b => (
                           <span key={b} className="bg-red-50 text-red-700 ring-1 ring-red-200 px-2 py-0.5 rounded font-medium opacity-70">🏅 {b}</span>
                        ))}
                       </div>
                    </div>
                  )}
                  {snapshot.productionFeedback && (
                    <div className="pt-2 border-t border-green-200/50 space-y-1.5 text-[11px] text-green-950/90">
                      <div><span className="font-bold">Unplanned Downtime:</span> {snapshot.productionFeedback.unplannedDowntime}</div>
                      <div><span className="font-bold">Scrap/Rework Rate:</span> {snapshot.productionFeedback.scrapRate}</div>
                      <div><span className="font-bold">Plan Alignment:</span> {snapshot.productionFeedback.planAlignment}</div>
                      <div className="pt-1.5 border-t border-green-200/50"><span className="font-bold text-red-800">Biggest Risk:</span> {snapshot.productionFeedback.biggestRisk}</div>
                      <div><span className="font-bold text-green-800">Strongest Driver:</span> {snapshot.productionFeedback.strongestDriver}</div>
                      <div><span className="font-bold text-ink/75">Next Step:</span> {snapshot.productionFeedback.recommendedNextStep}</div>
                      <div className="pt-1.5 border-t border-green-200/50 italic font-medium">{snapshot.productionFeedback.finalMessage}</div>
                    </div>
                  )}
                </div>
              )}
              {d.roleId === "hr" && snapshot.hrBadges?.length > 0 && (
                <div className="mt-3 rounded-lg bg-pink-50/50 p-3 text-xs text-pink-900 ring-1 ring-inset ring-pink-200 space-y-2">
                  <div>
                    <span className="font-bold block mb-1">Earned Badges:</span>
                    <div className="flex flex-wrap gap-1">
                      {snapshot.hrBadges.map(b => (
                         <span key={b} className="bg-pink-100 px-2 py-0.5 rounded text-pink-800 font-medium">🏅 {b}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </section>

      <section className="space-y-2">
        <h2 className="px-1 font-display text-sm font-bold uppercase tracking-wide text-ink/45">Leaderboard</h2>
        {topPlayers.length === 0 ? (
          <p className="px-1 text-sm text-ink/40">No players yet.</p>
        ) : (
          <div className="card divide-y divide-ink/5 p-2">
            {topPlayers.map((p, i) => {
              const isMe = p.playerId === highlightPlayerId;
              return (
                <motion.div
                  key={p.playerId}
                  layout
                  className={`flex items-center gap-3 rounded-xl px-2 py-2 ${isMe ? "bg-brand/5" : ""}`}
                >
                  <span className="w-6 text-center font-display text-sm font-bold text-ink/40">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </span>
                  <UserAvatar raw={p.avatar} fallbackSeed={p.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {p.name}
                      {isMe && <span className="ml-1 text-xs font-bold text-brand">(you)</span>}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-ink/45">
                      <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                      {p.roleName}
                    </p>
                  </div>
                  <span className="shrink-0 font-display font-bold text-ink/70">{p.points}</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ReadinessGauge({ value }: { value: number }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-6 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-ink/45">Company Preparation</p>
      <div
        className="grid h-44 w-44 place-items-center rounded-full"
        style={{
          background: `conic-gradient(#6d5df6 ${value * 3.6}deg, #2bd4a8 ${value * 3.6}deg, rgba(22,26,62,0.06) 0deg)`,
        }}
      >
        <div className="grid h-36 w-36 place-items-center rounded-full bg-white shadow-inner">
          <AnimatedNumber value={value} suffix="%" className="font-display text-5xl font-bold text-brand" />
        </div>
      </div>
      <p className="text-xs text-ink/45">How engaged and aligned your organization is</p>
    </div>
  );
}
