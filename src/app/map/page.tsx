"use client";

import dynamic from "next/dynamic";
import { Screen } from "@/components/ui";

// react-simple-maps is client-only (uses DOM measurement / d3-zoom), so load it
// without SSR to avoid any prerender issues.
const GermanyMap = dynamic(() => import("@/components/GermanyMap"), {
  ssr: false,
  loading: () => <div className="grid h-[68vh] place-items-center text-sm text-ink/40">Loading the map…</div>,
});

export default function MapPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10 space-y-5">
      <header className="flex items-center justify-between border-b border-black/5 pb-3">
        <div className="text-left">
          <h1 className="font-display text-xl font-bold">Readiness Map</h1>
          <p className="text-xs text-ink/50">Germany's cloud state</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <a href="/play" title="Play Tasks" className="flex items-center justify-center h-9 w-9 rounded-xl bg-ink/[0.05] hover:bg-ink/[0.1] text-lg transition">🎮</a>
          <a href="/dashboard" title="Dashboard" className="flex items-center justify-center h-9 w-9 rounded-xl bg-ink/[0.05] hover:bg-ink/[0.1] text-lg transition">📊</a>
          <a href="/leaderboard" title="Company Leaderboard" className="flex items-center justify-center h-9 w-9 rounded-xl bg-ink/[0.05] hover:bg-ink/[0.1] text-lg transition">🏆</a>
          <a href="/map" title="Readiness Map" className="flex items-center justify-center h-9 w-9 rounded-xl bg-ink/[0.05] hover:bg-ink/[0.1] text-lg transition font-bold border border-brand bg-brand/5">🗺️</a>
          <a href="/admin" title="SAP Admin" className="flex items-center justify-center h-9 w-9 rounded-xl bg-ink/[0.05] hover:bg-ink/[0.1] text-lg transition">⚙️</a>
        </div>
      </header>

      <GermanyMap />

      <a href="/leaderboard" className="btn-ghost w-full">
        🏆 Company leaderboard →
      </a>
    </main>
  );
}
