"use client";

import type { ActionType } from "@/lib/content-schema";
import type { ActionProps } from "./types";
import { QuizAction } from "./QuizAction";
import { SwipeAction } from "./SwipeAction";
import { ChatbotAction } from "./ChatbotAction";

// The registry: action type -> component. This is the extension point.
// New type? Add a component above and one line here.
const REGISTRY: Record<ActionType, React.ComponentType<ActionProps>> = {
  quiz: QuizAction,
  swipe: SwipeAction,
  chatbot: ChatbotAction,
};

export function ActionRenderer({ action, onComplete }: ActionProps) {
  const Component = REGISTRY[action.type];
  if (!Component) {
    return <div className="text-sm text-red-600">Unsupported action type: {action.type}</div>;
  }
  return <Component action={action} onComplete={onComplete} />;
}
