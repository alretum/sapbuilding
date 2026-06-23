# Challenge Brief — Rebuild + AI Generation (design outline)

Status: **implemented** on branch `feat/ai-challenge-brief` (full slice + on-demand AI). Supersedes the
brief portion of [`improvement-plan.md`](./improvement-plan.md) PR C.

### What was built (vs. this outline)

- **Free-text status type** — `inputType: "text"` (`content-schema.ts` + `InputAction.tsx`) + one open-ended
  status prompt per department in `content/actions.json` (`*-open-status`).
- **Evidence pack** — `src/lib/evidence-pack.ts`: `buildEvidencePack()` (distributions + consensus,
  numeric ranges, verbatim free-text, knowledge-gap detection, coverage) + `evidenceHash()`.
- **BriefDoc + deterministic baseline** — `src/lib/brief-doc.ts`: the 8-section Zod schema +
  `buildDeterministicBriefDoc()` (always-available, also the AI fallback).
- **AI synthesis** — `src/lib/brief-ai.ts`: server-side Claude call (the *only* LLM use), forced
  tool-use → strict JSON → Zod validation → honesty linter → 1 retry → throw (caller falls back).
  Path is forced from the rules engine. Model via `BRIEF_MODEL` (default `claude-haiku-4-5`); kill-switch
  `BRIEF_AI_DISABLED`; key `ANTHROPIC_API_KEY` (all in `.env.example`).
- **Persistence + store** — `GeneratedBrief` table (additive migration `20260623150000_add_generated_brief`)
  + `src/lib/brief-store.ts`: `getBriefForSession()` (serve persisted if `inputHash` matches, else
  generate+persist), `ensureBriefForCompletedSession()` + `isSessionComplete()`. Cached by `inputHash`,
  survives restarts.
- **Auto-background generation** — the `action:complete` socket handler (`src/server/socket.ts`) calls
  `ensureBriefForCompletedSession()` fire-and-forget once every participant has finished; on success it
  emits a `brief:ready` event to the session room, which lights up a banner in `Dashboard.tsx`. So the
  decision-maker opens an already-generated brief instantly.
- **On-demand surface** — `GET /api/sessions/[code]/brief` (via the store) + `src/components/BriefView.tsx`
  (client, "Assembling…" state, 8-section render, source badge); `/brief/[code]` is a thin wrapper.

**Deltas from the outline:** `src/lib/brief.ts` and `src/components/PersonalizedRead.tsx` were superseded
and have been **deleted**. Concurrency guard on background generation is a `status:"generating"` claim row
(fine at this scale); a socket `brief:ready` event drives the dashboard banner.

---

## 0. Why the current brief is weak

What exists today (`buildBrief` → `/brief/[code]`):

- A header (company, profile chips, *Preparation %*, participant/department counts).
- **"What the team flagged"** — `summarize()` turns each completion into a *mechanical
  string* (e.g. `"Set the Vision — Strong Cloud Driver: …, …"`). It's a data dump, not a synthesis.
- **`PersonalizedRead`** — the rules-based recommendation (path, why, AI line, sovereignty,
  clock, peer proof, straight talk + real SAP links).

It is structurally fine but **reads like game telemetry plus a recommendation widget**, not a
board-ready decision document. The interview findings demand a different artifact.

---

## Part I — The brief, rebuilt

### The one-sentence anchor

> The Challenge brief is the **board-ready decision document** the champion takes internally to
> answer the three questions every C-suite asks — **is it worth it, can we afford the risk, and
> why now** — grounded in *this* company's situation and *its own people's* input.

It is **not** a game summary and **not** an S/4HANA ad. Its job: turn the champion into a credible
internal advocate.

### Five non-negotiables (each from the interviews)

1. **Speak the customer's business, not SAP's product.** Lead with their monthly close, their
   custom code, their competitors — not SAP features.
2. **Honesty over persuasion.** Name costs, effort, limits openly. A brief with no honest "cons"
   reads as marketing by definition.
3. **Evidence, not assertions.** Every claim needs a source: their own team's input, a real
   attributed peer, or a real SAP tool. Where we don't have the number, say so and point to SAP's
   real ROI tool — never invent one.
4. **Answer the board's actual questions.** Worth it (ROI, downside-tested), risk (what breaks /
   what mitigates), timing (why now vs. wait).
5. **It must be theirs.** Reads like the champion's own team assembled it — forwardable, with the
   company's specifics in it — not a SAP-branded handout.

### The litmus test (apply to every section)

> A skeptical CFO who assumes everything from SAP is marketing should be able to read this, find
> **nothing to dismiss as a sales pitch**, and forward it to their board **with their own name on
> it**. If a section fails that test, it's still a gimmick.

### The 8-section structure — and what data already feeds each

The game already captures almost everything these sections need. The table maps each section to
the **captured data** (action IDs from `content/actions.json`) and flags gaps.

| # | Section | What it contains | Feeder data (action IDs) | Gap |
|---|---------|------------------|--------------------------|-----|
| 1 | **Where this company stands today** | Factual snapshot: SAP version, *their* maintenance clock, size/profile, and the honest *"what we don't fully know yet."* | `Session` profile; `maintenanceClock()`; IT's `it-reality-check` ("Unknown" on Z-objects / "no clear overview" = explicit knowledge gaps); participation coverage (which roles didn't play) | None — but the "knowledge gap" framing must be *made* from IT answers + coverage, not asserted |
| 2 | **What our own people said** ★ | Synthesis of what each department flagged — the part no vendor deck can have. The org, not SAP, surfaced these. | **All** per-department completions: Finance pains (`finance-pain-benefit`, `finance-roi-builder`), IT custom-code reality (`it-reality-check`, `it-risk-radar`), Production bottlenecks + where live data is needed (`prod-bottleneck`, `prod-realtime`, `prod-downtime`), HR change blockers (`hr-resistance-ranking`, `hr-change-booster`), Captain's vision (`captain-vision`, `captain-risk`) | `summarize()` is too mechanical — needs a real per-department synthesis |
| 3 | **The honest case: what it's worth** | Value as *their outcomes*, not SAP features. A real attributed peer. **No fabricated ROI** — state value drivers in their terms, route to SAP's ROI calculator. | `finance-roi-builder` inputs (users, maint cost, close days, # Excel reports — *as drivers, not a computed € figure*); `prod-realtime` (their own estimates: downtime hrs, scrap %); `peersFor(industry)`; `SAP_ROI_CALCULATOR` | None — discipline is to **not** compute a savings number |
| 4 | **The honest case: cost, effort, what's hard** ★ | Plainly: real work (~6-month, disruption reality), customization doesn't all carry over, capex→opex shift, connected systems affected. | IT signals (`it-reality-check` modification depth, `it-cloud-fit`, `it-ops-check` coverage gaps), `standardCaveats()` | The cons must be **specific to their answers**, not generic boilerplate |
| 5 | **De-risking: disaster scenario + how it's handled** | What could go wrong + concrete mitigations (change mgmt, dress rehearsals, phased rollout, business continuity). Converts the loudest emotional blocker into a managed plan. | `prod-downtime` (what tolerates standstill least), `captain-risk` ranking, `finance-first-closing`, `prod-pp-risk-radar`, HR mitigations (`hr-starter-pack`, `hr-training-match`), Finance mitigations (`finance-shield`) | None — rich feeder data already exists |
| 6 | **Why now (grounded, not generic)** | Timing on *their* clock + *their* competitive context. Grounded urgency, not a countdown. | `maintenanceClock(sapVersion)`; `aiLine(industry)` (AI gap vs named competitors); cost-of-doing-nothing | Avoid the "do it all now" pressure customers resent — frame as *their* logic |
| 7 | **Which path, and why (show the work)** | Personalized GROW / RISE / **Prepare-first** with visible reasoning ("you said X, Y, Z → therefore this") + sovereignty line where it applies. | `recommend(profile)` (already has the honest PREPARE branch + `confident` flag); `sovereigntyLine()` | Make the reasoning *traceable to their inputs*, not a black box |
| 8 | **The concrete next step** | Not "buy the cloud" — **book the EvoKit**, with an honest statement of what that free session delivers and what they walk away with. | `BookEvoKitCTA` / `/book/[code]`; `SAP_READINESS_CHECK` | None — already the funnel endpoint |

★ = the two sections that separate this from a marketing page. **If the rebuild does only one thing,
make sections 2 and 4 real and prominent.**

### What to cut (the "gimmick" tells)

- ❌ Any fabricated/unsourced ROI or savings figure (already killed in PR A — keep it dead).
- ❌ Any "readiness" claim the tool can't back. The **Preparation Score is engagement, not technical
  readiness** — it does **not** belong in the brief as a headline metric (it's fine in the game).
- ❌ Any benefit stated as a SAP feature instead of the company's outcome.
- ❌ Confetti / game-score / points / "level-up" language anywhere in the brief.
- ❌ Peer "proof" not clearly labelled illustrative-vs-real (`peers.ts` is already labelled
  *"Illustrative — real attributed references on request."* — keep that honesty).

### Gap analysis vs. the current build

| Current | Target |
|---|---|
| `summarize()` → mechanical strings | `buildEvidencePack()` → decoded, themed, per-department facts (see Part II) |
| Header leads with **Preparation %** | Header leads with **company situation** (Section 1); score demoted/removed from the brief |
| Recommendation widget bolted on | Recommendation is **Section 7**, with reasoning traced to their inputs |
| No explicit cons section | **Section 4** is mandatory and specific |
| No de-risking section | **Section 5** built from risk-ranking/downtime/resistance data |
| Static, rules-only prose | Optional **AI synthesis layer** (Part II) over the same deterministic facts |

---

## Part II — Generating it intelligently with AI

The ask: collect all participant data in a digestible format, use a powerful frontier model to
analyze it and build a **custom** brief — triggered when the champion clicks "Challenge brief",
or **auto-generated in the background** once all participants finish, so the CEO opens it seamlessly.

### Guiding principle: **deterministic facts + AI synthesis** (not AI free-writing)

The model is good at *synthesis and voice* — turning structured signals into a coherent, board-ready
narrative in the company's language. It is **bad at** arithmetic, provenance discipline, and staying
on-brand. So split responsibilities:

- **Code computes the facts** (deterministic, auditable, already built):
  - the maintenance clock + dates (`maintenance.ts`),
  - the GROW/RISE/PREPARE recommendation + `confident` flag (`recommendation.ts` — stays
    authoritative; the model does **not** re-decide the path),
  - the decoded evidence pack (per-department signals),
  - participation coverage, peer proof selection.
- **The model synthesizes** those facts into the 8 sections, in the company's voice, obeying the
  honesty rules — and **may only cite facts that are in the pack.**

This makes the model a *writer over a fixed evidence base*, which is exactly what enforces
"evidence, not assertions."

### Architecture (3 stages)

```
  DB (Session + players + completions + payloads)
        │
        ▼
  [1] buildEvidencePack(session, content)        ← pure, deterministic, no PII
        │   { profile, clock, recommendation, coverage, departments[]: decoded signals }
        ▼
  [2] frontier model (Claude)  ── system prompt = the 5 principles + litmus test
        │   input: evidence pack (JSON) ; output: BriefDoc JSON (8 sections)
        ▼
  [3] validate (Zod) + honesty linter → store (GeneratedBrief) → render in existing card UI
        │
        └─ on any failure → fall back to the deterministic rules-based brief
```

### Stage 1 — The evidence pack (the heart of the design)

A generalization of today's `summarize()` into a **decoded, aggregated, themed** structure. The goal
is to **give the model a lot of grounded signal** — but as *de-identified aggregates*, not raw
per-player dumps. Two kinds of signal matter most.

**(a) Frequency distributions for every closed-form action.** Don't reduce a quiz / multiselect /
swipe / sort / match to one string — aggregate how the *whole team* answered, per option:

```jsonc
// finance-myth-fact (swipe), aggregated across 5 Finance players
{
  "action": "Cloud Myth or Finance Fact?",
  "theme": "finance knowledge / readiness",
  "respondents": 5,
  "items": [
    { "statement": "Compliance & audit trails only matter after go-live",
      "Myth": 2, "Fact": 3,            // ← the distribution
      "expected": "Myth",
      "consensus": "split",            // no clear majority → an alignment signal
      "signal": "3 of 5 think audit trails can wait → training/readiness gap (§4/§5)" }
  ]
}
```

For each closed-form action emit: `respondents`, the **per-option counts (+ %)**, the **modal**
answer, and a **`consensus` flag** (`aligned` / `split`). The distribution *is* the signal:

- **Consensus vs. split = an alignment signal** (a core interview finding: "get everyone aligned").
  A split is honest, board-relevant content — "IT and Finance disagree on X, worth resolving" — not
  something to hide.
- **The spread of *wrong* answers to knowledge questions = a readiness/training signal**, fed
  honestly into §4/§5 ("the team is unsure about audit-trail timing"), never as a score.
- It's the difference between "someone clicked d" and "the whole IT team independently estimates
  >2,000 Z-objects" — only the latter is board-credible.

**(b) Open-ended, no-right/wrong *status* answers — the highest-value context, prioritized.**
These describe *where the company actually stands*, in its own numbers/choices, and the model should
**lead Sections 1 and 2 with them.** They already exist in the content:

- `finance-roi-builder` (calculator): SAP users, annual ECC maintenance cost, days per monthly close,
  # manual Excel reports.
- `prod-realtime` (chatbot): *where* they most need live data + their own estimates (downtime
  hrs/week, scrap %, plan-vs-shopfloor drift).
- `prod-bottleneck` (swipe, **no correct side**): which steps the team feels are bottlenecks today.
- `it-reality-check` (scored, but the *answer is a status fact*): Z-object volume band, whether usage
  is known, modification depth, cleanup cadence.

For these, aggregate as a **distribution / range**, not a single number, and surface disagreement:

```jsonc
{
  "action": "ROI Quick Builder", "theme": "status: finance baseline", "statusSignal": true,
  "respondents": 3,
  "metrics": {
    "daysPerMonthlyClose": { "values": [5, 8, 8], "min": 5, "median": 8, "max": 8 },
    "manualExcelReports":  { "values": [12, 20], "min": 12, "max": 20 }   // 1 left it blank
  },
  "note": "Use as a value-driver in their terms (§3). Do NOT compute a € figure — route to SAP's ROI calculator."
}
```

Tag these `statusSignal: true` so the prompt routes them to the front of the brief.

Design rules for the pack:

- **No PII.** Strip player names; aggregate per *department*, never per person. Distributions are
  inherently de-identified — this is how we "give a lot of context" without leaking who said what.
  (Extends `data-handling.md`.)
- **Decode, don't dump.** Map every `payload` to human-meaningful facts (extend the per-type logic in
  `summarize()`). "Unknown" / "no overview" answers become explicit **knowledge-gap** signals (§1).
- **Aggregate, don't list.** Closed-form → frequency distribution + consensus; numeric/status →
  range + divergence. Never a wall of per-player rows.
- **Theme-tag + status-tag** each signal to the section(s) it serves, with `statusSignal` items
  prioritized to the front.
- **Carry coverage**: which involved roles never played, completion %, so the brief is honest about
  what's missing (reinforces honesty, feeds §1).
- **Deterministic + hashable** → the hash is the cache key (regenerate only when inputs change).

This stage is independently valuable: even with **no AI**, a richer pack makes the rules-based brief
much better. Build it first.

### Stage 2 — Model, prompt, output contract

- **Model:** a frontier Claude model (latest Opus for quality, or Sonnet for cost/latency — pick at
  build time; the brief is low-volume so quality is cheap). API key in env (`ANTHROPIC_API_KEY`),
  never shipped to the client; generation happens **server-side only**.
- **Output is structured JSON, not HTML/markdown.** The model returns a `BriefDoc` matching a strict
  **Zod schema** (one object per the 8 sections, each with typed fields + an optional `sources[]`
  array). The React page renders that JSON into the **existing card components** → deterministic,
  on-brand, no model-generated styling or confetti. Use tool-use / structured output to force schema
  conformance.
- **Deterministic fields are passed in and echoed, not generated:** clock dates, the recommended
  path, profile chips, ROI *inputs*. The model frames them; it doesn't compute or override them.

#### Honesty guardrails (the litmus test, encoded)

System prompt must enforce, and a **post-generation linter** must verify:

- **No invented numbers.** Any figure must trace to the evidence pack; otherwise omit it and point to
  `SAP_ROI_CALCULATOR`. Linter rejects unexplained `€`/`$`/`%` figures not present in the pack.
- **Sections 4 and 5 are mandatory and specific** (must reference the company's own flagged signals,
  not boilerplate). Linter checks they're non-empty and cite ≥1 pack signal.
- **No SAP-feature framing** as a benefit — must be expressed as the company's outcome.
- **Ban game/score/confetti vocabulary** (`points`, `level`, `confetti`, `readiness score`, …).
- **Peer proof labelled illustrative** unless flagged real.
- On linter failure → one regeneration with the violations fed back; if it still fails → **fall back
  to the deterministic brief**. The AI layer is never a hard dependency (critical for live demos).

### Stage 3 — Storage, triggers, lifecycle

**Storage (additive migration — consistent with the project's no-drop rule):**

```prisma
model GeneratedBrief {
  id          String   @id @default(cuid())
  sessionId   String   @unique          // one current brief per session
  inputHash   String                    // hash of the evidence pack → cache key
  status      String   @default("ready") // generating | ready | failed
  doc         Json                       // validated BriefDoc
  model       String                     // provenance
  promptVer   String
  generatedAt DateTime @default(now())
}
```

Store the evidence pack + prompt version + model alongside the output → **fully auditable** ("where
did this line come from?"). Good for trust and debugging.

**Two triggers:**

1. **On-demand** — clicking "Challenge brief":
   - If a `GeneratedBrief` exists with a matching `inputHash` → serve instantly.
   - Else generate with a friendly loading state ("Assembling your brief…"), then cache.

2. **Auto background** — when the **last participant finishes**:
   - Hook point: the `action:complete` handler in `src/server/socket.ts` (the custom server already
     hosts Socket.IO). After recording a completion, check `isSessionComplete()` (new helper: every
     involved role has ≥1 player and all players completed all their role's actions).
   - If complete and no fresh brief exists → **fire-and-forget** generation (set `status:"generating"`
     first to guard against races; one company / a few dozen players = no queue needed).
   - When done, **emit a socket event** (`brief:ready`) so an open dashboard lights up "Brief ready
     →". The CEO opens it with zero wait.

**Concurrency / idempotency:** the `status:"generating"` flag + `inputHash` check prevents double
generation when requests race. Regeneration happens only when the pack hash changes (someone played
more after the brief was built).

### Privacy & data residency (must document before a pilot)

- The pack contains **business attributes + aggregated, de-identified answers** — **no PII**
  (first names are stripped; `data-handling.md` already establishes first-name-only storage).
- Sending the pack to an external model API leaves the EU-hosted VPS. Before a real pilot: confirm
  with the customer's data office, prefer a **zero-retention / no-training** API arrangement, and add
  a line to `data-handling.md`. For the demo this is acceptable (no PII leaves; only business facts).
- **Fallback path means a customer who forbids external API calls still gets the (deterministic)
  brief** — the AI layer can be disabled per-deployment with an env flag.

### Cost & latency

- One generation per company **per data change** → trivial volume; quality model is affordable.
- Latency ~10–30 s → hidden by background generation; on-demand shows a progress state.
- Aggressive caching by `inputHash` means near-zero repeat cost.

---

## Phasing (recommended build order)

1. **Restructure the brief to the 8 sections (deterministic only).** Rewrite `brief.ts` +
   `/brief/[code]` around sections 1–8; demote the Preparation Score out of the brief; make
   sections 2, 4, 5 real from existing data. *Ships value with zero AI risk.*
2. **`buildEvidencePack()`** — generalize `summarize()` into decoded, themed, de-identified signals
   (incl. knowledge-gap detection + coverage). Improves the deterministic brief immediately and is
   the input contract for AI.
3. **AI synthesis layer** — `BriefDoc` Zod schema, server-side Claude call, honesty linter,
   fallback to deterministic. On-demand only, with caching.
4. **Auto-background generation** — `isSessionComplete()` + the `action:complete` hook + `brief:ready`
   socket event, so the CEO opens a ready brief seamlessly.
5. **Champion ownership polish** — print/PDF export already exists (`PrintButton`); optionally add
   "regenerate" and a downloadable, name-on-it export.

## Open decisions

- **Model:** Opus (quality) vs Sonnet (cost/latency) for generation. *Recommendation: Opus — volume
  is tiny, quality matters most for a board document.*
- **AI as enhancement vs. default:** ship the deterministic 8-section brief as the baseline always;
  AI layer **on** by default with env kill-switch. *Recommended.*
- **Score in the brief:** remove entirely, or keep only as a small "engagement" footnote? *Lean:
  remove from the brief; it lives in the game/dashboard.*
- **External-API consent:** demo-acceptable now; needs data-office sign-off + zero-retention terms
  before a real pilot.
- **Capture true free-text status?** The richest open-ended context — e.g. *"in one line, the most
  painful thing about our current SAP setup"* — needs a `text` input type; the `input` action only
  supports `number`/`slider` today (`content-schema.ts`). Adding it + one status prompt per
  department would give the model its highest-value material, and clustering free-text answers is
  exactly what an LLM is good at. Pure content/schema add, no scoring change. *Recommended as a fast
  follow once the distribution-based pack is in.*
```
