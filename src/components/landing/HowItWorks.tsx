"use client";

import { Reveal, Section, SectionHeading } from "./primitives";

const STEPS = [
  { icon: "🎟️", title: "Join with a code", text: "No accounts, no passwords. Enter your company's code, pick your department, done." },
  { icon: "✨", title: "Play light actions", text: "A few quick quizzes, swipes and chats — two minutes each, genuinely fun." },
  { icon: "📈", title: "Watch readiness rise", text: "Points add up into a live company score. The whole org sees it climb together." },
];

export function HowItWorks() {
  return (
    <Section>
      <Reveal>
        <SectionHeading eyebrow="How it works" title="From curious to cloud-ready in minutes" />
      </Reveal>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.08}>
            <div className="card h-full p-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-3xl">{s.icon}</div>
              <p className="mt-3 font-display text-lg font-bold">
                <span className="text-brand">{i + 1}.</span> {s.title}
              </p>
              <p className="mt-1 text-sm text-ink/60">{s.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
