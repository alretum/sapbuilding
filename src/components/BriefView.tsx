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

export function BriefView({ code }: { code: string }) {
  const [data, setData] = useState<BriefResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (error)
    return (
      <Screen>
        <p className="py-20 text-center text-ink/50">No challenge found for that code.</p>
      </Screen>
    );

  if (!data)
    return (
      <Screen className="max-w-3xl">
        <div className="card flex flex-col items-center gap-3 py-20 text-center">
          <span className="flex gap-1" aria-hidden>
            <Dot delay="0ms" />
            <Dot delay="150ms" />
            <Dot delay="300ms" />
          </span>
          <p className="font-display font-semibold">Assembling your brief…</p>
          <p className="max-w-sm text-sm text-ink/50">Synthesising what your teams flagged into a board-ready read.</p>
        </div>
      </Screen>
    );

  const { doc, company, source } = data;
  const chips = [company.industry, company.country, company.sapVersion, company.companySize, company.dataSensitivity].filter(Boolean);

  return (
    <Screen className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between print:hidden">
        <NavButton href={`/dashboard?session=${data.sessionId}`}>← Back</NavButton>
        <PrintButton />
      </div>

      {/* Header */}
      <div className="card p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-ink/45">Challenge brief</p>
        <h1 className="mt-1 font-display text-3xl font-bold">{company.name}</h1>
        {chips.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {chips.map((chip) => (
              <span key={String(chip)} className="rounded-full bg-ink/5 px-2.5 py-0.5 text-xs text-ink/60">
                {chip}
              </span>
            ))}
          </div>
        )}
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink/70">{doc.headline}</p>
        <span className="mt-3 inline-block rounded-full bg-ink/5 px-3 py-1 text-[11px] font-semibold text-ink/45">
          {source === "ai" ? "Synthesised from your team's input" : "Assembled from your team's input"}
        </span>
      </div>

      {/* 1 — Where this company stands today */}
      <Section n={1} title="Where you stand today" summary={doc.standToday.summary}>
        <Bullets items={doc.standToday.facts} />
        {doc.standToday.unknowns.length > 0 && (
          <div className="mt-3 border-t border-ink/5 pt-3">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/40">What we don&apos;t fully know yet</p>
            <Bullets items={doc.standToday.unknowns} marker="–" />
          </div>
        )}
      </Section>

      {/* 2 — What our own people said */}
      <Section n={2} title="What our own people said" summary={doc.ourPeopleSaid.summary} accent>
        {doc.ourPeopleSaid.byDepartment.map((d) => (
          <div key={d.department} className="mt-3 first:mt-0">
            <p className="font-display font-semibold">{d.department}</p>
            <Bullets items={d.points} />
          </div>
        ))}
        {doc.ourPeopleSaid.alignment.length > 0 && (
          <div className="mt-3 border-t border-ink/5 pt-3">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/40">Where teams were split</p>
            <Bullets items={doc.ourPeopleSaid.alignment} marker="•" />
          </div>
        )}
      </Section>

      {/* 3 — What the move is worth */}
      <Section n={3} title="The honest case: what it's worth" summary={doc.worth.summary}>
        <Bullets items={doc.worth.valueDrivers} />
        <p className="mt-3 rounded-xl bg-ink/5 px-3 py-2 text-sm text-ink/70">{doc.worth.peerOutcome}</p>
        <p className="mt-3 text-sm text-ink/70">{doc.worth.roiPointer}</p>
        <a href={SAP_ROI_CALCULATOR} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-semibold text-brand underline">
          💶 SAP ROI calculator ↗
        </a>
      </Section>

      {/* 4 — Cost, effort, and what's hard */}
      <Section n={4} title="The honest case: cost, effort & what's hard" summary={doc.costAndHard.summary} accent>
        <Bullets items={doc.costAndHard.items} marker="–" />
      </Section>

      {/* 5 — De-risking */}
      <Section n={5} title="De-risking: the disaster scenario, handled" summary={doc.derisking.summary}>
        <p className="text-sm text-ink/75">{doc.derisking.scenario}</p>
        <div className="mt-3">
          <p className="text-xs font-bold uppercase tracking-wide text-ink/40">How it's managed</p>
          <Bullets items={doc.derisking.mitigations} marker="✓" />
        </div>
      </Section>

      {/* 6 — Why now */}
      <Section n={6} title="Why now" summary={doc.whyNow.summary}>
        <Bullets items={doc.whyNow.points} />
      </Section>

      {/* 7 — Which path, and why */}
      <Section n={7} title="Which path, and why" summary="">
        <div className="rounded-xl bg-ink/5 px-4 py-3">
          <p className="font-display text-xl font-bold text-brand">{doc.path.label}</p>
          {!doc.path.confident && (
            <span className="mt-1 inline-block rounded-full bg-sun/15 px-2.5 py-0.5 text-xs font-bold text-[#b9791a]">
              An honest read — not a sales push
            </span>
          )}
        </div>
        <Bullets items={doc.path.reasoning} />
        <p className="mt-3 text-sm text-ink/70">🛡️ {doc.path.sovereignty}</p>
        <a href={SAP_READINESS_CHECK} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-semibold text-brand underline">
          🔍 SAP Readiness Check ↗
        </a>
      </Section>

      {/* 8 — The concrete next step */}
      <Section n={8} title="The concrete next step" summary={doc.nextStep.summary}>
        <Bullets items={doc.nextStep.whatYouGet} marker="✓" />
        <a href={`/book/${code}`} className="btn-primary mt-4 inline-block print:hidden">
          📅 Book your EvoKit session →
        </a>
      </Section>

      <p className="px-1 text-center text-xs text-ink/40">
        {source === "ai" ? "Synthesised by AI from your team's own input · " : ""}
        Generated by the Cloud Readiness Challenge · {new Date(data.generatedAt).toLocaleString()} · A starting read, not a
        substitute for{" "}
        <a href={SAP_READINESS_CHECK} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline">
          SAP&apos;s official Readiness Check ↗
        </a>
        .
      </p>
    </Screen>
  );
}

function Section({
  n,
  title,
  summary,
  accent,
  children,
}: {
  n: number;
  title: string;
  summary: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 font-display text-sm font-bold uppercase tracking-wide text-ink/45">
        {n}. {title}
      </h2>
      <div className={`card p-5 ${accent ? "border-brand/20" : ""}`} style={accent ? { boxShadow: "inset 0 0 0 2px rgba(43,212,168,0.18)" } : undefined}>
        {summary && <p className="text-sm text-ink/70">{summary}</p>}
        {children}
      </div>
    </section>
  );
}

function Bullets({ items, marker = "•" }: { items: string[]; marker?: string }) {
  if (!items.length) return null;
  return (
    <ul className="mt-2 space-y-1.5 text-sm text-ink/75">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2">
          <span className="select-none text-ink/30">{marker}</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Dot({ delay }: { delay: string }) {
  return <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-brand" style={{ animationDelay: delay }} />;
}
