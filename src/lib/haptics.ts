"use client";

// Subtle haptic feedback on supported devices (mostly Android). Safe no-op
// elsewhere. Keep it light — a tiny tap, never a buzz-fest (2026 calm-motion).
export function haptic(pattern: number | number[] = 10): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}
