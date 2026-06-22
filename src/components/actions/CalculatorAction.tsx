"use client";

import { useState } from "react";
import type { CalculatorPayload } from "@/lib/content-schema";
import type { ActionProps } from "./types";
import { Button } from "../ui";
import { motion } from "framer-motion";

export function CalculatorAction({ action, onComplete }: ActionProps) {
  const payload = action.payload as CalculatorPayload;
  const [values, setValues] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const allRequiredAnswered = payload.fields
    .filter((f) => !f.optional)
    .every((f) => values[f.id] !== undefined && !isNaN(values[f.id]));

  function finish() {
    onComplete({ actionId: action.id, score: action.points, payload: { values } });
  }

  // Dummy logic for ROI as requested by spec
  const savings = ((values["users"] || 100) * 500) + ((values["maint"] || 10000) * 0.2);
  const timeSaved = Math.max(1, Math.round((values["days"] || 5) * 0.3));
  const maturity = (values["custom"] || 0) > 100 ? "High technical debt, ripe for clean core." : "Solid baseline.";

  return (
    <div className="space-y-5">
      {!submitted ? (
        <>
          {payload.fields.map((f) => (
            <div key={f.id} className="space-y-2">
              <label className="block text-sm font-semibold">
                {f.label} {f.optional && <span className="font-normal text-black/40">(Optional)</span>}
              </label>
              <input
                type="number"
                min={f.min}
                max={f.max}
                value={values[f.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.id]: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          ))}
          <Button onClick={() => setSubmitted(true)} disabled={!allRequiredAnswered} className="w-full">
            Calculate
          </Button>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="rounded-2xl border border-brand/20 bg-brand/5 p-5 space-y-3">
            <h3 className="font-bold text-brand">Estimated Potential</h3>
            <p className="text-sm">
              <span className="font-semibold text-ink">Annual Savings:</span> ~€{savings.toLocaleString()}
            </p>
            <p className="text-sm">
              <span className="font-semibold text-ink">Time Saved Per Close:</span> ~{timeSaved} days
            </p>
            {values["custom"] !== undefined && (
              <p className="text-sm">
                <span className="font-semibold text-ink">Maturity Hint:</span> {maturity}
              </p>
            )}
          </div>
          <Button onClick={finish} className="w-full">
            Collect {action.points} points →
          </Button>
        </motion.div>
      )}
    </div>
  );
}
