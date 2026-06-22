"use client";

import { useState } from "react";
import type { MatchPayload } from "@/lib/content-schema";
import type { ActionProps } from "./types";
import { Button } from "../ui";

export function MatchAction({ action, onComplete }: ActionProps) {
  const payload = action.payload as MatchPayload;
  const [matches, setMatches] = useState<Record<string, string>>({}); // itemId -> targetId
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const allMatched = payload.items.every(i => matches[i.id] !== undefined);

  function finish() {
    let score = action.points;
    if (payload.correctMatches) {
      const correctPointsPerMatch = Math.floor(action.points / payload.items.length);
      score = 0;
      payload.items.forEach(item => {
        if (matches[item.id] === payload.correctMatches![item.id]) {
          score += correctPointsPerMatch;
        }
      });
    }
    onComplete({ actionId: action.id, score, payload: { matches } });
  }

  function handleItemClick(id: string) {
    if (selectedItem === id) {
      setSelectedItem(null);
    } else {
      setSelectedItem(id);
    }
  }

  function handleTargetClick(targetId: string) {
    if (selectedItem) {
      setMatches(prev => ({ ...prev, [selectedItem]: targetId }));
      setSelectedItem(null);
    } else {
      const newMatches = { ...matches };
      let changed = false;
      Object.keys(newMatches).forEach(itemId => {
        if (newMatches[itemId] === targetId) {
          delete newMatches[itemId];
          changed = true;
        }
      });
      if (changed) setMatches(newMatches);
    }
  }

  return (
    <div className="space-y-6">
      <p className="font-semibold text-center">{payload.prompt}</p>
      
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <p className="text-xs font-bold uppercase text-black/40 text-center mb-2">Items</p>
          {payload.items.map(item => {
            const isMatched = matches[item.id] !== undefined;
            const isSelected = selectedItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full text-left p-3 rounded-xl border text-sm transition ${
                  isSelected ? "border-brand bg-brand/5 ring-1 ring-brand" :
                  isMatched ? "border-black/10 bg-black/5 opacity-60" : "border-black/20 hover:border-black/40 bg-white shadow-sm"
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 space-y-2">
          <p className="text-xs font-bold uppercase text-black/40 text-center mb-2">Categories</p>
          {payload.targets.map(target => {
            const matchedItems = payload.items.filter(i => matches[i.id] === target.id);
            return (
              <button
                key={target.id}
                onClick={() => handleTargetClick(target.id)}
                className={`w-full text-left p-3 rounded-xl border-2 border-dashed transition ${
                  selectedItem ? "border-brand/50 hover:bg-brand/5 hover:border-brand cursor-pointer" : "border-black/10 cursor-default"
                }`}
              >
                <div className="text-sm font-medium text-center">{target.label}</div>
                {matchedItems.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {matchedItems.map(mi => (
                      <div key={mi.id} className="text-xs bg-white border border-black/10 rounded px-2 py-1 shadow-sm truncate text-left">
                        {mi.label}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <Button onClick={finish} disabled={!allMatched} className="w-full">
        Submit & Collect Points →
      </Button>
    </div>
  );
}
