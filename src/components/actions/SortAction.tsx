"use client";

import { useState } from "react";
import type { SortPayload } from "@/lib/content-schema";
import type { ActionProps } from "./types";
import { Button } from "../ui";
import { motion, AnimatePresence } from "framer-motion";

export function SortAction({ action, onComplete }: ActionProps) {
  const payload = action.payload as SortPayload;
  const [items, setItems] = useState(payload.items);

  function finish() {
    let score = action.points;
    if (payload.correctOrder) {
      let correctPositions = 0;
      items.forEach((item, index) => {
        if (payload.correctOrder![index] === item.id) {
          correctPositions++;
        }
      });
      const total = payload.items.length;
      if (correctPositions === total) {
        score = action.points; // exact, e.g. 40
      } else if (correctPositions >= total - 2 && total > 2) {
        score = Math.floor(action.points * 0.625); // mostly correct, e.g. 25
      } else {
        score = Math.floor(action.points * 0.25); // partly correct, e.g. 10
      }
    }
    onComplete({ actionId: action.id, score, payload: { items } });
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    setItems(newItems);
  }

  function moveDown(index: number) {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    setItems(newItems);
  }

  return (
    <div className="space-y-5">
      <p className="font-semibold">{payload.prompt}</p>
      
      <div className="space-y-2">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-xs font-bold text-black/50">
                  {index + 1}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="rounded p-1 text-black/40 hover:bg-black/5 hover:text-black disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === items.length - 1}
                  className="rounded p-1 text-black/40 hover:bg-black/5 hover:text-black disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Button onClick={finish} className="w-full">
        Submit Order & Collect {action.points} points →
      </Button>
    </div>
  );
}
