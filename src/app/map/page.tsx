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
    <Screen className="max-w-2xl space-y-4">
      <header className="space-y-1 pt-2 text-center">
        <p className="text-4xl">🗺️</p>
        <h1 className="font-display text-2xl font-bold">Preparation Map</h1>
        <p className="text-sm text-ink/60">How prepared is Germany? Tap a region, then zoom into its cities.</p>
      </header>

      <GermanyMap />

      <a href="/leaderboard" className="btn-ghost w-full">
        🏆 Company leaderboard →
      </a>
    </Screen>
  );
}
