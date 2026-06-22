# Improvement Plan — post-evaluation

Turning the critical evaluation (customer interviews + SAP brief) into shippable changes.

**The reframe that makes it all cohere:** the game already captures everything a *personalized read* and a *handoff brief* need (who engaged, which pains each department tagged, the Captain's vision, the ROI inputs, the company profile) — but it currently dead-ends in a score. Make that data flow into **(a) an honest personalized read** and **(b) a handoff brief + a booked next step**, and stop overclaiming. That's the whole plan.

Done as separate PRs, in order. Every DB migration is **additive** (no drops/renames) so any PR can be reverted with `git revert` + auto-redeploy without touching data.

---

## PR A — Stop overclaiming (credibility) — *demo-critical, low risk*

- [ ] **Rename the score** "Readiness Score" → **"Preparation Score"**, with the honest subtitle *"how engaged and aligned your organization is."* Display strings only (internal field names stay `readiness` to limit churn). Renames the map labels too ("Preparation Map"). **Product name "Cloud Readiness Challenge" stays** (brand/domain) — only the *score* is renamed.
- [ ] **Kill the fabricated ROI number.** It currently shows in two places: the ROI Calculator action ("Annual Savings: ~€X", from `users×500 + maint×0.2`) and the dashboard ("Calculated Savings Potential: ~€X/year"). Remove both. **Keep collecting the inputs** (great brief material). Replace the calculator's output with an honest line + a handoff to **SAP's official value/ROI calculator** *(real URL TBD)*, plus a peer-outcome teaser.
- [ ] **Competition opt-in by default.** Set `Session.leaderboardPublic` default → **false**; add the missing `leaderboardPublic` filter to `/api/map` (it currently leaks all located companies); add an admin "List us publicly (optional)" toggle, unchecked. Internal/intra-company leaderboard stays always-on. (Seed-map keeps demo companies public so the map demo stays populated.)
- [ ] **Honesty posture (copy)** on `/landing`: acknowledge migration is real work; show honest trade-offs.

## PR B — Personalized read, their clock, peer proof — *demo-critical*

- [ ] **Profile capture via a simulated pre-filled email.** SAP pre-fills the company profile (industry, country, SAP version, size, data sensitivity, priorities) from a seeded "known companies" list. The decision-maker gets a personalized link; for the demo, the admin "created" screen shows a **rendered email-preview card** with a "Confirm your profile →" button (+ copyable magic link) → a **`/welcome/[token]` pre-filled confirmation page** → confirm/edit. Adds `Session` profile fields + `profileToken` + `profileConfirmedAt` (additive migration).
- [ ] **Recommendation engine** (`src/lib/recommendation.ts`, rules-based): inputs → likely path (GROW / RISE / **"not yet"**), the AI you'd unlock, whether sovereignty applies, what peers chose. Includes an honest "now may not be your moment" branch.
- [ ] **Grounded urgency** (`src/lib/maintenance.ts`): SAP version → mainstream-maintenance end date → a personalized "your clock is [date]" line.
- [ ] **Peer benchmark** (`src/lib/peers.ts`): attributed, clearly-labelled outcomes by industry/size ("manufacturers your size cut monthly close 8→2 days; most chose RISE"). Illustrative now; real SAP references before a pilot.
- [ ] **"Your cloud path"** decision-maker view (dashboard or `/path`), pairing the (honest) read with the Preparation Score.

## PR C — Close the funnel: brief + booked next step — *demo-critical, the differentiator*

- [ ] **Auto-generate the expert brief** (`src/lib/brief.ts`): aggregate the data already captured (profile, pains each department tagged, Captain's vision, ROI inputs, the recommendation) into a one-page printable brief. New `/brief` page + `/api/sessions/[code]/brief`, linked from the dashboard. Delivers the brief's "reduce expert orientation time."
- [ ] **"Book your EvoKit" CTA** at the end of the player journey *and* on the dashboard. Demo: CTA → request-a-session stub / calendar link. The journey ends in a **next step**, not confetti.
- [ ] **Conviction artifact**: the brief doubles as the leadership-ready business-case summary the Captain can show.

## PR D — Audience fit & data — *fast-follow*

- [ ] **Role-true content** — coordinate with teammate (owns `/content`); replace placeholders with genuine per-department value slices.
- [ ] **Identity / data handling** — confirm minimal PII (first name only), document handling; public/private already shipped in PR A.

## PR E — Real peer experiences — *fast-follow, content-heavy*

- [ ] **Peer-experience library**: real short quotes / mini case studies / video from same-industry companies that already migrated, surfaced to decision-makers ("here's how a CFO in food retail who's done it sees it"). Mirrors the research (Jollibee flew to Australia to hear YUM Brands). Eventually sourced from SAP's reference-customer program.

---

## Rollback
Merged PRs revert cleanly: `git revert -m 1 <merge-sha>` (merge commit) or `git revert <sha>` (squash) → push → the deploy Action auto-ships the rollback. Non-destructive. The only caveat is DB migrations — kept **additive**, so reverted code just ignores the unused columns (data safe; the Postgres volume persists). Separate PRs ⇒ selective rollback.
