"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AVATAR_BGS, AVATAR_STYLES, randomSeed, type AvatarConfig } from "@/lib/avatar-config";
import { styleLabel } from "@/lib/avatar";
import { UserAvatar } from "./Avatar";
import { Button } from "./ui";

// Optional avatar editor. Reached by tapping your avatar — never forced during
// onboarding. Pick a style, a colour, and a face (tap one, or shuffle for more).
export function AvatarEditor({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: AvatarConfig;
  onSave: (config: AvatarConfig) => void;
  onClose: () => void;
  saving?: boolean;
}) {
  const [style, setStyle] = useState(initial.style);
  const [bg, setBg] = useState(initial.bg);
  const [seed, setSeed] = useState(initial.seed);
  const [seeds, setSeeds] = useState<string[]>(() => [
    initial.seed,
    ...Array.from({ length: 7 }, () => randomSeed()),
  ]);

  const preview: AvatarConfig = { style, seed, bg };

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="card w-full max-w-md space-y-4 p-5"
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        exit={{ y: 60 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Your avatar</h2>
          <button onClick={onClose} className="text-ink/40" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="flex items-center gap-4">
          <UserAvatar config={preview} size={84} />
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {AVATAR_STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    style === s ? "bg-brand text-white" : "bg-ink/5 text-ink/60"
                  }`}
                >
                  {styleLabel(s)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {AVATAR_BGS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBg(c)}
                  className={`h-6 w-6 rounded-full ring-2 transition ${bg === c ? "ring-ink" : "ring-transparent"}`}
                  style={{ background: c }}
                  aria-label={`Background ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {seeds.map((s) => (
            <button
              key={s}
              onClick={() => setSeed(s)}
              className={`rounded-2xl p-1 transition ${seed === s ? "bg-brand/10 ring-2 ring-brand" : ""}`}
            >
              <UserAvatar config={{ style, seed: s, bg }} size={56} className="mx-auto" />
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => setSeeds(Array.from({ length: 8 }, () => randomSeed()))}>
            🎲 Shuffle
          </Button>
          <Button className="flex-1" disabled={saving} onClick={() => onSave(preview)}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
