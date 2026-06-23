"use client";

import { recommend, type RecPath } from "@/lib/recommendation";
import type { CompanyProfile } from "@/lib/profile";
import { SAP_READINESS_CHECK, SAP_ROI_CALCULATOR } from "@/lib/sap-links";
import { PeerStories } from "./PeerStories";

const PATH_STYLE: Record<RecPath, { color: string; emoji: string }> = {
  GROW: { color: "#2bd4a8", emoji: "🌱" },
  RISE: { color: "#6d5df6", emoji: "🚀" },
  PREPARE: { color: "#ffb23e", emoji: "🧭" },
};

export function PersonalizedRead({ companyName, profile }: { companyName: string; profile: CompanyProfile }) {
  const rec = recommend(profile);
  const style = PATH_STYLE[rec.path];

  return (
    <div className="space-y-4">
      {/* Path */}
      <div className="card p-6 text-center" style={{ boxShadow: `inset 0 0 0 2px ${style.color}33` }}>
        <p className="text-xs font-bold uppercase tracking-widest text-ink/45">Your likely path · {companyName}</p>
        <p className="mt-1 font-display text-3xl font-bold" style={{ color: style.color }}>
          {style.emoji} {rec.pathLabel}
        </p>
        <p className="mt-1 text-ink/70">{rec.headline}</p>
        {!rec.confident && (
          <span className="mt-3 inline-block rounded-full bg-sun/15 px-3 py-1 text-xs font-bold text-[#b9791a]">
            An honest read — not a sales push
          </span>
        )}
      </div>

      {/* Why */}
      <div className="card p-5">
        <h3 className="font-display font-bold">Why this fits you</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-ink/70">
          {rec.rationale.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-brand">•</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      {/* AI + sovereignty */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card p-5">
          <p className="font-display font-bold">🤖 The AI you&apos;d unlock</p>
          <p className="mt-1 text-sm text-ink/70">{rec.aiUnlocked}</p>
        </div>
        <div className="card p-5">
          <p className="font-display font-bold">🛡️ Sovereignty</p>
          <p className="mt-1 text-sm text-ink/70">{rec.sovereignty}</p>
        </div>
      </div>

      {/* Urgency clock */}
      <div className="card border-sun/30 bg-sun/5 p-5">
        <p className="font-display font-bold text-[#b9791a]">⏳ Your clock</p>
        <p className="mt-1 text-sm text-ink/75">
          {rec.clock.headline}{" "}
          {rec.clock.onEcc && "Every month on ECC is a month without the AI your competitors may already be using."}
        </p>
      </div>

      {/* Peer proof */}
      <div className="card p-5">
        <p className="font-display font-bold">👥 {rec.peers.summary}</p>
        <ul className="mt-2 space-y-1 text-sm text-ink/70">
          {rec.peers.outcomes.map((o, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-mint">✓</span>
              {o}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs font-semibold text-ink/50">
          Most chose <span style={{ color: PATH_STYLE[rec.peers.mostChose].color }}>{rec.peers.mostChose} with SAP</span>.
          (Illustrative — real attributed references on request.)
        </p>
      </div>

      {/* Peer voices */}
      <PeerStories industry={profile.industry} />

      {/* Honesty + the real SAP tools */}
      <div className="card p-5">
        <p className="font-display font-bold">🤝 Straight talk</p>
        <ul className="mt-2 space-y-1 text-sm text-ink/60">
          {rec.caveats.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-ink/30">—</span>
              {c}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink/5 pt-3 text-sm">
          <span className="text-xs font-bold uppercase tracking-wide text-ink/40">The real versions, from SAP:</span>
          <a
            href={SAP_READINESS_CHECK}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand underline"
          >
            🔍 Readiness Check ↗
          </a>
          <a
            href={SAP_ROI_CALCULATOR}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand underline"
          >
            💶 ROI calculator ↗
          </a>
        </div>
      </div>
    </div>
  );
}
