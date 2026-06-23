// Peer outcomes by industry. Illustrative and clearly labelled — to be replaced
// with real, attributed SAP reference outcomes before any pilot. The point is
// honest peer proof ("companies like you"), not invented ROI for one company.

export interface PeerProof {
  summary: string;
  outcomes: string[];
  mostChose: "GROW" | "RISE";
}

const BY_INDUSTRY: Record<string, PeerProof> = {
  Manufacturing: {
    summary: "Manufacturers your size who moved",
    outcomes: ["cut the monthly close from ~8 days to ~2", "gained live plant + supply-chain visibility", "retired 40–60% of unused custom code"],
    mostChose: "RISE",
  },
  "Food & Beverage": {
    summary: "Food & beverage peers who moved",
    outcomes: ["kept perishable supply chains running on live data", "automated demand forecasting with AI", "standardised processes across sites"],
    mostChose: "RISE",
  },
  "Logistics & Transport": {
    summary: "Logistics peers who moved",
    outcomes: ["got real-time track-and-trace on one platform", "cut reconciliation work between systems", "scaled to new lanes faster"],
    mostChose: "GROW",
  },
  "Retail & Consumer": {
    summary: "Retail & consumer peers who moved",
    outcomes: ["unified store + online on live inventory", "shortened the close and reporting cycle", "added AI assistants for merchandising"],
    mostChose: "GROW",
  },
  "Chemicals & Pharma": {
    summary: "Chemicals & pharma peers who moved",
    outcomes: ["kept compliance + batch traceability intact", "used private/sovereign options for sensitive data", "modernised QA and finance workflows"],
    mostChose: "RISE",
  },
  "Professional Services": {
    summary: "Professional-services peers who moved",
    outcomes: ["closed the books in days, not weeks", "ran project + resource planning on live data", "adopted AI for finance automation"],
    mostChose: "GROW",
  },
};

const DEFAULT: PeerProof = {
  summary: "Companies your size who moved",
  outcomes: ["shortened their monthly close", "got real-time operational reporting", "unlocked SAP Business AI"],
  mostChose: "GROW",
};

export function peersFor(industry?: string | null): PeerProof {
  return (industry && BY_INDUSTRY[industry]) || DEFAULT;
}
