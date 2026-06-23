// Same-industry peer experiences for decision-makers — "here's how someone like
// you who's already done it sees it." ILLUSTRATIVE placeholders, written to be
// representative; replace with real, attributed SAP customer references before a
// pilot. (Mirrors the research: peers who've migrated are the most persuasive
// proof — Jollibee flew to Australia to hear YUM Brands first-hand.)

export interface PeerStory {
  company: string; // representative descriptor, not a real named customer
  role: string;
  quote: string;
  outcome: string;
  year: number;
}

const BY_INDUSTRY: Record<string, PeerStory[]> = {
  Manufacturing: [
    {
      company: "a mid-size industrial manufacturer",
      role: "CFO",
      quote: "The fear was downtime. The reality was a planned cutover — and a close that went from eight days to two.",
      outcome: "Monthly close 8 → 2 days",
      year: 2024,
    },
    {
      company: "an automotive supplier",
      role: "Head of IT",
      quote: "We finally retired years of custom code we were scared to touch. Updates just arrive now.",
      outcome: "~50% of custom code retired",
      year: 2023,
    },
  ],
  "Food & Beverage": [
    {
      company: "a regional food producer",
      role: "COO",
      quote: "Our supply chain is perishable — we couldn't afford guesswork. Live data and AI forecasting changed the game.",
      outcome: "Stockouts down, less waste",
      year: 2024,
    },
  ],
  "Logistics & Transport": [
    {
      company: "a European logistics operator",
      role: "CIO",
      quote: "One platform, real-time track-and-trace, and we scaled to new lanes without re-platforming.",
      outcome: "Faster expansion, less reconciliation",
      year: 2023,
    },
  ],
  "Chemicals & Pharma": [
    {
      company: "a specialty chemicals firm",
      role: "CIO",
      quote: "Compliance and sensitive data were the blockers. Private/sovereign options meant we kept control and still modernised.",
      outcome: "Compliance kept, QA modernised",
      year: 2024,
    },
  ],
  "Retail & Consumer": [
    {
      company: "a consumer-goods retailer",
      role: "CFO",
      quote: "Store and online finally ran on the same live inventory. Reporting that took a week now takes a morning.",
      outcome: "Unified channels, faster reporting",
      year: 2023,
    },
  ],
  "Professional Services": [
    {
      company: "a professional-services group",
      role: "CFO",
      quote: "We close the books in days, not weeks, and the AI handles the busywork our team used to dread.",
      outcome: "Close cut to days; finance automated",
      year: 2024,
    },
  ],
};

// A mixed default for generic (non-industry) surfaces like the marketing page.
const DEFAULT: PeerStory[] = [BY_INDUSTRY["Manufacturing"][0], BY_INDUSTRY["Professional Services"][0]];

export function peerStoriesFor(industry?: string | null, limit = 2): PeerStory[] {
  return ((industry && BY_INDUSTRY[industry]) || DEFAULT).slice(0, limit);
}
