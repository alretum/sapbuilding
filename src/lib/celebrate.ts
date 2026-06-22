"use client";

import type { Options } from "canvas-confetti";

// Confetti tuned to the achievement size — research showed the burst should be
// immediate and scale with the milestone. canvas-confetti is imported lazily so
// it never loads (or touches `window`) during SSR.
const COLORS = ["#6d5df6", "#2bd4a8", "#ffb23e", "#ff6b6b", "#9b8cff"];

async function fire(...bursts: Options[]) {
  const confetti = (await import("canvas-confetti")).default;
  for (const b of bursts) confetti(b);
}

export function celebrateSmall(): void {
  void fire({ particleCount: 60, spread: 70, startVelocity: 32, origin: { y: 0.7 }, colors: COLORS, scalar: 0.9 });
}

export function celebrateBig(): void {
  // Two side cannons + a center burst for a bigger "you finished!" moment.
  void fire(
    { particleCount: 90, angle: 60, spread: 80, startVelocity: 45, origin: { x: 0, y: 0.7 }, colors: COLORS },
    { particleCount: 90, angle: 120, spread: 80, startVelocity: 45, origin: { x: 1, y: 0.7 }, colors: COLORS },
    { particleCount: 120, spread: 110, startVelocity: 40, origin: { y: 0.6 }, colors: COLORS },
  );
}
