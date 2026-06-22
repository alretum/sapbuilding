"use client";

import { motion } from "framer-motion";
import { DEPARTMENTS } from "@/lib/departments";
import { DeptAvatar } from "@/components/Avatar";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Button } from "@/components/ui";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function Hero() {
  return (
    <section className="px-4 pb-8 pt-12 sm:pt-16">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5 text-center md:text-left"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
            🇩🇪 The Germany-wide cloud challenge
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
            Is your company <span className="text-brand">cloud-ready</span>? Find out — together.
          </h1>
          <p className="mx-auto max-w-md text-lg text-ink/65 md:mx-0">
            A playful, all-departments challenge that turns the move to SAP S/4HANA Cloud from scary to fun. Quizzes,
            swipes, confetti — and one readiness score your whole company builds together.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
            <Button onClick={() => scrollTo("try")}>Try it — no login ↓</Button>
            <Button variant="ghost" onClick={() => scrollTo("join")}>
              Have a code? Join ↓
            </Button>
          </div>
        </motion.div>

        {/* Visual: floating department avatars around a readiness badge */}
        <div className="relative mx-auto grid h-72 w-72 place-items-center sm:h-80 sm:w-80">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 140, damping: 16 }}
            className="card grid h-40 w-40 place-items-center rounded-full p-4 text-center"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink/45">Readiness</p>
              <AnimatedNumber value={87} suffix="%" duration={1400} className="font-display text-4xl font-bold text-brand" />
            </div>
          </motion.div>

          {DEPARTMENTS.map((d, i) => {
            const angle = (i / DEPARTMENTS.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 130;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return (
              <motion.div
                key={d.name}
                className="absolute"
                style={{ left: "50%", top: "50%" }}
                initial={{ opacity: 0, x: x * 0.4 - 22, y: y * 0.4 - 22 }}
                animate={{ opacity: 1, x: x - 22, y: y - 22 }}
                transition={{ delay: 0.3 + i * 0.07, type: "spring", stiffness: 120, damping: 14 }}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <DeptAvatar emoji={d.emoji} color={d.color} size={44} />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
