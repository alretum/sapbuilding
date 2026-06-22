"use client";

import { useState } from "react";
import type { InputPayload } from "@/lib/content-schema";
import type { ActionProps } from "./types";
import { Button } from "../ui";

export function InputAction({ action, onComplete }: ActionProps) {
  const payload = action.payload as InputPayload;
  const [value, setValue] = useState<number | "">("");

  function finish() {
    onComplete({ actionId: action.id, score: action.points, payload: { value } });
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
              value={value === "" ? payload.min ?? 0 : value}
              onChange={(e) => setValue(parseInt(e.target.value))}
              className="flex-1"
            />
          ) : (
            <input
              type="number"
              min={payload.min}
              max={payload.max}
              value={value}
              onChange={(e) => setValue(parseInt(e.target.value))}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            />
          )}
          {payload.unit && <span className="text-sm font-semibold">{payload.unit}</span>}
        </div>
        {payload.inputType === "slider" && value !== "" && (
          <div className="text-center text-sm font-bold text-brand">{value}{payload.unit}</div>
        )}
      </div>

      <Button onClick={finish} disabled={value === ""} className="w-full">
        Submit & Collect {action.points} points →
      </Button>
    </div>
  );
}
