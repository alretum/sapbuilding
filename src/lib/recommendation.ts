import {
  type CompanyProfile,
  isHighlySensitive,
  isLargeOrg,
  isOldEcc,
  isRegulated,
  isSovereigntyMarket,
} from "./profile";
import { maintenanceClock, type MaintenanceClock } from "./maintenance";
import { peersFor, type PeerProof } from "./peers";

// Rules-based personalized read. Names SAP offerings (GROW / RISE) and includes
// an honest "prepare first" branch. An MVP for the demo — deliberately simple
// and transparent, not a model dressed up as certainty.

export type RecPath = "GROW" | "RISE" | "PREPARE";

export interface Recommendation {
  path: RecPath;
  pathLabel: string;
  headline: string;
  rationale: string[];
  aiUnlocked: string;
  sovereignty: string;
  caveats: string[];
  clock: MaintenanceClock;
  peers: PeerProof;
  confident: boolean;
}

export function recommend(p: CompanyProfile): Recommendation {
  const large = isLargeOrg(p.companySize);
  const regulated = isRegulated(p.dataSensitivity);
  const sensitive = isHighlySensitive(p.dataSensitivity);
  const old = isOldEcc(p.sapVersion);
  const clock = maintenanceClock(p.sapVersion);
  const peers = peersFor(p.industry);

  // Honesty branch: genuine complexity on an old base → assess before choosing.
  if (sensitive && large && old) {
    return {
      path: "PREPARE",
      pathLabel: "Prepare first",
      headline: "Honestly? Do the groundwork before you pick a path.",
      rationale: [
        "Highly-sensitive data, enterprise scale and an older ECC base together mean real complexity.",
        "Choosing GROW vs RISE now would be guessing — the responsible first move is a proper readiness assessment.",
      ],
      aiUnlocked: aiLine(p.industry),
      sovereignty: sovereigntyLine(p),
      caveats: [
        "This isn't a brush-off — it's the honest call for your profile.",
        "SAP's real Readiness Check + an EvoKit session will tell you exactly where you stand.",
      ],
      clock,
      peers,
      confident: false,
    };
  }

  if (large || regulated || sensitive) {
    return {
      path: "RISE",
      pathLabel: "RISE with SAP",
      headline: "A private, managed path fits your profile.",
      rationale: [
        large ? "At your scale, a managed private-cloud move gives you control and a brownfield-friendly path." : "",
        regulated ? "Regulated / sensitive data is well served by RISE's private and sovereign options." : "",
        "You keep more of your existing process landscape while still getting continuous innovation and AI.",
      ].filter(Boolean),
      aiUnlocked: aiLine(p.industry),
      sovereignty: sovereigntyLine(p),
      caveats: standardCaveats(),
      clock,
      peers,
      confident: true,
    };
  }

  return {
    path: "GROW",
    pathLabel: "GROW with SAP",
    headline: "The fast public-cloud path is a strong fit for you.",
    rationale: [
      "At your size and with standard data needs, GROW gets you to value — and AI — fastest.",
      "Best-practice standard processes mean less to maintain and the lowest total cost of ownership.",
    ],
    aiUnlocked: aiLine(p.industry),
    sovereignty: sovereigntyLine(p),
    caveats: standardCaveats(),
    clock,
    peers,
    confident: true,
  };
}

function aiLine(industry?: string | null): string {
  switch (industry) {
    case "Manufacturing":
      return "AI you'd unlock: predictive-maintenance signals and supply-chain agents.";
    case "Food & Beverage":
      return "AI you'd unlock: demand forecasting and waste-reduction agents.";
    case "Logistics & Transport":
      return "AI you'd unlock: route + capacity optimisation and exception-handling agents.";
    case "Chemicals & Pharma":
      return "AI you'd unlock: QA, compliance and finance-automation agents.";
    case "Retail & Consumer":
      return "AI you'd unlock: merchandising and demand-planning assistants.";
    case "Professional Services":
      return "AI you'd unlock: finance automation and project-margin agents.";
    case "Automotive":
      return "AI you'd unlock: supply-chain resilience and quality agents.";
    default:
      return "AI you'd unlock: Joule and SAP Business AI across finance and operations.";
  }
}

function sovereigntyLine(p: CompanyProfile): string {
  const market = isSovereigntyMarket(p.country);
  const sensitive = isHighlySensitive(p.dataSensitivity) || isRegulated(p.dataSensitivity);
  if (market && sensitive)
    return "Sovereignty matters for you: SAP Sovereign Cloud / RISE private options keep data in-region under EU control.";
  if (market) return "Data residency is straightforward — SAP runs EU regions, so sovereignty isn't a blocker for your profile.";
  return "Sovereignty isn't a primary constraint for your profile — standard public-cloud regions are fine.";
}

function standardCaveats(): string[] {
  return [
    "Migration is real work — custom code and integrations need review.",
    "This is a starting read, not a substitute for SAP's official Readiness Check.",
  ];
}
