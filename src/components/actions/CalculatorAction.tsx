"use client";

import { useState } from "react";
import type { CalculatorPayload } from "@/lib/content-schema";
import type { ActionProps } from "./types";
import { Button } from "../ui";
import { motion } from "framer-motion";

// SAP's official value/ROI guidance. TODO: swap for the exact SAP value-calculator URL.
const SAP_VALUE_URL = "https://www.sap.com/products/erp/rise.html";

export function CalculatorAction({ action, onComplete }: ActionProps) {
  const payload = action.payload as CalculatorPayload;
  const [values, setValues] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const allRequiredAnswered = payload.fields
    .filter((f) => !f.optional)
    .every((f) => values[f.id] !== undefined && !isNaN(values[f.id]));

  // We deliberately do NOT compute a fabricated savings figure — the inputs are
  // captured for the company's brief, and the real number comes from SAP's tool.
  function finish() {
    onComplete({ actionId: action.id, score: action.points, payload: { values } });
  }

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
            Continue
          </Button>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="space-y-2 rounded-2xl border border-brand/20 bg-brand/5 p-5 text-sm">
            <h3 className="font-bold text-brand">Noted — this goes into your brief</h3>
            <p className="text-ink/70">
              We won&apos;t invent a savings number. Companies your size typically cut their monthly close by several
              days and lower IT maintenance after moving — but your real figure deserves SAP&apos;s actual modelling, not
              a guess from us.
            </p>
            <a
              href={SAP_VALUE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-semibold text-brand underline"
            >
              Get your real ROI from SAP&apos;s value tooling →
            </a>
          </div>
          <Button onClick={finish} className="w-full">
            Collect {action.points} points →
          </Button>
        </motion.div>
      )}
    </div>
  );
}
