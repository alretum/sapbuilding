"use client";

import { DEPARTMENTS } from "@/lib/departments";
import { DeptAvatar } from "@/components/Avatar";
import { Reveal, Section, SectionHeading } from "./primitives";

export function Departments() {
  return (
    <Section className="bg-white/40">
      <Reveal>
        <SectionHeading
          eyebrow="Everyone plays a part"
          title="Five departments, one shared score"
          subtitle="Each team gets its own role, its own actions, and its own slice of readiness. You're only fully ready when everyone joins in."
        />
      </Reveal>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DEPARTMENTS.map((d, i) => (
          <Reveal key={d.name} delay={i * 0.05}>
            <div className="card flex h-full items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-pop">
              <DeptAvatar emoji={d.emoji} color={d.color} size={48} />
              <div>
                <p className="font-display font-semibold">{d.name}</p>
                <p className="text-xs text-ink/50">{d.dept}</p>
                <p className="mt-0.5 text-sm text-ink/70">{d.line}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
