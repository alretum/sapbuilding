import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Reveal, Section, SectionHeading } from "@/components/landing/primitives";
import { PeerStories } from "@/components/PeerStories";
import { ProgressBar } from "@/components/ui";
import { SAP_READINESS_CHECK, SAP_ROI_CALCULATOR } from "@/lib/sap-links";

export const metadata: Metadata = {
  title: "Cloud Readiness Challenge — the business case",
  description:
    "The pains of staying on SAP ECC are felt today; the benefits of the cloud arrive later. The Cloud Readiness Challenge closes that gap.",
};

// Decision-maker copy, grounded in customer interviews (CEP team, Jollibee, an
// SAP partner) + clustered research. Content lives in these arrays so it stays
// easy to edit.

const PAINS = [
  {
    icon: "🔍",
    title: "“I don’t see the use case”",
    text: "ECC already does everything you need today, so the value of moving feels generic and abstract — and vendor ROI decks read like marketing. One CFO refused the numbers and recomputed them himself.",
  },
  {
    icon: "📊",
    title: "No business case the board will sign",
    text: "Cost is opaque and the model shifts from capex to a consumption-based subscription with unknown payback. Cost-sensitive teams need the case before they’ll even engage.",
  },
  {
    icon: "🐔",
    title: "“We can’t afford another 2014”",
    text: "On operations-critical systems the fear is rational. One migration took a company’s supply chain down for a week — the migration phase itself is widely dreaded.",
  },
  {
    icon: "🪑",
    title: "Nobody wants to own the risk",
    text: "“Don’t change what isn’t broken.” A big, uncertain change program is career-risky, and aligning and retraining many people is a heavy human lift.",
  },
  {
    icon: "🧩",
    title: "“Will it even fit us?”",
    text: "Years of customization may not carry over — the cloud deliberately limits it, and legacy personalization is only partially portable. It’s hard to tell what survives.",
  },
  {
    icon: "🌊",
    title: "The hidden ripple",
    text: "A long, hard-to-scope project where the real surprise is everything integrated with SAP. One team’s biggest regret was starting that work two years too late.",
  },
];

const BENEFITS = [
  {
    icon: "🔌",
    title: "Stop running your own power plant",
    text: "SAP and the hyperscaler take over patches, security and infrastructure — named the single biggest benefit. Counter-intuitively, staying secure takes less effort: no manual patching.",
  },
  {
    icon: "🤖",
    title: "AI that only lives in the cloud",
    text: "Joule, Business AI and agents are cloud-only — the strongest pull in the research. For one customer, SAP’s AI direction was the deciding factor to move.",
  },
  {
    icon: "⚡",
    title: "Innovation that arrives instantly",
    text: "Centralized updates land immediately, versus a ~2-year develop-install-feedback loop on-premise — in a market that now moves 10–50× faster.",
  },
  {
    icon: "📉",
    title: "Cheaper than standing still",
    text: "Total cost of ownership is lower than the cost of doing nothing — mounting technical debt plus rising legacy support fees. One company did the math and found staying was the expensive option.",
  },
  {
    icon: "✨",
    title: "A UX people actually like",
    text: "Modern Fiori, best-practice processes and faster batch jobs free staff to focus on customers. A team forced back to on-premise after an acquisition simply hated it.",
  },
  {
    icon: "🧼",
    title: "Build around a clean core",
    text: "Keep core ERP standard and add value-adding pieces around SAP via integration platforms — scalable and AI-ready, not locked in.",
  },
];

const DERISK = [
  {
    title: "Makes the value concrete and yours",
    text: "A light pain-point check in your team’s own language — not a generic deck. The benefits stop being abstract.",
  },
  {
    title: "Builds the case from the inside",
    text: "Surfaces where you actually stand, so your champion has evidence — not vendor slides — to take to the board.",
  },
  {
    title: "A genuinely safe first step",
    text: "No real data, no systems touched, no homework. Awareness and momentum, not a migration.",
  },
  {
    title: "Gets everyone aligned early",
    text: "Every department plays, so the human lift begins as curiosity instead of a top-down mandate.",
  },
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
            For CEOs, CTOs, CFOs &amp; IT leaders
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
            Migration doesn&apos;t have to be <span className="text-brand">scary</span>.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-ink/65">
            The pains of staying on SAP ECC are concrete and felt <strong className="text-ink">today</strong>. The
            benefits of the cloud feel abstract and far away. The Cloud Readiness Challenge closes that gap — making the
            upside specific and personal for every department, before you commit to anything.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <a href="/admin" className="btn-primary">
              Set up a challenge →
            </a>
            <a href="/" className="btn-ghost">
              See the employee experience →
            </a>
          </div>
        </Reveal>
      </Section>

      {/* The pains — felt now */}
      <Section className="bg-white/40">
        <Reveal>
          <SectionHeading
            eyebrow="Felt now — and concrete"
            title="The pains are real, and they’re today"
            subtitle="Straight from customer interviews: what actually blocks the move."
          />
        </Reveal>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PAINS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.04}>
              <div className="card h-full p-5">
                <div className="text-3xl">{p.icon}</div>
                <p className="mt-2 font-display font-bold">{p.title}</p>
                <p className="mt-1 text-sm text-ink/65">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* The asymmetry band */}
      <Section>
        <Reveal>
          <div className="card mx-auto max-w-3xl bg-gradient-to-br from-brand to-brand-dark p-8 text-center text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">The reason companies stall</p>
            <p className="mt-3 font-display text-2xl font-bold leading-snug sm:text-3xl">
              Every pain above is felt <span className="underline decoration-white/40">now</span>. Every benefit below is
              real — but it arrives <span className="underline decoration-white/40">later</span>.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              That asymmetry is exactly why the move keeps getting postponed. The challenge&apos;s whole job is to make
              the payoff as specific and present as the pain — so your teams feel the upside before the project even
              starts.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* The upside — arrives later */}
      <Section className="bg-white/40">
        <Reveal>
          <SectionHeading
            eyebrow="The payoff — worth the move"
            title="What the cloud actually buys you"
            subtitle="Not a like-for-like swap — a step change in how the business runs."
          />
        </Reveal>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.04}>
              <div className="card h-full p-5">
                <div className="text-3xl">{b.icon}</div>
                <p className="mt-2 font-display font-bold">{b.title}</p>
                <p className="mt-1 text-sm text-ink/65">{b.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* How the challenge closes the gap + dashboard preview */}
      <Section>
        <Reveal>
          <SectionHeading eyebrow="The first step" title="How the challenge makes the payoff feel present" />
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
              <p className="text-center text-xs font-bold uppercase tracking-widest text-ink/45">
                What you see as a leader
              </p>
              <div className="my-4 flex flex-col items-center gap-1">
                <div
                  className="grid h-32 w-32 place-items-center rounded-full"
                  style={{ background: "conic-gradient(#6d5df6 240deg, #2bd4a8 240deg, rgba(22,26,62,0.06) 0deg)" }}
                >
                  <div className="grid h-24 w-24 place-items-center rounded-full bg-white">
                    <span className="font-display text-3xl font-bold text-brand">66%</span>
                  </div>
                </div>
                <p className="text-xs text-ink/45">Company preparation (illustrative)</p>
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

      {/* Peer voices */}
      <Section>
        <Reveal>
          <SectionHeading eyebrow="From those who've done it" title="Peers who already made the move" />
        </Reveal>
        <Reveal delay={0.05} className="mx-auto mt-8 max-w-2xl">
          <PeerStories limit={2} />
        </Reveal>
      </Section>

      {/* Honesty posture */}
      <Section className="bg-white/40">
        <Reveal className="mx-auto max-w-3xl space-y-3 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Our promise</p>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">We won&apos;t pretend the move is trivial.</h2>
          <p className="text-ink/65">
            Migration is real work, and the cloud genuinely limits some customization — we&apos;ll tell you that
            honestly. This isn&apos;t a sales funnel dressed as a game: no fabricated ROI numbers, no &ldquo;you&apos;re
            100% ready&rdquo; theatre. If now isn&apos;t your moment, we&apos;ll say so. An honest read is the whole
            point.
          </p>
          <p className="text-sm text-ink/55">
            When you want the rigorous versions, they live with SAP:{" "}
            <a
              href={SAP_READINESS_CHECK}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand underline"
            >
              the Readiness Check
            </a>{" "}
            (your real technical readiness) and{" "}
            <a
              href={SAP_ROI_CALCULATOR}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand underline"
            >
              the ROI calculator
            </a>{" "}
            (your real numbers).
          </p>
        </Reveal>
      </Section>

      {/* CTA */}
      <Section>
        <Reveal className="card mx-auto max-w-2xl p-8 text-center">
          <p className="text-4xl">🚀</p>
          <h2 className="mt-2 font-display text-3xl font-bold">Bring it to your company — free.</h2>
          <p className="mx-auto mt-2 max-w-xl text-ink/60">
            It&apos;s a team-building exercise and a first taste of the cloud, all in one. No cost, no risk, no homework —
            just your teams discovering the upside for themselves.
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
