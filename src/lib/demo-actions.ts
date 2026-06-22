import type { ActionConfig } from "@/lib/content-schema";

// Self-contained sample actions for the landing-page demo. They use the exact
// same shapes as the real game, so the landing renders the real Quiz/Swipe/
// Chatbot components — a genuine taste, no backend, no login.
export const DEMO_ACTIONS: ActionConfig[] = [
  {
    id: "demo-quiz",
    roleId: "demo",
    type: "quiz",
    title: "Quick one — what changes first?",
    subtitle: "No login. Just a taste.",
    points: 120,
    payload: {
      questions: [
        {
          id: "q1",
          prompt: "What's the biggest day-one win of moving to S/4HANA Cloud?",
          options: [
            { id: "a", label: "Reports still run overnight in batches", correct: false },
            { id: "b", label: "Real-time insight on live data", correct: true },
            { id: "c", label: "Even more spreadsheets", correct: false },
          ],
          explanation: "In-memory processing means you analyse live operational data — no waiting for the nightly batch.",
        },
      ],
    },
  },
  {
    id: "demo-swipe",
    roleId: "demo",
    type: "swipe",
    title: "Hot or cold?",
    subtitle: "Sort what comes along to the cloud.",
    points: 100,
    payload: {
      prompt: "How alive is this data?",
      leftLabel: "Cold (archive)",
      rightLabel: "Hot (keep live)",
      cards: [
        { id: "d1", label: "Open customer orders" },
        { id: "d2", label: "Invoices from 2011" },
        { id: "d3", label: "Current stock levels" },
      ],
    },
  },
  {
    id: "demo-chat",
    roleId: "demo",
    type: "chatbot",
    title: "Set a tiny commitment",
    subtitle: "Like the Captain does on day one.",
    points: 80,
    payload: {
      start: "intro",
      nodes: {
        intro: {
          bot: "If your team tried this, what's the vibe in the room?",
          options: [
            { label: "Curious & up for it", next: "done" },
            { label: "A bit nervous, honestly", next: "done" },
          ],
        },
        done: { bot: "Logged! That's exactly how the real challenge gets rolling. 💛", end: true },
      },
    },
  },
];

export const DEMO_MAX_POINTS = DEMO_ACTIONS.reduce((sum, a) => sum + a.points, 0);
