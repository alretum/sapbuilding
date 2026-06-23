# Data handling & privacy

Decisions for the identity / data-sensitivity open question, so a regulated SME segment can engage safely. (PR D, plan item #12.)

## What we store

| Data | Stored? | Notes |
|---|---|---|
| Player identity | **First name only** | No accounts, no passwords, no email. A "player" is just a first name in a department. |
| Action answers | Yes (per player) | Quiz/swipe/etc. choices, used for scoring + the expert brief. Not personal data. |
| Company profile | Yes (per challenge) | Industry, country, SAP version, size, data sensitivity — set by SAP, confirmed by the decision-maker. Business attributes, not personal data. |
| Booking request (`/book`) | **No** | The EvoKit booking is a stub — name/email entered there are kept in browser state only and never persisted. |
| Tracking / analytics | **No** | None. |

So the only personal data at rest is **first names**. There is deliberately no PII beyond that.

## Public vs private (shipped in PR A)

- A challenge is **private by default** (`leaderboardPublic = false`).
- The cross-company **leaderboard and national map only show companies that explicitly opt in** (admin toggle).
- A company's score is never exposed publicly unless its admin chooses to — directly answering the "will a cautious firm want its low score shown?" concern.

## Before a real pilot

- Confirm the above with the customer's data office; add a short consent line at join if their policy requires it.
- If/when booking becomes real, persisting an email makes it personal data — add a privacy notice + retention policy at that point.
- Keep all data in an EU region (already the case for the self-hosted Postgres).
