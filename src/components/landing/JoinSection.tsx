"use client";

import { useRouter } from "next/navigation";
import { savePlayer } from "@/lib/player";
import { JoinFlow } from "@/components/JoinFlow";
import { Reveal, Section, SectionHeading } from "./primitives";

export function JoinSection() {
  const router = useRouter();
  return (
    <Section id="join" className="scroll-mt-16">
      <Reveal>
        <SectionHeading
          eyebrow="Ready to play?"
          title="Got a code? Jump in."
          subtitle="No account needed. Pick your department, pick your name, and you're in."
        />
      </Reveal>
      <Reveal delay={0.05} className="mx-auto mt-8 w-full max-w-md">
        <JoinFlow
          onJoined={(p) => {
            savePlayer(p);
            router.push("/play");
          }}
        />
        <p className="mt-4 text-center text-sm text-ink/50">
          No code yet?{" "}
          <a href="/landing" className="font-semibold text-brand underline">
            See how to bring it to your company →
          </a>
        </p>
      </Reveal>
    </Section>
  );
}
