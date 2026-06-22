"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Content, Role } from "@/lib/content-schema";
import { savePlayer, type StoredPlayer } from "@/lib/player";
import { Button, Card, Screen } from "@/components/ui";
import { DeptAvatar } from "@/components/Avatar";

export default function HomePage() {
  const router = useRouter();
  const [content, setContent] = useState<Content | null>(null);

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then(setContent)
      .catch(() => setContent(null));
  }, []);

  return (
    <Screen className="space-y-6">
      <header className="space-y-1 pt-4 text-center">
        <p className="text-5xl">🚀</p>
        <h1 className="font-display text-2xl font-bold">Cloud Readiness Challenge</h1>
        <p className="text-sm text-ink/60">
          Got a join code? Enter it to join your company&apos;s challenge.
        </p>
      </header>

      <JoinFlow
        content={content}
        onJoined={(p) => {
          savePlayer(p);
          router.push("/play");
        }}
      />

      <div className="flex flex-col items-center gap-1.5 text-sm font-semibold text-brand">
        <a href="/map" className="underline">
          🗺️ Explore the readiness map
        </a>
        <a href="/leaderboard" className="underline">
          🏆 Browse the company leaderboard
        </a>
      </div>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Login flow: enter code → pick role → pick your name (or add a new one).
// No passwords, no credentials. A "player" is just a name in a role.
// Companies are set up by SAP (see /admin); employees only ever join here.
// ---------------------------------------------------------------------------

type Step = "code" | "role" | "name";
type ExistingPlayer = { id: string; name: string; roleId: string };

function JoinFlow({
  content,
  onJoined,
}: {
  content: Content | null;
  onJoined: (p: StoredPlayer) => void;
}) {
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [session, setSession] = useState<{ id: string; code: string; name: string } | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [roster, setRoster] = useState<ExistingPlayer[]>([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function friendlyError(e: unknown, fallback: string) {
    if (e instanceof TypeError) return "Couldn't reach the server. Is it running?";
    return (e as Error).message || fallback;
  }

  async function checkCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${code.trim().toUpperCase()}/players`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Session not found");
      setSession({ id: data.sessionId, code: data.code, name: data.name });
      setStep("role");
    } catch (e) {
      setError(friendlyError(e, "Session not found"));
    } finally {
      setBusy(false);
    }
  }

  async function pickRole(r: Role) {
    setRole(r);
    setError(null);
    // Load existing players in this role so returning users can pick themselves.
    const res = await fetch(`/api/sessions/${code.trim().toUpperCase()}/players?roleId=${r.id}`);
    const data = await res.json();
    setRoster(res.ok ? (data.players as ExistingPlayer[]) : []);
    setStep("name");
  }

  function resume(p: ExistingPlayer) {
    if (!session || !role) return;
    onJoined({ sessionId: session.id, code: session.code, playerId: p.id, roleId: role.id, name: p.name });
  }

  async function createNew() {
    if (!session || !role || !newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: session.code, name: newName.trim(), roleId: role.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not join");
      onJoined({
        sessionId: data.sessionId,
        code: data.code,
        playerId: data.playerId,
        roleId: data.roleId,
        name: newName.trim(),
        avatar: data.avatar,
      });
    } catch (e) {
      setError(friendlyError(e, "Could not join"));
    } finally {
      setBusy(false);
    }
  }

  // --- Step 1: session code ---
  if (step === "code") {
    return (
      <Card className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Session code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && code && checkCode()}
            placeholder="e.g. K7Q2M"
            className="w-full rounded-2xl border border-black/10 px-4 py-3 text-center text-lg tracking-[0.3em]"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={!code || busy} onClick={checkCode}>
          {busy ? "Checking…" : "Continue →"}
        </Button>
        <p className="text-center text-xs text-ink/40">
          Your code comes from whoever set up your company&apos;s challenge.
        </p>
      </Card>
    );
  }

  // --- Step 2: role ---
  if (step === "role") {
    return (
      <Card className="space-y-4">
        <StepHeader title={`Pick your department · ${session?.name ?? ""}`} onBack={() => setStep("code")} />
        <div className="grid grid-cols-2 gap-2">
          {content?.roles.map((r) => (
            <button
              key={r.id}
              onClick={() => pickRole(r)}
              className="flex flex-col items-start gap-2 rounded-2xl border border-black/10 p-3 text-left transition hover:-translate-y-0.5 hover:border-brand hover:shadow-pop"
            >
              <DeptAvatar emoji={r.avatar} color={r.color} size={40} />
              <span className="font-display text-sm font-semibold leading-tight">{r.name}</span>
              <span className="text-[11px] text-ink/50">{r.department}</span>
            </button>
          ))}
        </div>
      </Card>
    );
  }

  // --- Step 3: name (pick existing or add new) ---
  return (
    <Card className="space-y-4">
      <StepHeader
        title={
          <span className="flex items-center gap-2">
            <span className="text-xl">{role?.avatar}</span> Who are you?
          </span>
        }
        onBack={() => setStep("role")}
      />

      {roster.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-ink/50">Tap your name to continue:</p>
          <div className="flex flex-wrap gap-2">
            {roster.map((p) => (
              <button
                key={p.id}
                onClick={() => resume(p)}
                className="rounded-full border border-black/10 bg-black/5 px-4 py-2 text-sm font-medium hover:border-brand"
              >
                {p.name}
              </button>
            ))}
          </div>
          <p className="pt-1 text-xs text-ink/40">…or add yourself below.</p>
        </div>
      )}

      <div className="space-y-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && newName.trim() && createNew()}
          placeholder="New here? Type your name"
          className="w-full rounded-2xl border border-black/10 px-4 py-3"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={!newName.trim() || busy} onClick={createNew}>
          {busy ? "Joining…" : "Join as new player →"}
        </Button>
      </div>
    </Card>
  );
}

function StepHeader({ title, onBack }: { title: React.ReactNode; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onBack} className="text-ink/40 hover:text-ink" aria-label="Back">
        ←
      </button>
      <h2 className="font-display font-bold">{title}</h2>
    </div>
  );
}
