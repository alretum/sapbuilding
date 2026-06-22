"use client";

import { useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import type { SwipePayload } from "@/lib/content-schema";
import type { ActionProps } from "./types";
import { Button } from "../ui";

// Swipe action. One card at a time; drag (or tap the buttons) left/right to sort
// into the two labelled buckets. Completing awards full points; the per-card
// choices are returned in the payload for later analysis.
export function SwipeAction({ action, onComplete }: ActionProps) {
  const payload = action.payload as SwipePayload;
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState<Record<string, "left" | "right">>({});

  const card = payload.cards[index];
  const done = index >= payload.cards.length;

  function decide(direction: "left" | "right") {
    if (!card) return;
    setChoices((c) => ({ ...c, [card.id]: direction }));
    setIndex((i) => i + 1);
  }

  function onDragEnd(_e: unknown, info: PanInfo) {
    if (info.offset.x > 80) decide("right");
    else if (info.offset.x < -80) decide("left");
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-4xl">🎉</p>
        <p className="font-semibold">All sorted!</p>
        <Button
          className="w-full"
          onClick={() => onComplete({ actionId: action.id, score: action.points, payload: { choices } })}
        >
          Collect {action.points} points →
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-ink/60">{payload.prompt}</p>

      <div className="relative h-52">
        <AnimatePresence>
          <motion.div
            key={card.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={onDragEnd}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            whileDrag={{ rotate: 0 }}
            className="absolute inset-0 flex cursor-grab items-center justify-center rounded-xl2 border border-black/10 bg-white p-6 text-center text-lg font-semibold shadow-card active:cursor-grabbing"
          >
            {card.label}
            {card.hint && <span className="mt-2 block text-xs font-normal text-ink/50">{card.hint}</span>}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" className="flex-1" onClick={() => decide("left")}>
          ← {payload.leftLabel}
        </Button>
        <Button variant="ghost" className="flex-1" onClick={() => decide("right")}>
          {payload.rightLabel} →
        </Button>
      </div>

      <p className="text-center text-xs text-ink/40">
        {index + 1} / {payload.cards.length}
      </p>
    </div>
  );
}
