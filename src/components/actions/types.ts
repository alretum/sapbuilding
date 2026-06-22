import type { ActionConfig } from "@/lib/content-schema";

// The single contract every action type implements. Add a new action type by
// writing a component with this shape and registering it in ActionRenderer.
export interface ActionResult {
  actionId: string;
  score: number; // points to award; the server clamps to the action's max
  payload?: unknown; // raw answers/choices, stored for later analysis
}

export interface ActionProps {
  action: ActionConfig;
  onComplete: (result: ActionResult) => void;
}
