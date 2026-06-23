import { prisma } from "@/lib/prisma";
import { getContent } from "@/lib/content";
import { buildBrief } from "@/lib/brief";
import { PersonalizedRead } from "@/components/PersonalizedRead";
import { PrintButton } from "@/components/PrintButton";
import { NavButton, Screen } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BriefPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await prisma.session.findUnique({
    where: { code: code.toUpperCase() },
    include: { players: true, completions: true },
  });

  if (!session) {
    return (
      <Screen>
        <p className="py-20 text-center text-ink/50">No challenge found for that code.</p>
      </Screen>
    );
  }

  const brief = buildBrief(session, getContent());
  const c = brief.company;
  const profileChips = [c.industry, c.country, c.sapVersion, c.companySize, c.dataSensitivity].filter(Boolean);

  return (
    <main className="mx-auto w-full max-w-[95%] px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between print:hidden">
        <NavButton href={`/dashboard?session=${session.id}`}>← Back</NavButton>
        <PrintButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Column 1: Header / Overview */}
        <section className="space-y-4">
          <div className="card p-6 text-center space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-ink/45">📋 Challenge brief</p>
            <h1 className="font-display text-2xl font-bold leading-tight">{c.name}</h1>
            
            <div className="text-left space-y-2 border-t border-ink/5 pt-4">
              {c.industry && <div className="flex items-center gap-2 text-sm text-ink/70"><span>💼</span> <span>{c.industry}</span></div>}
              {c.country && <div className="flex items-center gap-2 text-sm text-ink/70"><span>🌍</span> <span>{c.country}</span></div>}
              {c.sapVersion && <div className="flex items-center gap-2 text-sm text-ink/70"><span>⚙️</span> <span>{c.sapVersion}</span></div>}
              {c.companySize && <div className="flex items-center gap-2 text-sm text-ink/70"><span>📏</span> <span>{c.companySize}</span></div>}
              {c.dataSensitivity && <div className="flex items-center gap-2 text-sm text-ink/70"><span>🔒</span> <span>{c.dataSensitivity}</span></div>}
            </div>

            <div className="border-t border-ink/5 pt-4 space-y-2">
              <div className="rounded-2xl bg-brand/5 py-3">
                <span className="font-display text-4xl font-extrabold text-brand">{brief.preparationScore}%</span>
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink/40">⚡ preparation score</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs text-ink/60">
                <div className="bg-ink/[0.02] p-2 rounded-xl">
                  <span className="font-bold text-ink">{brief.participants}</span>
                  <p className="text-[9px] uppercase">👥 participants</p>
                </div>
                <div className="bg-ink/[0.02] p-2 rounded-xl">
                  <span className="font-bold text-ink">{brief.departments.length}</span>
                  <p className="text-[9px] uppercase">🏢 active depts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Book EvoKit session CTA (since they clicked inside the brief page) */}
          <div className="relative overflow-hidden bg-[#161a3e] p-6 text-center text-white shadow-pop rounded-xl2 border border-[#6d5df6]/30 print:hidden">
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#6d5df6]/15 blur-2xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-[#ffb23e]/10 blur-2xl pointer-events-none" />
            
            <div className="relative space-y-4">
              <p className="text-3xl animate-bounce">📅</p>
              <h2 className="font-display text-xl font-bold text-white">Book your EvoKit session</h2>
              <p className="text-xs text-white/80">
                Turn this brief into a working session with an SAP expert. They will arrive already briefed on your results.
              </p>
              <div className="pt-2">
                <a href={`/book/${code}`} className="inline-block rounded-2xl bg-white hover:bg-white/95 px-6 py-3 text-sm font-bold text-brand hover:scale-105 active:scale-95 transition shadow-sm w-full">
                  📅 Book your EvoKit session →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Column 2 & 3: Main content (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: The read */}
          <section className="space-y-3">
            <h2 className="px-1 font-display text-sm font-bold uppercase tracking-wide text-ink/45">The read</h2>
            <PersonalizedRead
              companyName={c.name}
              profile={{
                industry: c.industry,
                country: c.country,
                sapVersion: c.sapVersion,
                companySize: c.companySize,
                dataSensitivity: c.dataSensitivity,
              }}
            />
          </section>

          {/* Section 2: What the team flagged */}
          <section className="space-y-3">
            <h2 className="px-1 font-display text-sm font-bold uppercase tracking-wide text-ink/45">
              🚩 What the team flagged
            </h2>
            {brief.departments.length === 0 ? (
              <p className="px-1 text-sm text-ink/40">No actions completed yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {brief.departments.map((d) => (
                  <div key={d.name} className="card p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-display font-semibold flex items-center gap-1.5" style={{ color: d.color }}>
                        <span>{d.avatar}</span>
                        <span>{d.name}</span>
                      </p>
                      <span className="text-xs text-ink/45">
                        {d.players} player{d.players === 1 ? "" : "s"} · {d.readiness}%
                      </span>
                    </div>
                    {d.signals.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm text-ink/70">
                        {d.signals.map((s, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-brand">🔸</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-ink/40">Participated; no specific signals captured.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <p className="px-1 text-center text-xs text-ink/40">
        Generated by the Cloud Readiness Challenge · {new Date(brief.generatedAt).toLocaleString()} · This is a starting
        read, not a substitute for SAP&apos;s official Readiness Check.
      </p>
    </main>
  );
}
