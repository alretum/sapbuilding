"use client";

import confetti, { type Options } from "canvas-confetti";

// Confetti tuned to the achievement size — research showed the burst should be
// immediate and scale with the milestone. Imported statically (bundled into the
// page chunk) so it never relies on a separately-loaded async chunk, which can
// fail to resolve under the custom server when the app is opened from a LAN IP.
// The functions are only ever called from client event handlers, so this is
// SSR-safe; the window guard is belt-and-braces.
const COLORS = ["#6d5df6", "#2bd4a8", "#ffb23e", "#ff6b6b", "#9b8cff"];

function fire(...bursts: Options[]) {
  if (typeof window === "undefined") return;
  for (const b of bursts) confetti(b);
}

export function celebrateSmall(): void {
  fire({ particleCount: 60, spread: 70, startVelocity: 32, origin: { y: 0.7 }, colors: COLORS, scalar: 0.9 });
}

export function celebrateBig(): void {
  // Two side cannons + a center burst for a bigger "you finished!" moment.
  fire(
    { particleCount: 90, angle: 60, spread: 80, startVelocity: 45, origin: { x: 0, y: 0.7 }, colors: COLORS },
    { particleCount: 90, angle: 120, spread: 80, startVelocity: 45, origin: { x: 1, y: 0.7 }, colors: COLORS },
    { particleCount: 120, spread: 110, startVelocity: 40, origin: { y: 0.6 }, colors: COLORS },
  );
}
