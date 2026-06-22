"use client";

import { useState } from "react";
import type { MultiselectPayload } from "@/lib/content-schema";
import type { ActionProps } from "./types";
import { Button } from "../ui";

export function MultiselectAction({ action, onComplete }: ActionProps) {
  const payload = action.payload as MultiselectPayload;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = selected.size > 0;
  
  const hasKnowledge = payload.options.some(o => o.correct !== undefined);

  function toggle(id: string) {
    if (submitted) return;
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (payload.maxSelect && next.size >= payload.maxSelect) {
        return; // limit reached
      }
      next.add(id);
    }
    setSelected(next);
  }

  function finish() {
    let score = action.points;
    if (hasKnowledge) {
      const correctOptions = payload.options.filter(o => o.correct);
      const pointsPerCorrect = Math.floor(action.points / Math.max(1, correctOptions.length));
      const penaltyPerWrong = Math.floor(pointsPerCorrect / 2);
      
      score = 0;
      selected.forEach(id => {
        const option = payload.options.find(o => o.id === id);
        if (option?.correct) {
          score += pointsPerCorrect;
        } else {
          score = Math.max(0, score - penaltyPerWrong);
        }
      });
      // Cap at max points just in case
      score = Math.min(action.points, score);
    }
    
    onComplete({ actionId: action.id, score, payload: { selected: Array.from(selected) } });
  }

  return (
    <div className="space-y-5">
      <p className="font-semibold text-center">{payload.prompt}</p>
      {payload.maxSelect && (
        <p className="text-xs text-center text-black/50 -mt-3 mb-2">Select up to {payload.maxSelect} items</p>
      )}

      <div className="space-y-2">
        {payload.options.map((o) => {
          const isChosen = selected.has(o.id);
          const showCorrect = submitted && o.correct === true;
          const showWrong = submitted && isChosen && o.correct === false;
          
          return (
            <button
              key={o.id}
              onClick={() => toggle(o.id)}
              className={[
                "w-full rounded-2xl border px-4 py-3 text-left text-sm transition flex items-center",
                isChosen ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-black/10 hover:border-black/20 bg-white",
                showCorrect ? "!border-green-500 !bg-green-50" : "",
                showWrong ? "!border-red-400 !bg-red-50" : "",
              ].join(" ")}
            >
              <div className={`mr-3 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                isChosen ? "bg-brand border-brand text-white" : "border-black/20 bg-white"
              }`}>
                {isChosen && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="flex-1">{o.label}</span>
              {submitted && (showCorrect || showWrong) && (
                <span className="ml-2 text-xl">{showCorrect ? "✅" : "❌"}</span>
              )}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <Button onClick={() => setSubmitted(true)} disabled={!canSubmit} className="w-full">
          {hasKnowledge ? "Check answers" : "Submit"}
        </Button>
      ) : (
        <Button onClick={finish} className="w-full">
          Collect {hasKnowledge ? "Points" : `${action.points} points`} →
        </Button>
      )}
    </div>
  );
}
