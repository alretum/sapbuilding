"use client";

import { useParams, useRouter } from "next/navigation";
import { savePlayer } from "@/lib/player";
import { JoinFlow } from "@/components/JoinFlow";
import { Screen } from "@/components/ui";

// Deep-linked join from the employee invite: the code is pre-filled, so the
// employee lands straight on department selection (the JoinFlow skips the code
// step). They can still go to / and type the code manually instead.
export default function JoinWithCodePage() {
  const code = String(useParams().code ?? "");
  const router = useRouter();
  return (
    <Screen className="space-y-6">
      <header className="space-y-1 pt-4 text-center">
        <p className="text-5xl">🚀</p>
        <h1 className="font-display text-2xl font-bold">Join the challenge</h1>
        <p className="text-sm text-ink/60">Pick your department to get started.</p>
      </header>
      <JoinFlow
        initialCode={code}
        onJoined={(p) => {
          savePlayer(p);
          router.push("/play");
        }}
      />
    </Screen>
  );
}
