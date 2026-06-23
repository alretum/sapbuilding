import { z } from "zod";

// ---------------------------------------------------------------------------
// Content schema — the single source of truth for what roles & actions exist.
// Everything here is data-driven: add a role or an action by editing the JSON
// in /content, no code changes. New *types* of action need a component + a
// registry entry (see src/components/actions/ActionRenderer.tsx).
//
// This file is pure (no fs / no Node APIs) so its TYPES can be imported safely
// from client components via `import type`.
// ---------------------------------------------------------------------------

export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  department: z.string(),
  character: z.string(),
  color: z.string(),
  avatar: z.string(),
  blurb: z.string(),
});

// ---- Per-type payloads -----------------------------------------------------

export const quizPayloadSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string(),
        prompt: z.string(),
        options: z
          .array(
            z.object({
              id: z.string(),
              label: z.string(),
              // `correct` optional: knowledge questions mark right answers,
              // opinion/poll questions simply omit it.
              correct: z.boolean().optional(),
              points: z.number().optional(),
            }),
          )
          .min(2),
        explanation: z.string().optional(),
      }),
    )
    .min(1),
});

export const swipePayloadSchema = z.object({
  prompt: z.string(),
  leftLabel: z.string(),
  rightLabel: z.string(),
  cards: z.array(z.object({ id: z.string(), label: z.string(), hint: z.string().optional(), correctSide: z.enum(["left", "right"]).optional() })).min(1),
});

export const chatbotPayloadSchema = z.object({
  start: z.string(),
  // Zod 4 requires an explicit key schema for z.record.
  nodes: z.record(
    z.string(),
    z.object({
      bot: z.string(),
      options: z.array(z.object({ label: z.string(), next: z.string() })).optional(),
      end: z.boolean().optional(),
    }),
  ),
});

// ---- Action + Content ------------------------------------------------------

export const matchPayloadSchema = z.object({
  prompt: z.string(),
  items: z.array(z.object({ id: z.string(), label: z.string() })).min(1),
  targets: z.array(z.object({ id: z.string(), label: z.string() })).min(1),
  correctMatches: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
  randomLimit: z.number().optional(),
});

export const multiselectPayloadSchema = z.object({
  prompt: z.string(),
  options: z.array(z.object({ id: z.string(), label: z.string(), correct: z.boolean().optional() })).min(1),
  maxSelect: z.number().optional(),
  randomLimit: z.number().optional(),
  pointsPerCorrect: z.number().optional(),
  penaltyPerWrong: z.number().optional(),
});

export const actionTypeSchema = z.enum(["quiz", "swipe", "chatbot", "calculator", "sort", "input", "dashboard-booster", "match", "multiselect"]);
export const calculatorPayloadSchema = z.object({
  fields: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      optional: z.boolean().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    })
  )
});

export const sortPayloadSchema = z.object({
  prompt: z.string(),
  items: z.array(z.object({ id: z.string(), label: z.string() })).min(2),
  correctOrder: z.array(z.string()).optional(),
});

export const inputPayloadSchema = z.object({
  prompt: z.string(),
  inputType: z.enum(["number", "slider"]),
  min: z.number().optional(),
  max: z.number().optional(),
  unit: z.string().optional(),
});

export const dashboardBoosterPayloadSchema = z.object({
  prompt: z.string(),
});

export const actionSchema = z.object({
  id: z.string(),
  roleId: z.string(),
  type: actionTypeSchema,
  title: z.string(),
  subtitle: z.string().optional(),
  points: z.number().int().positive(),
  // Validated per-type at load time (see src/lib/content.ts).
  payload: z.unknown(),
});

export const contentSchema = z.object({
  roles: z.array(roleSchema),
  actions: z.array(actionSchema),
});

// ---- Inferred types --------------------------------------------------------

export type Role = z.infer<typeof roleSchema>;
export type ActionType = z.infer<typeof actionTypeSchema>;
export type ActionConfig = z.infer<typeof actionSchema>;
export type QuizPayload = z.infer<typeof quizPayloadSchema>;
export type SwipePayload = z.infer<typeof swipePayloadSchema>;
export type ChatbotPayload = z.infer<typeof chatbotPayloadSchema>;
export type CalculatorPayload = z.infer<typeof calculatorPayloadSchema>;
export type SortPayload = z.infer<typeof sortPayloadSchema>;
export type InputPayload = z.infer<typeof inputPayloadSchema>;
export type DashboardBoosterPayload = z.infer<typeof dashboardBoosterPayloadSchema>;
export type MatchPayload = z.infer<typeof matchPayloadSchema>;
export type MultiselectPayload = z.infer<typeof multiselectPayloadSchema>;
export type Content = z.infer<typeof contentSchema>;

// Map of action type -> its payload schema, used to validate payloads on load.
export const payloadSchemas = {
  quiz: quizPayloadSchema,
  swipe: swipePayloadSchema,
  chatbot: chatbotPayloadSchema,
  calculator: calculatorPayloadSchema,
  sort: sortPayloadSchema,
  input: inputPayloadSchema,
  "dashboard-booster": dashboardBoosterPayloadSchema,
  match: matchPayloadSchema,
  multiselect: multiselectPayloadSchema,
} as const;
