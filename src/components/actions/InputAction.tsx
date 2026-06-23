"use client";

import { useState } from "react";
import type { InputPayload } from "@/lib/content-schema";
import type { ActionProps } from "./types";
import { Button } from "../ui";

export function InputAction({ action, onComplete }: ActionProps) {
  const payload = action.payload as InputPayload;
  const isText = payload.inputType === "text";
  const [num, setNum] = useState<number | "">("");
  const [text, setText] = useState("");

  function finish() {
    const value = isText ? text.trim() : num;
    onComplete({ actionId: action.id, score: action.points, payload: { value } });
  }

  // Open-ended status prompt: a textarea with no right/wrong. Optional, so it
  // never blocks a player from finishing; submit is always enabled.
  if (isText) {
    return (
      <div className="space-y-4">
        <label className="block font-semibold">{payload.prompt}</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={payload.maxLength ?? 400}
          rows={4}
          placeholder={payload.placeholder ?? "Type your answer…"}
          className="w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
        />
        <p className="text-xs text-ink/40">
          Optional — leave it blank if nothing comes to mind. Please don&apos;t enter personal data.
        </p>
        <Button onClick={finish} className="w-full">
          Submit & Collect {action.points} points →
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <label className="block font-semibold">{payload.prompt}</label>
        <div className="flex items-center gap-3">
          {payload.inputType === "slider" ? (
            <input
              type="range"
              min={payload.min ?? 0}
              max={payload.max ?? 100}
              value={num === "" ? payload.min ?? 0 : num}
              onChange={(e) => setNum(parseInt(e.target.value))}
              className="flex-1"
            />
          ) : (
            <input
              type="number"
              min={payload.min}
              max={payload.max}
              value={num}
              onChange={(e) => setNum(parseInt(e.target.value))}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            />
          )}
          {payload.unit && <span className="text-sm font-semibold">{payload.unit}</span>}
        </div>
        {payload.inputType === "slider" && num !== "" && (
          <div className="text-center text-sm font-bold text-brand">{num}{payload.unit}</div>
        )}
      </div>

      <Button onClick={finish} disabled={num === ""} className="w-full">
        Submit & Collect {action.points} points →
      </Button>
    </div>
  );
}
