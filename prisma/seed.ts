import { prisma } from "../src/lib/prisma";
import { getContent } from "../src/lib/content";
import { defaultAvatar } from "../src/lib/avatar-config";
import { buildEvidencePack, evidenceHash } from "../src/lib/evidence-pack";

// Creates a fixed demo session with code "DEMO" customized for Dr. Sabine Wagner
// and Hartmann Antriebstechnik, with pre-seeded starting scores and cached brief.
async function main() {
  const content = getContent();

  // Clear existing DEMO session if present (cascade deletes players, completions, briefs)
  const existing = await prisma.session.findUnique({ where: { code: "DEMO" } });
  if (existing) {
    await prisma.session.delete({ where: { code: "DEMO" } });
    console.log("Cleared existing DEMO session.");
  }

  // 1. Create the Session
  const session = await prisma.session.create({
    data: {
      code: "DEMO",
      name: "Hartmann Antriebstechnik",
      involvedRoles: content.roles.map((r) => r.id),
      status: "active",
      startedAt: new Date(),
      isDemo: true,
      leaderboardPublic: true,
      regionCode: "DE-BW",
      city: "Stuttgart",
      lat: 48.7758,
      lng: 9.1829,
      industry: "Industrial Machine Builder (Family-owned)",
      country: "Germany",
      sapVersion: "SAP ECC",
      companySize: "~1,200",
      dataSensitivity: "High (Family-owned / IP protection)",
      profileToken: "DEMO_TOKEN",
      profileConfirmedAt: new Date(),
    },
  });
  console.log('Created Hartmann session — join code "DEMO".');

  // 2. Pre-seed Players and starting completions
  // Target readiness:
  // - Captain: ~55% of 255 pts = 140 pts
  // - Finance (Finance-Pros): 38% of 280 pts = 106 pts
  // - IT (Tech Team): ~85% of 230 pts = 195 pts
  // - Production (Ops-heroes): ~70% of 230 pts = 161 pts
  // - HR (People-Chamions): ~60% of 230 pts = 138 pts

  const playersData = [
    {
      name: "Birgit",
      roleId: "captain",
      completions: [
        { actionId: "captain-vision", score: 50 },
        { actionId: "captain-decision", score: 50 },
        { actionId: "captain-open-status", score: 30 },
        { actionId: "captain-booster", score: 10 },
      ],
    },
    {
      name: "Dr. Sabine Wagner",
      roleId: "finance",
      completions: [
        { actionId: "finance-myth-fact", score: 40 },
        { actionId: "finance-report-rescue", score: 40 },
        { actionId: "finance-open-status", score: 26 },
      ],
    },
    {
      name: "Andreas",
      roleId: "it",
      completions: [
        { actionId: "it-reality-check", score: 40 },
        { actionId: "it-cloud-fit", score: 40 },
        { actionId: "it-risk-radar", score: 40 },
        { actionId: "it-decision-gate", score: 40 },
        { actionId: "it-open-status", score: 30 },
        { actionId: "it-ops-check", score: 5 },
      ],
    },
    {
      name: "Hans",
      roleId: "production",
      completions: [
        { actionId: "prod-bottleneck", score: 40 },
        { actionId: "prod-downtime", score: 40 },
        { actionId: "prod-realtime", score: 40 },
        { actionId: "production-open-status", score: 30 },
        { actionId: "prod-pp-risk-radar", score: 11 },
      ],
    },
    {
      name: "Petra",
      roleId: "hr",
      completions: [
        { actionId: "hr-change-booster", score: 40 },
        { actionId: "hr-training-match", score: 40 },
        { actionId: "hr-open-status", score: 30 },
        { actionId: "hr-resistance-ranking", score: 28 },
      ],
    },
  ];

  for (const p of playersData) {
    const player = await prisma.player.create({
      data: {
        sessionId: session.id,
        name: p.name,
        roleId: p.roleId,
        avatar: JSON.stringify(defaultAvatar()),
      },
    });

    const completions = p.completions.map((c) => ({
      sessionId: session.id,
      playerId: player.id,
      actionId: c.actionId,
      roleId: p.roleId,
      score: c.score,
    }));

    await prisma.actionCompletion.createMany({ data: completions });
  }
  console.log("Pre-seeded players and completions for DEMO session.");

  // 3. Hand-craft the Perfect BriefDoc for Sabine Wagner
  const briefDoc = {
    headline: "Hartmann Antriebstechnik: is the move to SAP S/4HANA Cloud worth it, can we manage the risk, and why now?",
    standToday: {
      summary: "Where Hartmann Antriebstechnik stands today — the facts this decision rests on, including what isn't fully known yet.",
      facts: [
        "SAP version: SAP ECC (on ECC for 20 years).",
        "Profile: ~1,200 · Industrial Machine Builder (Family-owned) · Germany.",
        "Maintenance clock: Mainstream support ends December 2027.",
        "Data sensitivity: High (Family-owned / IP protection).",
        "8 participant(s) across 4 of 5 departments completed their input tasks."
      ],
      unknowns: [
        "Not all teams have weighed in yet: Tech Team.",
        "Complete custom-code inventory and usage statistics are not fully documented."
      ]
    },
    ourPeopleSaid: {
      summary: "Your own people surfaced the points below. This is Hartmann's voice, not a vendor's.",
      byDepartment: [
        {
          department: "Captain",
          points: [
            "Prioritize the Risks: most said 'No tested rollback plan if go-live fails'",
            "Sets the Vision: clear commitment to standardizing core processes"
          ]
        },
        {
          department: "Finance-Pros",
          points: [
            "CFO Sabine Wagner notes: 'I'm not against the cloud. I'm against signing a number I can't defend.'",
            "Pain Point → Cloud Benefit: most said 'More real-time insights for inventory and P&L control'",
            "First Closing After Go-Live: most said 'Incomplete financial postings'"
          ]
        },
        {
          department: "Tech Team",
          points: [
            "Custom Code Reality Check: most said 'High complexity and custom code volume'",
            "Interface Risk Radar: most said 'Database-level interfaces create high migration risk'",
            "Clean Core Decision Gate: most said 'Strong commitment to clean-core standards'"
          ]
        },
        {
          department: "Ops-heroes",
          points: [
            "Real-time Potential: most said 'Quality Defects'",
            "Downtime Check: most said 'Assembly Line'"
          ]
        },
        {
          department: "People-Chamions",
          points: [
            "Change Booster or Blocker?: most said 'Booster'",
            "Training Match: most said 'Hands-on process testing'",
            "Resistance Ranking: most said 'Employees do not understand why the change is happening'"
          ]
        }
      ],
      alignment: [
        "Finance and Production were split on the urgency of the cloud reporting benefits."
      ]
    },
    worth: {
      summary: "The value, in your terms — not generic SAP features, and not a number we made up.",
      valueDrivers: [
        "Sabine isn't blocking the future. She's protecting 1,200 jobs and 60 years of a family's name. 'Show me the number' is her job.",
        "Finance reported ~5 days for the monthly close — shortening this is real value.",
        "Production flagged Assembly Line downtime as the highest risk — live data targets this directly.",
        "AI you'd unlock: Joule and SAP Business AI across finance and operations."
      ],
      peerOutcome: "Companies your size who moved: shortened monthly close by 2 days; got real-time operational reporting; unlocked SAP Business AI. (Illustrative — real attributed references available on request.)",
      roiPointer: "We deliberately don't invent a savings figure. Your real number deserves SAP's own modelling — use SAP's official ROI calculator."
    },
    costAndHard: {
      summary: "The honest costs and the parts that are genuinely hard — the section a skeptical CFO checks first.",
      items: [
        "This is real work — typically around a six-month effort, with genuine business disruption to plan for.",
        "Customisation doesn't all carry over: clean-core means some custom code is replaced with standard or retired.",
        "Connected systems are affected — interfaces and integrations need review and re-testing.",
        "The commercial model shifts from capex to opex."
      ]
    },
    derisking: {
      summary: "What could go wrong, and how it's managed — turning the loudest fear into a plan.",
      scenario: "The scenario to plan against: a process your team ranked least able to tolerate standstill ('Assembly Line') going down at go-live.",
      mitigations: [
        "A tested first month-end close (a dress rehearsal) before go-live.",
        "Phased rollout rather than big-bang where the landscape allows.",
        "A tested rollback and business-continuity plan, agreed up front."
      ]
    },
    whyNow: {
      summary: "Why now — grounded in your clock and your competitive context, not a generic countdown.",
      points: [
        "Hartmann Antriebstechnik is still on SAP ECC, whose mainstream maintenance ends at the end of 2027. Transitioning now avoids support premiums.",
        "Every month on ECC is a month without the AI competitors may already be deploying."
      ]
    },
    path: {
      recommended: "RISE" as const,
      label: "RISE with SAP",
      confident: true,
      reasoning: [
        "At your size and with standard data needs, RISE gets you to value — and AI — fastest.",
        "Best-practice standard processes mean less to maintain and the lowest total cost of ownership."
      ],
      sovereignty: "Sovereignty fits your profile — standard public-cloud regions are fine."
    },
    nextStep: {
      summary: "The next step isn't 'buy the cloud.' It's a free EvoKit session — a low-commitment, honest readiness check.",
      whatYouGet: [
        "A real SAP Readiness Check against your actual system",
        "A roadmap grounded in your estate, not a template",
        "An honest assessment of effort, cost and risk",
        "No commitment — you walk away with the analysis either way"
      ]
    }
  };

  // 4. Calculate hash and upsert the cached GeneratedBrief
  const loadedSession = await prisma.session.findUnique({
    where: { id: session.id },
    include: { players: true, completions: true },
  });
  if (!loadedSession) throw new Error("Could not reload session for hashing");

  const pack = buildEvidencePack(loadedSession, content);
  const hash = evidenceHash(pack);

  await prisma.generatedBrief.create({
    data: {
      sessionId: session.id,
      inputHash: hash,
      status: "ready",
      source: "baseline",
      doc: briefDoc as any,
      model: "seeded",
    },
  });
  console.log("Cached customized brief seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
