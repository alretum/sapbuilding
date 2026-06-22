"use client";

import { Reveal, Section, SectionHeading } from "./primitives";
import { ProgressBar } from "@/components/ui";

// Illustrative sample data — the real boards fill with live company data.
const SAMPLE_COMPANIES = [
  { name: "Nordwind Logistik", readiness: 82 },
  { name: "Alpenmetall GmbH", readiness: 71 },
  { name: "Rheinwerke AG", readiness: 64 },
  { name: "Hanse Digital", readiness: 58 },
];

export function Teasers() {
  return (
    <Section className="bg-white/40">
      <Reveal>
        <SectionHeading
          eyebrow="A friendly competition"
          title="Climb the boards. Light up the map."
          subtitle="Companies compete on readiness, and regions across Germany light up as more teams play."
        />
      </Reveal>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {/* Leaderboard teaser */}
        <Reveal>
          <div className="card h-full p-5">
            <p className="font-display font-bold">🏆 Company leaderboard</p>
            <div className="mt-3 space-y-2">
              {SAMPLE_COMPANIES.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-6 text-center font-display text-sm font-bold text-ink/40">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-semibold">{c.name}</span>
                      <span className="font-display text-sm font-bold text-brand">{c.readiness}%</span>
                    </div>
                    <ProgressBar value={c.readiness / 100} color="#6d5df6" className="mt-1" />
                  </div>
                </div>
              ))}
            </div>
            <a href="/leaderboard" className="mt-4 inline-block text-sm font-semibold text-brand underline">
              See the live leaderboard →
            </a>
          </div>
        </Reveal>

        {/* Map teaser */}
        <Reveal delay={0.05}>
          <div className="card flex h-full flex-col p-5">
            <p className="font-display font-bold">🗺️ The readiness map</p>
            <p className="mt-1 text-sm text-ink/60">
              A live, colour-coded map of Germany — zoom into regions and cities to see how ready they are.
            </p>
            <div
              className="mt-3 grid flex-1 place-items-center rounded-2xl"
              style={{
                minHeight: 160,
                background:
                  "radial-gradient(circle at 30% 30%, #9b8cff55, transparent 55%), radial-gradient(circle at 70% 65%, #2bd4a855, transparent 55%), linear-gradient(160deg,#eef0fb,#e7fbf4)",
              }}
            >
              <span className="text-6xl">🇩🇪</span>
            </div>
            <a href="/map" className="mt-4 inline-block text-sm font-semibold text-brand underline">
              Explore the live map →
            </a>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
