import type { CompanyProfile } from "./profile";

// Seeded "known companies" the admin can pick from to pre-fill the profile —
// simulating SAP already knowing the customer (from CRM). Chosen to exercise all
// three recommendation outcomes (GROW / RISE / prepare-first) in a demo.
export interface KnownCompany extends CompanyProfile {
  name: string;
}

export const KNOWN_COMPANIES: KnownCompany[] = [
  {
    name: "Nordwind Logistik GmbH",
    industry: "Logistics & Transport",
    country: "Germany",
    sapVersion: "ECC 6.0 (EHP7)",
    companySize: "Mid (200–1,000)",
    dataSensitivity: "Standard",
  },
  {
    name: "Hanse Digital GmbH",
    industry: "Professional Services",
    country: "Germany",
    sapVersion: "ECC 6.0 (EHP8)",
    companySize: "Small (<200)",
    dataSensitivity: "Standard",
  },
  {
    name: "Alpenmetall GmbH",
    industry: "Manufacturing",
    country: "Austria",
    sapVersion: "ECC 6.0 (EHP7)",
    companySize: "Large (1,000–5,000)",
    dataSensitivity: "Regulated (finance / health / etc.)",
  },
  {
    name: "Rheinpharma AG",
    industry: "Chemicals & Pharma",
    country: "Germany",
    sapVersion: "ECC 6.0 (EHP8)",
    companySize: "Enterprise (5,000+)",
    dataSensitivity: "Highly sensitive / sovereignty-critical",
  },
  {
    name: "Stahlwerk Ruhr AG",
    industry: "Manufacturing",
    country: "Germany",
    sapVersion: "ECC 6.0 (EHP6 or earlier)",
    companySize: "Enterprise (5,000+)",
    dataSensitivity: "Highly sensitive / sovereignty-critical",
  },
];
