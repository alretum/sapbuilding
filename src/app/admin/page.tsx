"use client";

import { useCallback, useEffect, useState } from "react";
import type { Content } from "@/lib/content-schema";
import { CITIES, REGIONS } from "@/lib/germany";
import {
  COMPANY_SIZES,
  COUNTRIES,
  DATA_SENSITIVITY,
  INDUSTRIES,
  SAP_VERSIONS,
  type CompanyProfile,
} from "@/lib/profile";
import { KNOWN_COMPANIES } from "@/lib/known-companies";
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
          sessions.map((s) => <SessionCard key={s.id} session={s} headers={headers} onDeleted={refresh} />)
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
  const [leaderboardPublic, setLeaderboardPublic] = useState(false);
  const [regionCode, setRegionCode] = useState("");
  const [cityName, setCityName] = useState("");
  const [profile, setProfile] = useState<CompanyProfile>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; code: string; profileToken: string } | null>(null);

  const allRoleIds = content?.roles.map((r) => r.id) ?? [];
  const selected = roleIds ?? allRoleIds;
  const regionCities = CITIES.filter((c) => c.regionCode === regionCode);
  const selectedCity = regionCities.find((c) => c.name === cityName);

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
        body: JSON.stringify({
          name: name.trim(),
          involvedRoles: selected,
          strictGate,
          leaderboardPublic,
          regionCode: regionCode || undefined,
          city: selectedCity?.name,
          lat: selectedCity?.lat,
          lng: selectedCity?.lng,
          ...profile,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error === "unauthorized" ? "Invalid admin key." : data.error ?? "Failed");
      setCreated(data);
      setName("");
      setRoleIds(null);
      setLeaderboardPublic(false);
      setRegionCode("");
      setCityName("");
      setProfile({});
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
        <div className="space-y-3">
          <div className="rounded-2xl bg-brand/5 p-4 text-center">
            <p className="text-xs text-ink/60">Created! Employees join with this code:</p>
            <p className="text-3xl font-extrabold tracking-widest text-brand">{created.code}</p>
            <a className="text-sm text-brand underline" href={`/dashboard?session=${created.id}`}>
              open live dashboard →
            </a>
          </div>

          {/* Employee invite — the simulated email that gets the team playing */}
          <div className="rounded-2xl border border-black/10 p-4 text-center">
            <p className="text-sm font-semibold">Employee invite</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-ink/55">
              The email your departments receive. The link drops them straight into joining (code pre-filled), or they
              can type the code.
            </p>
            <a
              href={`/invite/${created.code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost mt-3 inline-flex text-sm"
            >
              📧 Open the employee invite email →
            </a>
          </div>

          {/* Decision-maker invite — opens the simulated email, which leads to /welcome */}
          <div className="rounded-2xl border border-black/10 p-4 text-center">
            <p className="text-sm font-semibold">Decision-maker invite</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-ink/55">
              We&apos;ve pre-filled this company&apos;s profile. Open the email they&apos;d receive and click through to
              their personalized cloud-path read.
            </p>
            <a
              href={`/email/${created.profileToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-3 inline-flex text-sm"
            >
              📧 Open the decision-maker&apos;s email →
            </a>
            <p className="break-all pt-2 text-[11px] text-ink/40">Email link: /email/{created.profileToken}</p>
          </div>
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

      {/* Company profile (powers the decision-maker's personalized read) */}
      <div className="space-y-3 rounded-2xl bg-black/[0.02] p-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Pre-fill from a known customer (simulates SAP CRM)</span>
          <select
            value=""
            onChange={(e) => {
              const c = KNOWN_COMPANIES.find((k) => k.name === e.target.value);
              if (c) {
                setName(c.name);
                setProfile({
                  industry: c.industry,
                  country: c.country,
                  sapVersion: c.sapVersion,
                  companySize: c.companySize,
                  dataSensitivity: c.dataSensitivity,
                });
              }
            }}
            className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm"
          >
            <option value="">— pick one to auto-fill, or enter manually —</option>
            {KNOWN_COMPANIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <ProfileSelect label="Industry" value={profile.industry} options={INDUSTRIES} onChange={(v) => setProfile((p) => ({ ...p, industry: v }))} />
          <ProfileSelect label="Country" value={profile.country} options={COUNTRIES} onChange={(v) => setProfile((p) => ({ ...p, country: v }))} />
          <ProfileSelect label="SAP version" value={profile.sapVersion} options={SAP_VERSIONS} onChange={(v) => setProfile((p) => ({ ...p, sapVersion: v }))} />
          <ProfileSelect label="Company size" value={profile.companySize} options={COMPANY_SIZES} onChange={(v) => setProfile((p) => ({ ...p, companySize: v }))} />
        </div>
        <ProfileSelect label="Data sensitivity" value={profile.dataSensitivity} options={DATA_SENSITIVITY} onChange={(v) => setProfile((p) => ({ ...p, dataSensitivity: v }))} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">Region</span>
          <select
            value={regionCode}
            onChange={(e) => {
              setRegionCode(e.target.value);
              setCityName("");
            }}
            className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm"
          >
            <option value="">— optional —</option>
            {REGIONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">City</span>
          <select
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            disabled={!regionCode}
            className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm disabled:opacity-50"
          >
            <option value="">{regionCode ? "— select —" : "pick region first"}</option>
            {regionCities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="-mt-2 text-xs text-ink/45">Location places this company on the national preparation map (if you opt in below).</p>

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
        Strict gate (preparation capped until every department has started)
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={leaderboardPublic}
          onChange={(e) => setLeaderboardPublic(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          List this company on the <b>public</b> national leaderboard &amp; map (optional). Off by default — internal
          dashboards always work either way.
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button className="w-full" disabled={!name.trim() || selected.length === 0 || busy} onClick={create}>
        {busy ? "Creating…" : "Create challenge"}
      </Button>
    </Card>
  );
}

function ProfileSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string | null;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function SessionCard({
  session,
  headers,
  onDeleted,
}: {
  session: SessionRow;
  headers: (extra?: Record<string, string>) => Record<string, string>;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = typed.trim().toLowerCase() === session.name.trim().toLowerCase();

  async function remove() {
    if (!matches) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${session.code}`, {
        method: "DELETE",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ confirm: typed.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not delete");
      onDeleted();
    } catch (e) {
      setError(e instanceof TypeError ? "Couldn't reach the server." : (e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{session.name}</p>
          <p className="text-xs text-ink/50">
            {session.players} player{session.players === 1 ? "" : "s"} · {session.involvedRoles.length} departments
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-lg bg-brand/10 px-3 py-1 font-mono text-sm font-bold tracking-widest text-brand">
            {session.code}
          </span>
          <a className="text-sm text-brand underline" href={`/dashboard?session=${session.id}`}>
            dashboard
          </a>
          <button
            onClick={() => {
              setConfirming((v) => !v);
              setError(null);
              setTyped("");
            }}
            className="text-base text-red-500"
            aria-label="Delete challenge"
            title="Delete challenge"
          >
            🗑
          </button>
        </div>
      </div>

      {confirming && (
        <div className="space-y-2 rounded-2xl bg-red-50 p-3">
          <p className="text-xs text-red-700">
            This permanently deletes <b>{session.name}</b> and all its players &amp; scores. Type the company name to
            confirm.
          </p>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && matches && remove()}
            placeholder={session.name}
            className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm"
            autoFocus
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <button
              onClick={remove}
              disabled={!matches || busy}
              className="btn3d flex-1 bg-red-500 text-white disabled:pointer-events-none disabled:opacity-40"
              style={{ "--btn-edge": "#c23a3a" } as React.CSSProperties}
            >
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
