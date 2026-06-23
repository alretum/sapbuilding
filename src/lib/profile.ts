// Company profile model + option lists for the personalized read (PR B).
// Pure data — safe to import anywhere.

export const INDUSTRIES = [
  "Manufacturing",
  "Retail & Consumer",
  "Food & Beverage",
  "Logistics & Transport",
  "Automotive",
  "Chemicals & Pharma",
  "Professional Services",
  "Public Sector",
  "Other",
] as const;

export const COUNTRIES = ["Germany", "Austria", "Switzerland", "Other EU", "Outside EU"] as const;

export const SAP_VERSIONS = [
  "ECC 6.0 (EHP6 or earlier)",
  "ECC 6.0 (EHP7)",
  "ECC 6.0 (EHP8)",
  "S/4HANA (on-premise)",
  "Not sure",
] as const;

export const COMPANY_SIZES = ["Small (<200)", "Mid (200–1,000)", "Large (1,000–5,000)", "Enterprise (5,000+)"] as const;

export const DATA_SENSITIVITY = [
  "Standard",
  "Regulated (finance / health / etc.)",
  "Highly sensitive / sovereignty-critical",
] as const;

export interface CompanyProfile {
  industry?: string | null;
  country?: string | null;
  sapVersion?: string | null;
  companySize?: string | null;
  dataSensitivity?: string | null;
}

// Helpers used by the recommendation + urgency logic.
export const isLargeOrg = (size?: string | null) => !!size && (size.startsWith("Large") || size.startsWith("Enterprise"));
export const isRegulated = (s?: string | null) => !!s && !s.startsWith("Standard");
export const isHighlySensitive = (s?: string | null) => !!s && s.startsWith("Highly");
export const isOldEcc = (v?: string | null) => !!v && v.includes("EHP6");
export const isOnEcc = (v?: string | null) => !!v && v.startsWith("ECC");
export const isSovereigntyMarket = (country?: string | null) =>
  !!country && (country === "Germany" || country === "Austria" || country === "Switzerland" || country === "Other EU");
