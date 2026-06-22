"use client";

import { createAvatar } from "@dicebear/core";
import { adventurerNeutral, bigSmile, funEmoji, notionistsNeutral } from "@dicebear/collection";
import type { AvatarConfig } from "./avatar-config";

// Map style id -> DiceBear style. All options we pass (seed, backgroundColor,
// radius) are core options valid for every style, so the cast is safe.
const STYLE_MAP = { adventurerNeutral, bigSmile, funEmoji, notionistsNeutral } as unknown as Record<
  string,
  typeof adventurerNeutral
>;

const cache = new Map<string, string>();

// Deterministic SVG data URI for an avatar config. Generated offline (no API).
export function avatarDataUri(config: AvatarConfig): string {
  const key = `${config.style}|${config.seed}|${config.bg}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const style = STYLE_MAP[config.style] ?? adventurerNeutral;
  const uri = createAvatar(style, {
    seed: config.seed,
    backgroundColor: [config.bg.replace("#", "")],
    radius: 50,
  }).toDataUri();

  cache.set(key, uri);
  return uri;
}

export function styleLabel(style: string): string {
  switch (style) {
    case "adventurerNeutral":
      return "Classic";
    case "bigSmile":
      return "Smiley";
    case "funEmoji":
      return "Emoji";
    case "notionistsNeutral":
      return "Minimal";
    default:
      return style;
  }
}
