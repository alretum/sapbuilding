"use client";

import { useEffect, useState } from "react";
import type { Content, Role } from "@/lib/content-schema";
import type { StoredPlayer } from "@/lib/player";
import { Button, Card } from "@/components/ui";
import { DeptAvatar } from "@/components/Avatar";

// The no-credentials join: enter code → pick department → pick your name (or add
// a new one). Self-contained (fetches its own content). Reused by the landing
// page's join section.
type Step = "code" | "role" | "name";
type ExistingPlayer = { id: string; name: string; roleId: string };

export function JoinFlow({
  onJoined,
  initialCode,
}: {
  onJoined: (p: StoredPlayer) => void;
  initialCode?: string;
}) {
  const [content, setContent] = useState<Content | null>(null);
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [session, setSession] = useState<{ id: string; code: string; name: string } | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [roster, setRoster] = useState<ExistingPlayer[]>([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [autoTried, setAutoTried] = useState(false);

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then(setContent)
      .catch(() => setContent(null));
  }, []);

  // Deep-link from the employee invite: pre-fill the code and skip the code step.
  useEffect(() => {
    if (initialCode && !autoTried) {
      setAutoTried(true);
      setCode(initialCode.toUpperCase());
      checkCode(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode, autoTried]);

  function friendlyError(e: unknown, fallback: string) {
    if (e instanceof TypeError) return "Couldn't reach the server. Is it running?";
    return (e as Error).message || fallback;
  }

  async function checkCode(rawCode: string = code) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${rawCode.trim().toUpperCase()}/players`);
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
        <Button className="w-full" disabled={!code || busy} onClick={() => checkCode()}>
          {busy ? "Checking…" : "Continue →"}
        </Button>
        <p className="text-center text-xs text-ink/40">
          Your code comes from whoever set up your company&apos;s challenge.
        </p>
      </Card>
    );
  }

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
        <p className="text-center text-xs text-ink/40">
          We only store your first name — no accounts, no email, no tracking.
        </p>
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
