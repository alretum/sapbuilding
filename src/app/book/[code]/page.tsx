"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button, Card, Screen } from "@/components/ui";

// EvoKit booking stub. No real scheduling — the point is that the journey ends
// in a concrete next step (and a brief that travels to the expert).
export default function BookPage() {
  const code = String(useParams().code ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [when, setWhen] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <Screen className="space-y-5">
        <Card className="space-y-3 p-8 text-center">
          <p className="text-5xl">🎉</p>
          <h1 className="font-display text-2xl font-bold">Session requested!</h1>
          <p className="text-sm text-ink/60">
            An SAP expert will reach out to confirm. They&apos;ll arrive already briefed — here&apos;s exactly what
            they&apos;ll see:
          </p>
          <a href={`/brief/${code}`} className="btn-primary">
            📄 Open your pre-filled expert brief →
          </a>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen className="space-y-5">
      <header className="space-y-1 pt-4 text-center">
        <p className="text-4xl">📅</p>
        <h1 className="font-display text-2xl font-bold">Book your EvoKit session</h1>
        <p className="text-sm text-ink/60">
          A focused working session with an SAP expert — starting from your results, not a blank page.
        </p>
      </header>

      <Card className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Your name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-black/10 px-4 py-3" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Work email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-2xl border border-black/10 px-4 py-3" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Preferred time</span>
          <input value={when} onChange={(e) => setWhen(e.target.value)} placeholder="e.g. next week, Tue afternoon" className="w-full rounded-2xl border border-black/10 px-4 py-3" />
        </label>
        <Button className="w-full" disabled={!name.trim() || !email.trim()} onClick={() => setDone(true)}>
          Request my session →
        </Button>
        <p className="text-center text-xs text-ink/40">Demo — nothing is sent or stored; this is a stub.</p>
      </Card>
    </Screen>
  );
}
