"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { avatarDataUri } from "@/lib/avatar";
import { parseAvatar, type AvatarConfig } from "@/lib/avatar-config";

// A person's avatar in a 3D clay medallion. Pass either a parsed `config` or the
// raw stored JSON string + a `fallbackSeed` (usually the player's name).
export function UserAvatar({
  config,
  raw,
  fallbackSeed,
  size = 44,
  className,
  onClick,
}: {
  config?: AvatarConfig;
  raw?: string | null;
  fallbackSeed?: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}) {
  const cfg = config ?? parseAvatar(raw, fallbackSeed ?? "anon");
  const uri = useMemo(() => avatarDataUri(cfg), [cfg.style, cfg.seed, cfg.bg]);
  const style = { width: size, height: size };

  if (onClick) {
    return (
      <button onClick={onClick} className={clsx("clay shrink-0 transition active:scale-95", className)} style={style}>
        <img src={uri} alt="avatar" />
      </button>
    );
  }
  return (
    <div className={clsx("clay shrink-0", className)} style={style}>
      <img src={uri} alt="avatar" />
    </div>
  );
}

// A department's identity in a 3D clay medallion: its emoji on a coloured,
// shaded puck. (Swap the emoji for a real 3D-rendered image later if desired.)
export function DeptAvatar({
  emoji,
  color,
  size = 44,
  className,
}: {
  emoji: string;
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={clsx("clay shrink-0", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        backgroundImage:
          "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55), transparent 45%), linear-gradient(160deg, rgba(255,255,255,0.12), rgba(0,0,0,0.2))",
      }}
    >
      <span style={{ fontSize: size * 0.5 }}>{emoji}</span>
    </div>
  );
}
