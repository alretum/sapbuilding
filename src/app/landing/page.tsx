import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Reveal, Section, SectionHeading } from "@/components/landing/primitives";
import { ProgressBar } from "@/components/ui";

export const metadata: Metadata = {
  title: "Cloud Readiness Challenge — the business case",
  description:
    "Why the move to SAP S/4HANA Cloud is lower-risk than it looks — and how a playful, all-departments challenge gets your organisation aligned and ready.",
};

// NOTE: First-draft decision-maker copy. The exact pain points, benefits and ROI
// figures will be tailored once provided — content is kept in these arrays so
// it's easy to swap.
const PAINS = [
  { icon: "⏳", title: "The 2027 clock", text: "Mainstream maintenance for SAP ECC is winding down. Waiting turns a planned move into a rushed one." },
  { icon: "🧩", title: "Custom-code sprawl", text: "Years of Z-reports and user-exits — nobody's quite sure what's still used. It feels risky to touch." },
  { icon: "🐌", title: "Yesterday's numbers", text: "Batch reporting means decisions on stale data and long, painful month-end closes." },
  { icon: "😬", title: "Change fatigue", text: "Teams have been through migrations before. “Here we go again” is the quiet reaction in the room." },
];

const BENEFITS = [
  { icon: "⚡", title: "Real-time insight", text: "In-memory processing means live operational data — not last night's batch." },
  { icon: "🔄", title: "Continuous updates", text: "Regular automatic updates replace the big, risky upgrade project every few years." },
  { icon: "🧼", title: "A clean core", text: "Extensions instead of modifications keep you upgrade-safe and lean." },
  { icon: "📉", title: "Lower TCO, future-proof", text: "Less to maintain, more to build on — and a platform that keeps getting better." },
];

const DERISK = [
  { title: "Surfaces readiness early", text: "A light pain-point check shows where you stand — before any real project starts." },
  { title: "Aligns every department", text: "Finance, IT, Production, HR and the CEO all play. Everyone sees the same shared goal." },
  { title: "Curiosity, not intimidation", text: "Two-minute quizzes and swipes make the topic approachable — even fun." },
  { title: "A genuinely low-risk first step", text: "No real data, no homework, no systems touched. Just awareness and momentum." },
];

const SAMPLE_DEPTS = [
  { name: "Finance", readiness: 78, color: "#00b5ad" },
  { name: "IT / Dev", readiness: 64, color: "#ff7a45" },
  { name: "Production", readiness: 71, color: "#27ae60" },
  { name: "HR", readiness: 52, color: "#eb5757" },
];

export default function DecisionMakerPage() {
  return (
    <main>
      <LandingNav />

      {/* Hero */}
      <Section className="pt-12 sm:pt-16">
        <Reveal className="mx-auto max-w-3xl space-y-5 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
            For CEOs, CTOs & IT leaders
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
            Migration doesn&apos;t have to be <span className="text-brand">scary</span>.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-ink/65">
            SAP ECC support is winding down by 2027. The Cloud Readiness Challenge gets your whole organisation curious,
            aligned and ready — without a single intimidating workshop.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <a href="/" className="btn-primary">
              See the employee experience →
            </a>
            <a href="/admin" className="btn-ghost">
              Set up a challenge →
            </a>
          </div>
        </Reveal>
      </Section>

      {/* The pain */}
      <Section className="bg-white/40">
        <Reveal>
          <SectionHeading eyebrow="Why now" title="The cost of waiting is quiet — until it isn't" />
        </Reveal>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {PAINS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.05}>
              <div className="card flex h-full items-start gap-3 p-5">
                <span className="text-3xl">{p.icon}</span>
                <div>
                  <p className="font-display font-bold">{p.title}</p>
                  <p className="text-sm text-ink/65">{p.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* The upside */}
      <Section>
        <Reveal>
          <SectionHeading
            eyebrow="The upside"
            title="What the cloud actually buys you"
            subtitle="Not a like-for-like swap — a step change in how the business runs."
          />
        </Reveal>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.05}>
              <div className="card h-full p-5 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-2xl">{b.icon}</div>
                <p className="mt-2 font-display font-bold">{b.title}</p>
                <p className="mt-1 text-sm text-ink/60">{b.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* How the challenge de-risks it + dashboard preview */}
      <Section className="bg-white/40">
        <Reveal>
          <SectionHeading eyebrow="The first step" title="How the challenge de-risks the whole thing" />
        </Reveal>
        <div className="mt-8 grid items-center gap-6 md:grid-cols-2">
          <div className="space-y-3">
            {DERISK.map((d, i) => (
              <Reveal key={d.title} delay={i * 0.05}>
                <div className="card flex items-start gap-3 p-4">
                  <span className="mt-0.5 text-brand">✓</span>
                  <div>
                    <p className="font-display font-semibold">{d.title}</p>
                    <p className="text-sm text-ink/65">{d.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Illustrative leader's dashboard */}
          <Reveal delay={0.1}>
            <div className="card p-6">
              <p className="text-center text-xs font-bold uppercase tracking-widest text-ink/45">What you see as a leader</p>
              <div className="my-4 flex flex-col items-center gap-1">
                <div
                  className="grid h-32 w-32 place-items-center rounded-full"
                  style={{ background: "conic-gradient(#6d5df6 240deg, #2bd4a8 240deg, rgba(22,26,62,0.06) 0deg)" }}
                >
                  <div className="grid h-24 w-24 place-items-center rounded-full bg-white">
                    <span className="font-display text-3xl font-bold text-brand">66%</span>
                  </div>
                </div>
                <p className="text-xs text-ink/45">Company readiness (illustrative)</p>
              </div>
              <div className="space-y-2">
                {SAMPLE_DEPTS.map((d) => (
                  <div key={d.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{d.name}</span>
                      <span className="font-display font-bold" style={{ color: d.color }}>
                        {d.readiness}%
                      </span>
                    </div>
                    <ProgressBar value={d.readiness / 100} color={d.color} className="mt-1" />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <Reveal className="card mx-auto max-w-2xl p-8 text-center">
          <p className="text-4xl">🚀</p>
          <h2 className="mt-2 font-display text-3xl font-bold">Bring it to your company — free.</h2>
          <p className="mx-auto mt-2 max-w-xl text-ink/60">
            It&apos;s a team-building exercise and a first taste of the cloud, all in one. No cost, no risk, no homework.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="/admin" className="btn-primary">
              Set up a challenge →
            </a>
            <a href="/" className="btn-ghost">
              Try the experience →
            </a>
          </div>
        </Reveal>
      </Section>

      <Footer />
    </main>
  );
}
