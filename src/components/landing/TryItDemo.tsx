"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DEMO_ACTIONS, DEMO_MAX_POINTS } from "@/lib/demo-actions";
import { celebrateBig, celebrateSmall } from "@/lib/celebrate";
import { haptic } from "@/lib/haptics";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ActionRenderer } from "@/components/actions/ActionRenderer";
import { Button, ProgressBar } from "@/components/ui";
import { Reveal, Section, SectionHeading } from "./primitives";

type Phase = "action" | "between" | "done";

function scrollToJoin() {
  document.getElementById("join")?.scrollIntoView({ behavior: "smooth" });
}

export function TryItDemo() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("action");
  const [earned, setEarned] = useState(0);
  const [burst, setBurst] = useState<number | null>(null);

  const action = DEMO_ACTIONS[index];
  const readiness = Math.round((earned / DEMO_MAX_POINTS) * 100);
  const isLast = index === DEMO_ACTIONS.length - 1;

  function complete(points: number) {
    setEarned((e) => e + points);
    setBurst(points);
    haptic([12, 30, 12]);
    if (isLast) {
      celebrateBig();
      setPhase("done");
    } else {
      celebrateSmall();
      setPhase("between");
    }
    setTimeout(() => setBurst(null), 1500);
  }

  function next() {
    setIndex((i) => Math.min(i + 1, DEMO_ACTIONS.length - 1));
    setPhase("action");
  }

  return (
    <Section id="try" className="scroll-mt-16">
      <Reveal>
        <SectionHeading
          eyebrow="Try it — no login needed"
          title="Answer one thing. Feel the points land."
          subtitle="This is exactly what your team plays with. Go on — it's just a taste (the points aren't real… the confetti is)."
        />
      </Reveal>

      <Reveal delay={0.05} className="mt-8">
        <div className="grid items-stretch gap-4 md:grid-cols-[1.3fr_1fr]">
          {/* Left: the live action */}
          <div className="card relative min-h-[320px] p-5">
            <AnimatePresence mode="wait">
              {phase === "action" && (
                <motion.div
                  key={`action-${action.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <div className="mb-3">
                    <h3 className="font-display font-bold">{action.title}</h3>
                    {action.subtitle && <p className="text-xs text-ink/50">{action.subtitle}</p>}
                  </div>
                  <ActionRenderer action={action} onComplete={(r) => complete(r.score)} />
                </motion.div>
              )}

              {phase === "between" && (
                <motion.div
                  key="between"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center"
                >
                  <p className="text-5xl">🎉</p>
                  <p className="font-display text-xl font-bold">Nice — points landed!</p>
                  <p className="text-sm text-ink/60">Want to keep going, or play for real with your team?</p>
                  <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
                    <Button onClick={next}>Try another →</Button>
                    <Button variant="ghost" onClick={scrollToJoin}>
                      I&apos;m in — join with a code
                    </Button>
                  </div>
                </motion.div>
              )}

              {phase === "done" && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center"
                >
                  <p className="text-5xl">🚀</p>
                  <p className="font-display text-xl font-bold">You&apos;ve got the idea!</p>
                  <p className="text-sm text-ink/60">
                    Real preparation happens when your whole team plays together. Each department adds its part.
                  </p>
                  <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
                    <Button onClick={scrollToJoin}>Get your code → join</Button>
                    <a href="/landing" className="btn-ghost">
                      See the business case →
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reward burst */}
            <AnimatePresence>
              {burst !== null && (
                <motion.div
                  className="pointer-events-none absolute inset-0 grid place-items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    initial={{ scale: 0.6, y: 16 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="rounded-3xl bg-white/95 px-8 py-5 text-center shadow-pop"
                  >
                    <p className="font-display text-3xl font-extrabold text-brand">
                      +<AnimatedNumber value={burst} duration={800} />
                    </p>
                    <p className="text-xs font-semibold text-ink/50">preparation points</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: live readiness meter */}
          <div className="card flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-ink/45">Your demo preparation</p>
            <div
              className="grid h-36 w-36 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#6d5df6 ${readiness * 3.6}deg, #2bd4a8 ${readiness * 3.6}deg, rgba(22,26,62,0.06) 0deg)`,
              }}
            >
              <div className="grid h-28 w-28 place-items-center rounded-full bg-white">
                <AnimatedNumber value={readiness} suffix="%" className="font-display text-3xl font-bold text-brand" />
              </div>
            </div>
            <ProgressBar value={earned / DEMO_MAX_POINTS} color="#6d5df6" className="w-full" />
            <p className="text-sm text-ink/60">
              <span className="font-display font-bold text-ink">{earned}</span> of {DEMO_MAX_POINTS} demo points
            </p>
            <p className="text-xs text-ink/40">In the real game, this is your whole company&apos;s score.</p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
