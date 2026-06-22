"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { QuizPayload } from "@/lib/content-schema";
import type { ActionProps } from "./types";
import { Button } from "../ui";

// Quiz / poll action. Supports both knowledge questions (options carry
// `correct`) and opinion questions (no `correct` -> no right/wrong). In the
// prototype completing the action awards full points (engagement model); the
// `correct` flags drive feedback only. Swap to correctness-weighted scoring
// later by computing score from `correctCount` here.
export function QuizAction({ action, onComplete }: ActionProps) {
  const payload = action.payload as QuizPayload;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = payload.questions.every((q) => answers[q.id]);
  const hasKnowledge = useMemo(
    () => payload.questions.some((q) => q.options.some((o) => o.correct !== undefined)),
    [payload],
  );

  function choose(questionId: string, optionId: string) {
    if (submitted) return;
    setAnswers((a) => ({ ...a, [questionId]: optionId }));
  }

  function finish() {
    let score = action.points;
    const hasPointsOrCorrect = payload.questions.some(q => 
      q.options.some(o => o.points !== undefined || o.correct !== undefined)
    );
    if (hasPointsOrCorrect) {
      score = 0;
      const pointsPerCorrect = Math.floor(action.points / payload.questions.length);
      payload.questions.forEach(q => {
        const chosenOptionId = answers[q.id];
        const chosenOption = q.options.find(o => o.id === chosenOptionId);
        if (chosenOption) {
          if (chosenOption.points !== undefined) {
            score += chosenOption.points;
          } else if (chosenOption.correct) {
            score += pointsPerCorrect;
          }
        }
      });
    }
    onComplete({ actionId: action.id, score, payload: { answers } });
  }

  return (
    <div className="space-y-5">
      {payload.questions.map((q, qi) => {
        const chosen = answers[q.id];
        return (
          <div key={q.id} className="space-y-3">
            <p className="font-semibold">
              <span className="text-brand">{qi + 1}.</span> {q.prompt}
            </p>
            <div className="space-y-2">
              {q.options.map((o) => {
                const isChosen = chosen === o.id;
                const showCorrect = submitted && o.correct === true;
                const showWrong = submitted && isChosen && o.correct === false;
                return (
                  <button
                    key={o.id}
                    onClick={() => choose(q.id, o.id)}
                    className={[
                      "w-full rounded-2xl border px-4 py-3 text-left text-sm transition",
                      isChosen ? "border-brand bg-brand/5" : "border-black/10 hover:border-black/20",
                      showCorrect ? "border-green-500 bg-green-50" : "",
                      showWrong ? "border-red-400 bg-red-50" : "",
                    ].join(" ")}
                  >
                    <span className="mr-2">
                      {showCorrect ? "✅" : showWrong ? "❌" : isChosen ? "🔘" : "⚪️"}
                    </span>
                    {o.label}
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-black/5 px-3 py-2 text-xs text-ink/70"
              >
                {q.explanation}
              </motion.p>
            )}
          </div>
        );
      })}

      {!submitted ? (
        <Button onClick={() => setSubmitted(true)} disabled={!allAnswered} className="w-full">
          {hasKnowledge ? "Check answers" : "Submit"}
        </Button>
      ) : (
        <Button onClick={finish} className="w-full">
          Collect {action.points} points →
        </Button>
      )}
    </div>
  );
}
