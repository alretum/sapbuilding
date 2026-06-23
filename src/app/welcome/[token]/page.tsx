"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  COMPANY_SIZES,
  COUNTRIES,
  DATA_SENSITIVITY,
  INDUSTRIES,
  SAP_VERSIONS,
  type CompanyProfile,
} from "@/lib/profile";
import { recommend, type RecPath } from "@/lib/recommendation";
import { Button, Card, NavButton, Screen } from "@/components/ui";
import { BookEvoKitCTA } from "@/components/BookEvoKitCTA";

type View = "loading" | "confirm" | "ready" | "notfound";
type Participation = { participants: number; departmentsPlayed: number; totalDepartments: number; preparationScore: number };

const PATH_COLOR: Record<RecPath, string> = { GROW: "#2bd4a8", RISE: "#6d5df6", PREPARE: "#ffb23e" };

export default function WelcomePage() {
  const token = String(useParams().token ?? "");
  const [view, setView] = useState<View>("loading");
  const [name, setName] = useState("your company");
  const [code, setCode] = useState("");
  const [profile, setProfile] = useState<CompanyProfile>({});
  const [participation, setParticipation] = useState<Participation>({
    participants: 0,
    departmentsPlayed: 0,
    totalDepartments: 0,
    preparationScore: 0,
  });
  const [busy, setBusy] = useState(false);

  function load() {
    fetch(`/api/profile/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setName(d.name);
        setCode(d.code);
        setProfile(d.profile ?? {});
        setParticipation(d.participation);
        setView(d.confirmed ? "ready" : "confirm");
      })
      .catch(() => setView("notfound"));
  }

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function confirm() {
    setBusy(true);
    try {
      const res = await fetch(`/api/profile/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) setView("ready");
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof CompanyProfile) => (v: string) => setProfile((p) => ({ ...p, [k]: v }));

  if (view === "loading") {
    return (
      <Screen>
        <p className="py-20 text-center text-ink/50">Loading…</p>
      </Screen>
    );
  }
  if (view === "notfound") {
    return (
      <Screen>
        <Card className="text-center text-sm text-ink/60">This link isn&apos;t valid. Ask your SAP contact for a new one.</Card>
      </Screen>
    );
  }

  return (
    <Screen className="max-w-2xl space-y-5">
      <header className="space-y-1 pt-4 text-center">
        <p className="text-4xl">👋</p>
        <h1 className="font-display text-2xl font-bold">Hi {name}</h1>
        <p className="text-sm text-ink/60">
          {view === "confirm"
            ? "We've pre-filled what we know. Confirm or tweak it to get started."
            : "You're set up. Now bring your team in — that's what makes the report real."}
        </p>
      </header>

      {view === "confirm" && (
        <Card className="space-y-4">
          <Field label="Industry" value={profile.industry} options={INDUSTRIES} onChange={set("industry")} />
          <Field label="Country" value={profile.country} options={COUNTRIES} onChange={set("country")} />
          <Field label="Current SAP version" value={profile.sapVersion} options={SAP_VERSIONS} onChange={set("sapVersion")} />
          <Field label="Company size" value={profile.companySize} options={COMPANY_SIZES} onChange={set("companySize")} />
          <Field
            label="Data sensitivity"
            value={profile.dataSensitivity}
            options={DATA_SENSITIVITY}
            onChange={set("dataSensitivity")}
          />
          <Button className="w-full" onClick={confirm} disabled={busy}>
            {busy ? "Working…" : "Confirm — let's get the team playing →"}
          </Button>
        </Card>
      )}

      {view === "ready" && <ReadyView name={name} code={code} profile={profile} participation={participation} onRefresh={load} />}

      {view === "ready" && (
        <div className="text-center">
          <NavButton onClick={() => setView("confirm")}>Adjust my details</NavButton>
        </div>
      )}
    </Screen>
  );
}

function ReadyView({
  code,
  profile,
  participation,
  onRefresh,
}: {
  name: string;
  code: string;
  profile: CompanyProfile;
  participation: Participation;
  onRefresh: () => void;
}) {
  const rec = recommend(profile);
  const played = participation.departmentsPlayed > 0;

  return (
    <div className="space-y-4">
      {/* Preliminary hypothesis — clearly labelled, not the real report */}
      <Card className="space-y-1 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-ink/45">Preliminary read</p>
        {rec.path === "PREPARE" ? (
          <p className="text-sm text-ink/70">
            Your profile suggests doing some groundwork first — getting your team&apos;s input is exactly how you&apos;ll
            know where you really stand.
          </p>
        ) : (
          <p className="text-sm text-ink/70">
            Based on your profile, companies like you usually land on{" "}
            <span className="font-display font-bold" style={{ color: PATH_COLOR[rec.path] }}>
              {rec.pathLabel}
            </span>
            . We&apos;ll confirm that against what your team actually says.
          </p>
        )}
        <p className="pt-1 text-xs text-ink/40">A starting hypothesis — your real report comes from participation.</p>
      </Card>

      {/* Rally the team */}
      <Card className="space-y-3 text-center">
        <p className="text-3xl">📣</p>
        <h2 className="font-display text-xl font-bold">Now rally your team</h2>
        <p className="mx-auto max-w-md text-sm text-ink/60">
          As the Captain, your job is to get every department playing. Two minutes each — that&apos;s what turns this into
          a real, defensible read.
        </p>
        <div className="rounded-2xl bg-brand/5 p-4">
          <p className="text-xs text-ink/50">Your team&apos;s join code</p>
          <p className="font-display text-3xl font-extrabold tracking-widest text-brand">{code}</p>
        </div>
        <a href="/" className="btn-ghost">
          Open the join page →
        </a>
      </Card>

      {/* The grounded report — unlocked by participation */}
      {played ? (
        <Card className="space-y-3 text-center">
          <p className="text-sm font-semibold">
            📊 {participation.departmentsPlayed}/{participation.totalDepartments} departments in ·{" "}
            {participation.preparationScore}% preparation
          </p>
          <BookEvoKitCTA code={code} />
        </Card>
      ) : (
        <Card className="space-y-2 text-center">
          <p className="text-sm text-ink/60">
            📊 Your full report builds as your team plays. Once departments join in, you&apos;ll see the real read here —
            grounded in what your own people said.
          </p>
          <NavButton onClick={onRefresh}>↻ Refresh</NavButton>
        </Card>
      )}
    </div>
  );
}

function Field({
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
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm"
      >
        <option value="">— select —</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
