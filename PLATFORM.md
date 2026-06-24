# Cloud Readiness Challenge — Platform Overview

*A detailed, honest description of what the platform does and how it works, for critical evaluation. Reflects the current build (deployed at https://sap.reyers.dev).*

---

## 1. In one paragraph

The **Cloud Readiness Challenge** is a free, playful, multiplayer web game that companies run internally as a **team-building exercise and a first touchpoint** for moving from **SAP ECC to SAP S/4HANA Cloud**. Employees from different departments join with a code, play short, light "actions" (quizzes, swipes, chatbots, a ROI calculator, etc.), and earn **readiness points** for their department. All departments' scores combine into a single live **company Readiness Score**. Companies also compete against each other on a national leaderboard and a map of Germany. The goal is **not** to prepare a real migration — it is to spark curiosity, defuse the intimidation around the topic, and make the abstract benefits of the cloud feel concrete and personal, especially for decision-makers.

## 2. The problem it is built around

From customer research, the central insight the product is designed to attack is an **asymmetry**:

> Every *pain* of staying on SAP ECC is **concrete and felt today** (slow reporting, custom-code sprawl, fear of a disruptive migration, no defensible business case). Every *benefit* of the cloud is **abstract and arrives later** (real-time insight, AI, lower long-term TCO, continuous innovation).

That asymmetry is why the move stalls. The platform's theory of change is: **a low-stakes, hands-on, gamified experience can make the benefits feel as specific and present as the pains** — and get a whole organisation curious and aligned *before* any real, intimidating project starts.

## 3. Who it is for

- **Mid-size SAP customers** (initial focus: Germany) still running SAP ECC.
- **Employees across departments** — the active players.
- **Decision-makers** (CEO/CTO/CFO/IT leaders) — both as players (the "Captain" role) and as the audience for the business case.
- **SAP / SAP partners** — who set up and offer the challenge to customers.

## 4. Core concept and mechanics

A **challenge** is one company's instance of the game (internally this is a "session"). Lifecycle:

1. **Setup (by SAP/partner).** An admin creates a challenge for a company at `/admin`, names it, picks which departments take part, and gets a short **join code**.
2. **Join (employees).** Employees go to the site, enter the code, pick their **department**, and pick or type their **name**. There are **no passwords or accounts** — identity is just a name in a department.
3. **Play.** Each player sees the 2–4 light actions assigned to their department and completes them. Each completion awards points with instant feedback (points count up, confetti, an avatar level).
4. **Readiness rises.** Points roll up into a department score and a single live **company Readiness Score**, visible to everyone in real time.
5. **Compete.** The company's score also places it on a cross-company leaderboard and lights up its region/city on a national map.

The emotional design target is **"play first, light but meaningful"**: actions take ~1–2 minutes, feel fun, and deliver a small slice of genuine reflection (a first pain-point check), without homework or real system access.

## 5. Roles / departments

Each department is a **role** with its own identity, colour, avatar and set of actions. The current roles (recently consolidated; content is still evolving):

| Role | Department | Character |
|---|---|---|
| **Captain** | CEO / Management | Sets vision & commitment; sees everyone; can "boost" a lagging department |
| **Finance-Pros** | Finance | Reporting, real-time numbers, the ROI/business case |
| **Tech Team** | IT | Custom code, clean core, data quality |
| **Ops-Heroes** | Production / Supply Chain | Processes & workflows |

The **Captain is a playing role**, not just a spectator. The set of roles is configurable per challenge.

## 6. Actions and the content model

Everything players do is an **action**. Actions are **data-driven** — defined as JSON in the repo (`/content`), validated on load — so new content needs no code, and the game's questions/copy are fully configurable. There are seven **action types**, each rendered by its own interactive component:

- **quiz** — one or more multiple-choice questions; can be knowledge questions (with a correct answer + explanation) or opinion polls.
- **swipe** — Tinder-style cards sorted left/right into two labelled buckets (e.g. "Hot / Cold", "Too slow / Fine").
- **chatbot** — a scripted branching dialogue (no AI/LLM) that ends in a small outcome, e.g. the Captain locking in a visible commitment.
- **calculator** — enter rough numbers (e.g. # of SAP users, annual ECC maintenance cost, days per monthly close, # of custom developments) → see an estimated savings/ROI figure. This is the most direct attempt to make value *tangible*.
- **sort** — categorise a list of items.
- **input** — enter a single number or set a slider (e.g. "how many days does your monthly close take?").
- **dashboard-booster** — a Captain-only action: review every department's status and send an encouraging "booster" to a lagging one.

Representative content today: Captain — "Set the vision" (swipe), "Make your commitment" (chatbot), "The business case in 90 seconds" (quiz), "Dashboard Check" (booster). Finance — "ROI Calculator" (calculator), "Tag the slow reports" (swipe), "Close check" (input), "What changes with real-time reporting?" (quiz). Etc.

> Scope note: content is **placeholder/illustrative and actively being authored**. It demonstrates mechanics; it is not a validated readiness assessment.

## 7. Scoring model

Scores are always **derived** from the log of completed actions (never stored as mutable counters), so the live view is always consistent.

- **Member readiness** = a player's earned points ÷ the maximum points available for their department. Each member is expected to complete *all* of their department's actions.
- **Department readiness** = the **average** of its members' readiness. So a department is only fully ready when **everyone** finishes everything.
- **Company Readiness Score** = the **arithmetic mean** of all involved departments' readiness (0–100%). A department that hasn't started counts as 0% and drags the mean down — this is the deliberate "we're only ready when everyone's ready" mechanic. (An optional stricter "gate" can scale the score by how many departments have started.)
- **Levels** — each department earns avatar levels (0–5) from its readiness.
- **Derived extras** — the Finance ROI calculator feeds an estimated company **savings figure**; the Captain's booster sets a flag the dashboard can react to.

In the prototype, the score primarily measures **engagement and awareness**, not technical migration readiness — completing an action generally awards its full points (it's about participation, not "passing").

## 8. Screens and user flows

- **`/` — Landing (employees & general).** A marketing-style page: a hero, an **interactive "Try it" demo** that runs the *real* quiz/swipe/chatbot components with fake scoring + confetti + a rising readiness meter (try one question, or keep going), a department showcase, a how-it-works, leaderboard + map teasers, and the **join flow**.
- **`/landing` — Decision-maker page.** The business case, organised around the "pains felt now vs. benefits arrive later" asymmetry: six concrete pain points, a bridging statement, six cloud benefits, how the challenge de-risks the move, and an illustrative leader's dashboard.
- **Join flow.** Code → department → name (pick an existing name to resume, or add a new one). No credentials.
- **`/play` — The player view.** The player's department actions as a feed, each opening a bottom-sheet with the interactive action. Header shows the player's editable **avatar**, points, level and live rank. Completing an action triggers confetti, a points count-up, and (on finishing all) a bigger celebration.
- **`/dashboard` — Live company dashboard.** The company Readiness Score as an animated gauge, every department side by side (progress bars, levels, a crown on the leader), and the **internal employee leaderboard**. Used both as the shared "big screen" and by participants.
- **`/leaderboard` — Cross-company leaderboard.** Every (public) company ranked by Readiness Score, updating live.
- **`/map` — National readiness map.** A stylised, colour-coded map of Germany (regions → city bubbles) showing aggregated readiness; companies' locations are set at setup.
- **`/admin` — SAP/partner setup.** Create a company challenge (name, departments, location), see existing challenges, delete one (with a type-the-name confirmation). Gated by an admin key.

## 9. Social / competitive layer

- **Internal employee leaderboard** — every employee ranked by their own points company-wide (visible on the dashboard), for friendly intra-company motivation.
- **Cross-company leaderboard** — companies vs. companies nationally.
- **Germany readiness map** — regions and cities light up by aggregated readiness as more companies and teams play.
- **Avatars** — every player gets a random generated avatar on join (no onboarding step) and can optionally edit it; shown across the leaderboards.
- **Real-time** — scores, leaderboards and the map update live (WebSockets) as anyone, anywhere, completes an action.

## 10. Design intent (theory of change)

How the design *tries* to address the known blockers (claims of intent, not proof):

- **"I can't see/trust the value."** → The ROI calculator turns it into your own number; quizzes connect benefits to daily work; a low-stakes self-serve taste replaces a vendor slide deck.
- **"No business case for leadership."** → The decision-maker page + the leader's dashboard aim to give a champion concrete, internal evidence.
- **"Fear of a disruptive migration."** → It is explicitly *not* a migration: no real data, no systems touched, no homework — a safe first step.
- **"Change resistance / leadership inertia."** → Gamified, all-departments play turns the human lift into curiosity, and makes the CEO a visible participant.
- **Making benefits felt now** → confetti, instant points, a rising score, and competition are designed to give the *abstract later-benefits* an immediate, emotional, present-tense feel.

## 11. Deliberately NOT in scope

- No real SAP data integration (no Readiness Check, no custom-code scan, no system access).
- No real migration steps or homework.
- No authentication against real company systems (the "login" is just a name).
- Content and several visuals are **placeholder/illustrative**, meant to convey look, feel and mechanics.

## 12. Current state and honest limitations

- It is a **working prototype**, live and deployable, but the **game content is still being authored** and the scoring is engagement-based, not a validated readiness measure.
- The **ROI calculator uses rough heuristics**, not customer-specific modelling.
- Some teaser data (sample companies on the landing page, parts of the map demo) is **illustrative**.
- Roles were **recently consolidated** from six to four; some surfaces (e.g. the landing page's department showcase) may not yet reflect the latest roles.
- "Readiness" measures **participation and awareness**, not technical fit — a company could score 100% and still face a hard migration.
- No accounts means **no real identity, security, or data-sensitivity controls** yet (a flagged open question, e.g. whether a company wants its score shown publicly).

## 13. Tech (brief)

Next.js 16 (React) + TypeScript single web app with a custom server hosting **Socket.IO** for realtime; **PostgreSQL + Prisma**; **Tailwind CSS** for a custom playful brand; content as validated JSON. Self-hosted via Docker (web + Postgres) behind nginx with TLS, auto-deployed from `main` via GitHub Actions. Mobile-first (most play happens on phones).

---

*Questions a critical reviewer might probe: Does an engagement score that isn't real readiness help or mislead a buyer? Does the ROI calculator build trust or invite the same "is this marketing?" skepticism customers had about vendor numbers? Is "make benefits feel present" enough to move a risk-averse, cost-sensitive SME, or does it need to connect to a concrete next step? Does competing publicly on readiness help adoption or scare cautious companies off?*
