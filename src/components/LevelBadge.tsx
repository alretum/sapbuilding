"use client";

import { MAX_LEVEL } from "@/lib/snapshot-types";

// A compact level indicator: filled stars up to the current level.
export function LevelBadge({ level, color }: { level: number; color?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Level ${level} of ${MAX_LEVEL}`}>
      {Array.from({ length: MAX_LEVEL }).map((_, i) => (
        <span
          key={i}
          className="text-[11px] leading-none transition"
          style={{ color: i < level ? (color ?? "#ffb23e") : "rgba(22,26,62,0.15)" }}
        >
          ★
        </span>
      ))}
    </span>
  );
}
