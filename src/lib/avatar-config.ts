// Pure avatar config (no rendering deps) — safe to import on server and client.
// A player's avatar is just {style, seed, bg}; rendered to an SVG via DiceBear
// in src/lib/avatar.ts (client only). Stored as JSON in Player.avatar.

export interface AvatarConfig {
  style: string;
  seed: string;
  bg: string;
}

// Friendly, person-ish DiceBear styles offered in the editor.
export const AVATAR_STYLES = ["adventurerNeutral", "bigSmile", "funEmoji", "notionistsNeutral"] as const;

export const AVATAR_BGS = ["#6d5df6", "#2bd4a8", "#ffb23e", "#ff6b6b", "#9b8cff", "#2d9cdb"];

export const DEFAULT_STYLE = AVATAR_STYLES[0];

export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

// Used at join time so every player gets a distinct avatar with zero extra steps.
export function defaultAvatar(): AvatarConfig {
  return {
    style: DEFAULT_STYLE,
    seed: randomSeed(),
    bg: AVATAR_BGS[Math.floor(Math.random() * AVATAR_BGS.length)],
  };
}

// Tolerant parse: falls back to a name-seeded default so old/empty records and
// bad JSON still render a stable avatar.
export function parseAvatar(raw: string | null | undefined, fallbackSeed: string): AvatarConfig {
  if (raw) {
    try {
      const c = JSON.parse(raw) as Partial<AvatarConfig>;
      if (c && typeof c.seed === "string" && typeof c.style === "string") {
        return { style: c.style, seed: c.seed, bg: typeof c.bg === "string" ? c.bg : AVATAR_BGS[0] };
      }
    } catch {
      /* fall through */
    }
  }
  return { style: DEFAULT_STYLE, seed: fallbackSeed, bg: AVATAR_BGS[0] };
}

export function isValidAvatar(c: unknown): c is AvatarConfig {
  return (
    !!c &&
    typeof c === "object" &&
    typeof (c as AvatarConfig).style === "string" &&
    typeof (c as AvatarConfig).seed === "string" &&
    typeof (c as AvatarConfig).bg === "string"
  );
}
