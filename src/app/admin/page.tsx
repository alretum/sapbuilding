"use client";

import { useCallback, useEffect, useState } from "react";
import type { Content } from "@/lib/content-schema";
import { Button, Card, Screen } from "@/components/ui";

// SAP-facing setup. SAP creates a challenge per company; employees then join
// with the code. Lightly gated by an admin key (only enforced if ADMIN_KEY is
// set on the server). Not part of the employee-facing app.

type SessionRow = {
  id: string;
  code: string;
  name: string;
  involvedRoles: string[];
  players: number;
  createdAt: string;
};

const ADMIN_KEY_STORAGE = "crc:adminKey";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [content, setContent] = useState<Content | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    setAdminKey(localStorage.getItem(ADMIN_KEY_STORAGE) ?? "");
    fetch("/api/content").then((r) => r.json()).then(setContent);
  }, []);

  const headers = useCallback(
    (extra: Record<string, string> = {}) => ({ ...extra, ...(adminKey ? { "x-admin-key": adminKey } : {}) }),
    [adminKey],
  );

  const refresh = useCallback(async () => {
    const res = await fetch("/api/sessions", { headers: headers() });
    if (res.status === 401) {
      setUnauthorized(true);
      setSessions([]);
      return;
    }
    setUnauthorized(false);
    const data = await res.json();
    setSessions(data.sessions ?? []);
  }, [headers]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function saveKey(v: string) {
    setAdminKey(v);
    localStorage.setItem(ADMIN_KEY_STORAGE, v);
  }

  return (
    <Screen className="space-y-5">
      <header className="space-y-1 pt-2">
        <h1 className="text-xl font-extrabold">SAP Admin · Company challenges</h1>
        <p className="text-sm text-ink/60">Set up a challenge for a company. Employees join with the code.</p>
      </header>

      <Card className="space-y-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Admin key</span>
          <input
            value={adminKey}
            onChange={(e) => saveKey(e.target.value)}
            placeholder="Only needed if the server has ADMIN_KEY set"
            className="w-full rounded-2xl border border-black/10 px-4 py-3"
            type="password"
          />
        </label>
        {unauthorized && <p className="text-sm text-red-600">Invalid admin key.</p>}
      </Card>

      <CreateForm content={content} headers={headers} onCreated={refresh} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-ink/60">Existing challenges</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-ink/40">None yet.</p>
        ) : (
          sessions.map((s) => (
            <Card key={s.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{s.name}</p>
                <p className="text-xs text-ink/50">
                  {s.players} player{s.players === 1 ? "" : "s"} · {s.involvedRoles.length} departments
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-lg bg-brand/10 px-3 py-1 font-mono text-sm font-bold tracking-widest text-brand">
                  {s.code}
                </span>
                <a className="text-sm text-brand underline" href={`/dashboard?session=${s.id}`}>
                  dashboard
                </a>
              </div>
            </Card>
          ))
        )}
      </section>
    </Screen>
  );
}

function CreateForm({
  content,
  headers,
  onCreated,
}: {
  content: Content | null;
  headers: (extra?: Record<string, string>) => Record<string, string>;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [roleIds, setRoleIds] = useState<string[] | null>(null); // null = all
  const [strictGate, setStrictGate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; code: string } | null>(null);

  const allRoleIds = content?.roles.map((r) => r.id) ?? [];
  const selected = roleIds ?? allRoleIds;

  function toggleRole(id: string) {
    const base = roleIds ?? allRoleIds;
    setRoleIds(base.includes(id) ? base.filter((r) => r !== id) : [...base, id]);
  }

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name: name.trim(), involvedRoles: selected, strictGate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error === "unauthorized" ? "Invalid admin key." : data.error ?? "Failed");
      setCreated(data);
      setName("");
      setRoleIds(null);
      onCreated();
    } catch (e) {
      setError(e instanceof TypeError ? "Couldn't reach the server." : (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4">
      <h2 className="font-bold">New company challenge</h2>

      {created && (
        <div className="rounded-2xl bg-brand/5 p-4 text-center">
          <p className="text-xs text-ink/60">Created! Share this join code:</p>
          <p className="text-3xl font-extrabold tracking-widest text-brand">{created.code}</p>
          <a className="text-sm text-brand underline" href={`/dashboard?session=${created.id}`}>
            open live dashboard →
          </a>
        </div>
      )}

      <label className="block space-y-1">
        <span className="text-sm font-medium">Company name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. ACME GmbH"
          className="w-full rounded-2xl border border-black/10 px-4 py-3"
        />
      </label>

      <div className="space-y-1">
        <span className="text-sm font-medium">Participating departments</span>
        <div className="grid grid-cols-2 gap-2">
          {content?.roles.map((r) => {
            const on = selected.includes(r.id);
            return (
              <button
                key={r.id}
                onClick={() => toggleRole(r.id)}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm ${
                  on ? "border-brand bg-brand/5" : "border-black/10 opacity-60"
                }`}
              >
                <span className="text-lg">{r.avatar}</span>
                <span className="leading-tight">{r.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={strictGate} onChange={(e) => setStrictGate(e.target.checked)} />
        Strict gate (readiness capped until every department has started)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button className="w-full" disabled={!name.trim() || selected.length === 0 || busy} onClick={create}>
        {busy ? "Creating…" : "Create challenge"}
      </Button>
    </Card>
  );
}
