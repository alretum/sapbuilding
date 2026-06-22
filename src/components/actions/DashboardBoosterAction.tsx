"use client";

import { useState } from "react";
import type { DashboardBoosterPayload } from "@/lib/content-schema";
import type { ActionProps } from "./types";
import { Button } from "../ui";
import { motion } from "framer-motion";

export function DashboardBoosterAction({ action, onComplete }: ActionProps) {
  const payload = action.payload as DashboardBoosterPayload;
  const [boosted, setBoosted] = useState(false);

  function finish() {
    onComplete({ actionId: action.id, score: action.points, payload: { boosted: true } });
  }

  return (
    <div className="space-y-5">
      <p className="font-semibold">{payload.prompt}</p>

      {!boosted ? (
        <Button onClick={() => setBoosted(true)} className="w-full">
          Review Dashboard & Send Booster
        </Button>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
          <div className="rounded-xl bg-green-50 p-4 text-center text-sm text-green-800">
            ✅ Booster sent! The lagging department has been notified.
          </div>
          <Button onClick={finish} className="w-full">
            Collect {action.points} points →
          </Button>
        </motion.div>
      )}
    </div>
  );
}
