"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ChatbotPayload } from "@/lib/content-schema";
import type { ActionProps } from "./types";
import { Button } from "../ui";

// Scripted decision-tree chatbot. Walks `nodes` starting at `start`; each option
// advances to `next`; a node with `end: true` (or no options) finishes. The path
// the user took is returned in the payload. Deterministic, no LLM — the same
// component interface would accept an LLM-backed version later.
type ChatLine = { from: "bot" | "user"; text: string };

export function ChatbotAction({ action, onComplete }: ActionProps) {
  const payload = action.payload as ChatbotPayload;
  const startNode = payload.nodes[payload.start];

  const [nodeId, setNodeId] = useState(payload.start);
  const [history, setHistory] = useState<ChatLine[]>(
    startNode ? [{ from: "bot", text: startNode.bot }] : [],
  );
  const [path, setPath] = useState<string[]>([payload.start]);

  const node = payload.nodes[nodeId];
  const finished = !node || node.end || !node.options || node.options.length === 0;

  function pick(label: string, next: string) {
    const nextNode = payload.nodes[next];
    setHistory((h) => [
      ...h,
      { from: "user", text: label },
      ...(nextNode ? [{ from: "bot" as const, text: nextNode.bot }] : []),
    ]);
    setPath((p) => [...p, next]);
    setNodeId(next);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {history.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={line.from === "bot" ? "flex justify-start" : "flex justify-end"}
          >
            <span
              className={[
                "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                line.from === "bot" ? "bg-black/5 text-ink" : "bg-brand text-white",
              ].join(" ")}
            >
              {line.text}
            </span>
          </motion.div>
        ))}
      </div>

      {!finished && node?.options ? (
        <div className="space-y-2">
          {node.options.map((o, i) => (
            <Button key={i} variant="ghost" className="w-full text-left" onClick={() => pick(o.label, o.next)}>
              {o.label}
            </Button>
          ))}
        </div>
      ) : (
        <Button
          className="w-full"
          onClick={() => {
            const userAnswers = history.filter((line) => line.from === "user").map((line) => line.text);
            onComplete({ actionId: action.id, score: action.points, payload: { path, answers: userAnswers } });
          }}
        >
          Collect {action.points} points →
        </Button>
      )}
    </div>
  );
}
