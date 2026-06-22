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
import { Button, Card, Screen } from "@/components/ui";
import { PersonalizedRead } from "@/components/PersonalizedRead";
import { BookEvoKitCTA } from "@/components/BookEvoKitCTA";

type View = "loading" | "confirm" | "read" | "notfound";

export default function WelcomePage() {
  const token = String(useParams().token ?? "");
  const [view, setView] = useState<View>("loading");
  const [name, setName] = useState("your company");
  const [code, setCode] = useState("");
  const [profile, setProfile] = useState<CompanyProfile>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/profile/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setName(d.name);
        setCode(d.code);
        setProfile(d.profile ?? {});
        setView(d.confirmed ? "read" : "confirm");
      })
      .catch(() => setView("notfound"));
  }, [token]);

  async function confirm() {
    setBusy(true);
    try {
      const res = await fetch(`/api/profile/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) setView("read");
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
            ? "We've pre-filled what we know. Confirm or tweak it, and we'll show your cloud path."
            : "Here's your personalized read."}
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
            {busy ? "Working…" : "Looks right — show my cloud path →"}
          </Button>
        </Card>
      )}

      {view === "read" && (
        <>
          <PersonalizedRead companyName={name} profile={profile} />
          {code && <BookEvoKitCTA code={code} />}
          <button onClick={() => setView("confirm")} className="block w-full text-center text-sm text-brand underline">
            Adjust my details
          </button>
        </>
      )}
    </Screen>
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
