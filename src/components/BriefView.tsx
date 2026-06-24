"use client";

import { useEffect, useState } from "react";
import { NavButton, Screen } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { SAP_READINESS_CHECK, SAP_ROI_CALCULATOR } from "@/lib/sap-links";
import type { BriefDoc } from "@/lib/brief-doc";
import type { CompanyProfile } from "@/lib/profile";

interface BriefResponse {
  source: "ai" | "baseline";
  doc: BriefDoc;
  company: { name: string } & CompanyProfile;
  sessionId: string;
  generatedAt: string;
}

const PATH_STYLE: Record<BriefDoc["path"]["recommended"], { color: string; emoji: string }> = {
  GROW: { color: "#2bd4a8", emoji: "🌱" },
  RISE: { color: "#6d5df6", emoji: "🚀" },
  PREPARE: { color: "#ffb23e", emoji: "🧭" },
};

const DEPT_STYLES: Record<string, { bg: string, border: string, shadow: string, emoji: string }> = {
  "Captain": { bg: "bg-brand/10", border: "border-brand/30", shadow: "rgba(109,93,246,0.3)", emoji: "📝" },
  "Finance-Pros": { bg: "bg-blue-100", border: "border-blue-300", shadow: "rgba(59,130,246,0.3)", emoji: "💰" },
  "Tech Team": { bg: "bg-mint/10", border: "border-mint/30", shadow: "rgba(43,212,168,0.3)", emoji: "💻" },
  "Ops-heroes": { bg: "bg-sun/10", border: "border-sun/30", shadow: "rgba(255,178,62,0.3)", emoji: "⚙️" },
  "People-Chamions": { bg: "bg-coral/10", border: "border-coral/30", shadow: "rgba(255,107,107,0.3)", emoji: "🤝" },
  "People-Champions": { bg: "bg-coral/10", border: "border-coral/30", shadow: "rgba(255,107,107,0.3)", emoji: "🤝" }
};

function HighlightText({ text }: { text: string }) {
  if (!text) return null;
  const regex = /(\b\d+(?:\.\d+)?%|\$\d+(?:\.\d+)?[MBK]?|€\d+(?:\.\d+)?[MBK]?|\bROI\b|\bSAP\b|\bERP\b|\b[A-Z]{2,}\b|\b\d+\b)/g;
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => {
        if (regex.test(part)) {
          return (
            <strong key={i} className="font-extrabold text-brand bg-brand/10 px-1.5 py-0.5 rounded-md inline-block shadow-sm">
              {part}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
}

export function BriefView({ code }: { code: string }) {
  const [data, setData] = useState<BriefResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [progress, setProgress] = useState(0);
  const [simulatedComplete, setSimulatedComplete] = useState(false);

  const steps = [
    { threshold: 30, message: "🔍 Analyzing department flags..." },
    { threshold: 60, message: "🧠 Synthesizing what your teams flagged..." },
    { threshold: 90, message: "⚡ Creating AI-powered debrief..." },
    { threshold: 100, message: "📋 Formatting board-ready brief..." },
  ];

  useEffect(() => {
    let alive = true;
    fetch(`/api/sessions/${code}/brief`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        return (await r.json()) as BriefResponse;
      })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(String((e as Error).message || e)));
    return () => {
      alive = false;
    };
  }, [code]);

  useEffect(() => {
    let current = 0;
    const duration = 2000; // 2 seconds
    const intervalTime = 50; // smooth 20fps update
    const step = 100 / (duration / intervalTime);

    const interval = setInterval(() => {
      current += step;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setSimulatedComplete(true);
      }
      setProgress(Math.round(current));
    }, intervalTime);
    return () => clearInterval(interval);
  }, []);

  if (error)
    return (
      <Screen>
        <p className="py-20 text-center text-ink/50">No challenge found for that code.</p>
      </Screen>
    );

  const currentStep = steps.find(s => progress <= s.threshold) || steps[steps.length - 1];

  if (!data || !simulatedComplete)
    return (
      <Screen className="max-w-md mx-auto">
        <div className="card flex flex-col items-center gap-6 p-8 py-12 text-center shadow-pop border border-brand/10">
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-brand/5 border border-brand/10">
            <div className="absolute inset-0 rounded-full bg-brand/10 animate-ping opacity-25" />
            <div className="absolute inset-2 rounded-full bg-brand/5 animate-pulse" />
            <span className="text-5xl select-none animate-bounce" style={{ animationDuration: "1.8s" }}>
              🧑‍💻
            </span>
            <span className="absolute -top-1 -right-1 text-2xl animate-pulse">
              🤔
            </span>
          </div>

          <div className="w-full space-y-2">
            <p className="font-display font-bold text-lg text-ink">Assembling Hartmann Brief</p>
            <p className="text-sm text-brand font-semibold min-h-[1.5rem] transition-all duration-300">
              {currentStep.message}
            </p>
          </div>

          <div className="w-full space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-ink/40 px-0.5">
              <span>PROGRESS</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-3 bg-black/5 rounded-full overflow-hidden p-[2px] border border-black/5">
              <div
                className="h-full bg-gradient-to-r from-brand to-mint rounded-full transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-ink/40 max-w-xs leading-normal">
            Structuring input from Captain, Finance, Tech Team, Ops-heroes, and People-Chamions into a board-ready executive report.
          </p>
        </div>
      </Screen>
    );

  const { doc, company, source } = data;
  const style = PATH_STYLE[doc.path.recommended];

  return (
    <main className="mx-auto w-full max-w-[95%] space-y-6 px-4 py-6 sm:px-6 sm:py-10 2xl:max-w-[110rem]">
      <div className="flex items-center justify-between print:hidden">
        <NavButton href={`/dashboard?session=${data.sessionId}`}>← Back</NavButton>
        <PrintButton />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left rail — identity, the recommended path, the next step */}
        <aside className="space-y-5 lg:col-span-4 xl:col-span-3">
          <div className="card space-y-4 p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-ink/45">📋 Challenge brief</p>
            <h1 className="font-display text-2xl font-bold leading-tight">{company.name}</h1>
            <div className="space-y-2 border-t border-ink/5 pt-4 text-left">
              <ProfileRow emoji="💼" text={company.industry} />
              <ProfileRow emoji="🌍" text={company.country} />
              <ProfileRow emoji="⚙️" text={company.sapVersion} />
              <ProfileRow emoji="📏" text={company.companySize} />
              <ProfileRow emoji="🔒" text={company.dataSensitivity} />
            </div>
            <div className="space-y-3 border-t border-ink/5 pt-4">
              <p className="text-left text-sm text-ink/70">{doc.headline}</p>
              <span className="inline-block rounded-full bg-ink/5 px-3 py-1 text-[11px] font-semibold text-ink/45">
                {source === "ai" ? "Synthesised from your team's input" : "Assembled from your team's input"}
              </span>
            </div>
          </div>

          {/* Recommended path */}
          <div className="card space-y-3 p-5" style={{ boxShadow: `inset 0 0 0 2px ${style.color}33` }}>
            <p className="text-xs font-bold uppercase tracking-widest text-ink/45">Your likely path</p>
            <p className="font-display text-2xl font-bold leading-tight" style={{ color: style.color }}>
              {style.emoji} {doc.path.label}
            </p>
            {!doc.path.confident && (
              <span className="inline-block rounded-full bg-sun/15 px-2.5 py-0.5 text-xs font-bold text-[#b9791a]">
                An honest read — not a sales push
              </span>
            )}
            <div className="border-t border-ink/5 pt-3">
              <p className="text-xs font-bold uppercase tracking-wide text-ink/40">Why this fits you</p>
              <Bullets items={doc.path.reasoning} />
            </div>
            {doc.path.sovereignty && <p className="text-sm text-ink/70">🛡️ {doc.path.sovereignty}</p>}
            <a
              href={SAP_READINESS_CHECK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-semibold text-brand underline"
            >
              🔍 SAP Readiness Check ↗
            </a>
          </div>

          {/* Next step — the EvoKit CTA */}
          <div className="rounded-xl2 relative overflow-hidden border border-[#6d5df6]/30 bg-[#161a3e] p-6 text-center text-white shadow-pop print:hidden">
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#6d5df6]/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-[#ffb23e]/10 blur-2xl" />
            <div className="relative space-y-3">
              <p className="text-3xl">🎯</p>
              <h2 className="font-display text-xl font-bold text-white">Your next step</h2>
              <p className="text-xs text-white/80">{doc.nextStep.summary}</p>
              <ul className="space-y-1 text-left text-xs text-white/85">
                {doc.nextStep.whatYouGet.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-mint">✓</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <a
                href={`/book/${code}`}
                className="inline-block w-full rounded-2xl bg-white px-6 py-3 text-sm font-bold text-brand shadow-sm transition hover:scale-105 hover:bg-white/95 active:scale-95"
              >
                📅 Book your EvoKit session →
              </a>
            </div>
          </div>
        </aside>

        {/* Main content — the reasoning */}
        <div className="space-y-8 lg:col-span-8 xl:col-span-9">
          <Panel title="📍 Where you stand today" summary={doc.standToday.summary} theme="info">
            <div className="mt-2 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink/40">The facts</p>
                <Bullets items={doc.standToday.facts} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink/40">What we don&apos;t fully know yet</p>
                <Bullets items={doc.standToday.unknowns} marker="–" />
              </div>
            </div>
          </Panel>

          {/* The differentiator: the company's own voice */}
          <section className="space-y-4">
            <h2 className="px-1 font-display text-base font-extrabold uppercase tracking-wide text-ink/70">
              🗣️ What our own people said
            </h2>
            <p className="px-1 text-base font-medium text-ink/80">{doc.ourPeopleSaid.summary}</p>
            {doc.ourPeopleSaid.byDepartment.length === 0 ? (
              <p className="px-1 text-sm text-ink/40">No input captured yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {doc.ourPeopleSaid.byDepartment.map((d) => {
                  const empty = d.points.length === 0;
                  const style = DEPT_STYLES[d.department] || { bg: "bg-white", border: "border-ink/20", shadow: "rgba(22,26,62,0.1)", emoji: "🏢" };
                  return (
                    <div
                      key={d.department}
                      className={`card p-5 border-2 ${empty ? "border-dashed border-ink/20 bg-ink/5" : `${style.bg} ${style.border}`}`}
                      style={empty ? undefined : { boxShadow: `0 4px 12px ${style.shadow}, inset 0 0 0 2px ${style.shadow}` }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{style.emoji}</span>
                        <p className={`font-display text-lg font-extrabold ${empty ? "text-ink/50" : "text-ink"}`}>{d.department}</p>
                      </div>
                      {empty ? (
                        <p className="mt-1 text-sm text-ink/40">No input yet — this team hasn&apos;t taken part.</p>
                      ) : (
                        <Bullets items={d.points} marker="🔸" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {doc.ourPeopleSaid.alignment.length > 0 && (
              <div className="card border-sun/30 bg-sun/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#b9791a]">Where teams were split</p>
                <Bullets items={doc.ourPeopleSaid.alignment} />
              </div>
            )}
          </section>

          {/* The two honest cases, side by side */}
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Panel title="💎 The honest case: what it's worth" summary={doc.worth.summary} theme="success">
              <Bullets items={doc.worth.valueDrivers} />
              <p className="mt-3 rounded-xl bg-white/60 px-3 py-2 text-sm text-ink/80 font-medium shadow-sm"><HighlightText text={doc.worth.peerOutcome} /></p>
              <p className="mt-3 text-sm text-ink/70"><HighlightText text={doc.worth.roiPointer} /></p>
              <a
                href={SAP_ROI_CALCULATOR}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm font-semibold text-brand underline"
              >
                💶 SAP ROI calculator ↗
              </a>
            </Panel>

            <Panel title="⚖️ The honest case: cost, effort & what's hard" summary={doc.costAndHard.summary} theme="warning">
              <Bullets items={doc.costAndHard.items} marker="–" />
            </Panel>
          </div>

          {/* De-risking + timing, side by side */}
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Panel title="🛡️ De-risking: the disaster scenario, handled" summary={doc.derisking.summary} theme="purple">
              <p className="mt-1 rounded-xl bg-white/60 px-3 py-2 text-sm text-ink/80 font-medium shadow-sm"><HighlightText text={doc.derisking.scenario} /></p>
              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-ink/40">How it&apos;s managed</p>
                <Bullets items={doc.derisking.mitigations} marker="✓" />
              </div>
            </Panel>

            <Panel title="⏳ Why now" summary={doc.whyNow.summary} theme="info">
              <Bullets items={doc.whyNow.points} />
            </Panel>
          </div>
        </div>
      </div>

      <p className="px-1 text-center text-xs text-ink/40">
        {source === "ai" ? "Synthesised by AI from your team's own input · " : ""}
        Generated by the Cloud Readiness Challenge · {new Date(data.generatedAt).toLocaleString()} · A starting read, not a
        substitute for{" "}
        <a href={SAP_READINESS_CHECK} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline">
          SAP&apos;s official Readiness Check ↗
        </a>
        .
      </p>
    </main>
  );
}

type PanelTheme = "default" | "warning" | "success" | "info" | "purple";

function Panel({
  title,
  summary,
  theme = "default",
  children,
}: {
  title: string;
  summary?: string;
  theme?: PanelTheme;
  children: React.ReactNode;
}) {
  const themeStyles = {
    default: "border-ink/10 bg-white",
    warning: "border-sun/40 bg-sun/10",
    success: "border-mint/40 bg-mint/10",
    info: "border-blue-500/30 bg-blue-50/70",
    purple: "border-brand/30 bg-brand/10",
  };

  const accentShadow = theme === "warning" 
    ? { boxShadow: "0 6px 16px rgba(255,122,69,0.1), inset 0 0 0 2px rgba(255,122,69,0.3)" } 
    : theme === "success" 
    ? { boxShadow: "0 6px 16px rgba(43,212,168,0.1), inset 0 0 0 2px rgba(43,212,168,0.3)" }
    : undefined;

  return (
    <section className="space-y-3">
      <h2 className="px-1 font-display text-base font-extrabold uppercase tracking-wide text-ink/70">{title}</h2>
      <div className={`card p-6 border-2 ${themeStyles[theme]}`} style={accentShadow}>
        {summary && <p className="text-base font-semibold text-ink/90 mb-4"><HighlightText text={summary} /></p>}
        {children}
      </div>
    </section>
  );
}

function ProfileRow({ emoji, text }: { emoji: string; text?: string | null }) {
  if (!text) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-ink/70">
      <span>{emoji}</span>
      <span>{text}</span>
    </div>
  );
}

function Bullets({ items, marker = "•" }: { items: string[]; marker?: string }) {
  if (!items.length) return null;
  return (
    <ul className="mt-2 space-y-1.5 text-sm text-ink/75">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2">
          <span className="select-none text-ink/30">{marker}</span>
          <span><HighlightText text={t} /></span>
        </li>
      ))}
    </ul>
  );
}

function Dot({ delay }: { delay: string }) {
  return <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-brand" style={{ animationDelay: delay }} />;
}
