"use client";

import { useState, useRef, useLayoutEffect, useCallback } from "react";
import type { MatchPayload } from "@/lib/content-schema";
import type { ActionProps } from "./types";
import { Button } from "../ui";

interface LineCoords {
  x1: number; y1: number;
  x2: number; y2: number;
  itemId: string;
  targetId: string;
  correct?: boolean; // set after submission
}

export function MatchAction({ action, onComplete }: ActionProps) {
  const payload = action.payload as MatchPayload;
  const [matches, setMatches] = useState<Record<string, string>>({}); // itemId -> targetId
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const targetRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [lines, setLines] = useState<LineCoords[]>([]);

  // Randomly subset items if randomLimit is configured
  const [displayedItems] = useState(() => {
    if (payload.randomLimit && payload.randomLimit < payload.items.length) {
      const shuffled = [...payload.items].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, payload.randomLimit);
    }
    return payload.items;
  });

  const allMatched = displayedItems.every(i => matches[i.id] !== undefined);

  // Recalculate line positions whenever matches change
  const recalcLines = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const newLines: LineCoords[] = Object.entries(matches).map(([itemId, targetId]) => {
      const itemEl = itemRefs.current[itemId];
      const targetEl = targetRefs.current[targetId];
      if (!itemEl || !targetEl) return null;
      const iRect = itemEl.getBoundingClientRect();
      const tRect = targetEl.getBoundingClientRect();
      return {
        itemId,
        targetId,
        x1: iRect.right - containerRect.left,
        y1: iRect.top + iRect.height / 2 - containerRect.top,
        x2: tRect.left - containerRect.left,
        y2: tRect.top + tRect.height / 2 - containerRect.top,
      };
    }).filter(Boolean) as LineCoords[];

    setLines(newLines);
  }, [matches]);

  useLayoutEffect(() => {
    recalcLines();
  }, [recalcLines]);

  function handleItemClick(id: string) {
    if (submitted) return;
    if (selectedItem === id) {
      setSelectedItem(null);
    } else {
      setSelectedItem(id);
    }
  }

  function handleTargetClick(targetId: string) {
    if (submitted) return;
    if (selectedItem) {
      setMatches(prev => ({ ...prev, [selectedItem]: targetId }));
      setSelectedItem(null);
    } else {
      // Clicking target with nothing selected: unlink whatever was connected
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

  function handleSubmit() {
    setSubmitted(true);
    // Annotate lines with correctness
    if (payload.correctMatches) {
      setLines(prev => prev.map(line => {
        const correct = payload.correctMatches![line.itemId];
        let isCorrect = false;
        if (Array.isArray(correct)) {
          isCorrect = correct.includes(line.targetId);
        } else {
          isCorrect = line.targetId === correct;
        }
        return { ...line, correct: isCorrect };
      }));
    }
  }

  function finish() {
    let score = action.points;
    if (payload.correctMatches) {
      const correctPointsPerMatch = action.points / displayedItems.length;
      let calculatedScore = 0;
      displayedItems.forEach(item => {
        const correct = payload.correctMatches![item.id];
        const userMatch = matches[item.id];
        if (Array.isArray(correct)) {
          if (correct.includes(userMatch)) calculatedScore += correctPointsPerMatch;
        } else {
          if (userMatch === correct) calculatedScore += correctPointsPerMatch;
        }
      });
      score = Math.round(calculatedScore);
    }
    onComplete({ actionId: action.id, score, payload: { matches } });
  }

  // Determine line color
  function lineColor(line: LineCoords) {
    if (!submitted || line.correct === undefined) return "#6d5df6"; // brand purple
    return line.correct ? "#22c55e" : "#ef4444";
  }

  return (
    <div className="space-y-4">
      <p className="font-semibold text-center">{payload.prompt}</p>

      {!submitted && selectedItem && (
        <p className="text-xs text-center text-brand font-medium animate-pulse">
          ✨ Now click a category on the right to connect
        </p>
      )}
      {!submitted && !selectedItem && (
        <p className="text-xs text-center text-ink/40">
          Click an item on the left, then a category on the right to connect them
        </p>
      )}

      <div ref={containerRef} className="relative">
        {/* SVG overlay for lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          style={{ zIndex: 10 }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="#6d5df6" fillOpacity="0.6" />
            </marker>
          </defs>
          {lines.map(line => (
            <g key={`${line.itemId}-${line.targetId}`}>
              <line
                x1={line.x1} y1={line.y1}
                x2={line.x2} y2={line.y2}
                stroke={lineColor(line)}
                strokeWidth={2.5}
                strokeOpacity={submitted ? 0.9 : 0.6}
                strokeDasharray={submitted ? "none" : "6 3"}
              />
              {/* Dot at endpoints */}
              <circle cx={line.x1} cy={line.y1} r={4} fill={lineColor(line)} fillOpacity={0.7} />
              <circle cx={line.x2} cy={line.y2} r={4} fill={lineColor(line)} fillOpacity={0.7} />
            </g>
          ))}
        </svg>

        <div className="flex gap-6">
          {/* Left: Items */}
          <div className="flex-1 space-y-2">
            <p className="text-xs font-bold uppercase text-black/40 text-center mb-2">Items</p>
            {displayedItems.map(item => {
              const isMatched = matches[item.id] !== undefined;
              const isSelected = selectedItem === item.id;
              // correctness after submission
              let correctState: "correct" | "wrong" | null = null;
              if (submitted && payload.correctMatches && isMatched) {
                const correct = payload.correctMatches[item.id];
                const userMatch = matches[item.id];
                const isCorrect = Array.isArray(correct) ? correct.includes(userMatch) : userMatch === correct;
                correctState = isCorrect ? "correct" : "wrong";
              }
              return (
                <button
                  key={item.id}
                  ref={el => { itemRefs.current[item.id] = el; }}
                  onClick={() => handleItemClick(item.id)}
                  disabled={submitted}
                  className={[
                    "w-full text-left p-3 rounded-xl border text-sm transition relative",
                    isSelected
                      ? "border-brand bg-brand/10 ring-2 ring-brand shadow-sm scale-[1.02]"
                      : isMatched
                        ? "border-black/10 bg-black/4 opacity-80"
                        : "border-black/20 hover:border-brand/50 hover:bg-brand/5 bg-white shadow-sm",
                    correctState === "correct" ? "!border-green-500 !bg-green-50" : "",
                    correctState === "wrong" ? "!border-red-400 !bg-red-50" : "",
                  ].join(" ")}
                >
                  <span className="mr-1">{isSelected ? "🔵" : isMatched ? (correctState === "correct" ? "✅" : correctState === "wrong" ? "❌" : "🔗") : "⚪"}</span>
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Right: Targets */}
          <div className="flex-1 space-y-2">
            <p className="text-xs font-bold uppercase text-black/40 text-center mb-2">Categories</p>
            {payload.targets.map(target => {
              const matchedItems = displayedItems.filter(i => matches[i.id] === target.id);
              const isClickable = !submitted && selectedItem !== null;
              return (
                <button
                  key={target.id}
                  ref={el => { targetRefs.current[target.id] = el; }}
                  onClick={() => handleTargetClick(target.id)}
                  disabled={submitted && matchedItems.length === 0}
                  className={[
                    "w-full text-left p-3 rounded-xl border-2 transition",
                    isClickable
                      ? "border-brand/60 bg-brand/5 hover:bg-brand/10 hover:border-brand cursor-pointer scale-[1.01]"
                      : "border-dashed border-black/15 cursor-default",
                    matchedItems.length > 0 && !isClickable ? "border-solid" : "",
                  ].join(" ")}
                >
                  <div className="text-sm font-medium text-center">{target.label}</div>
                  {matchedItems.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {matchedItems.map(mi => {
                        let correctState: "correct" | "wrong" | null = null;
                        if (submitted && payload.correctMatches) {
                          const correct = payload.correctMatches[mi.id];
                          const isCorrect = Array.isArray(correct) ? correct.includes(target.id) : target.id === correct;
                          correctState = isCorrect ? "correct" : "wrong";
                        }
                        return (
                          <div
                            key={mi.id}
                            className={[
                              "text-xs rounded px-2 py-1 shadow-sm truncate text-left border",
                              correctState === "correct" ? "bg-green-50 border-green-300 text-green-800" :
                              correctState === "wrong" ? "bg-red-50 border-red-300 text-red-800" :
                              "bg-white border-black/10",
                            ].join(" ")}
                          >
                            {correctState === "correct" ? "✅ " : correctState === "wrong" ? "❌ " : ""}{mi.label}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Show correct answers legend after submission */}
      {submitted && payload.correctMatches && (
        <div className="rounded-xl bg-black/5 p-3 space-y-1">
          <p className="text-xs font-bold text-black/50 uppercase tracking-wide mb-2">Answer key</p>
          {displayedItems.map(item => {
            const correct = payload.correctMatches![item.id];
            const correctTargetIds = Array.isArray(correct) ? correct : [correct];
            const correctLabels = correctTargetIds.map(id => payload.targets.find(t => t.id === id)?.label ?? id).join(" / ");
            const userMatch = matches[item.id];
            const isCorrect = Array.isArray(correct) ? correct.includes(userMatch) : userMatch === correct;
            return (
              <div key={item.id} className="text-xs flex items-start gap-1">
                <span>{isCorrect ? "✅" : "❌"}</span>
                <span className="font-medium">{item.label}</span>
                <span className="text-black/40 mx-1">→</span>
                <span className={isCorrect ? "text-green-700" : "text-red-600 font-semibold"}>{correctLabels}</span>
              </div>
            );
          })}
        </div>
      )}

      {!submitted ? (
        <Button onClick={handleSubmit} disabled={!allMatched} className="w-full">
          Check Answers →
        </Button>
      ) : (
        <Button onClick={finish} className="w-full">
          Collect {action.points} points →
        </Button>
      )}
    </div>
  );
}
