import { isOnEcc } from "./profile";

// SAP ECC 6.0 mainstream maintenance runs to end of 2027, with optional extended
// maintenance to 2030 (at a premium). Used for the grounded-urgency "your clock".
export interface MaintenanceClock {
  onEcc: boolean;
  mainstreamEnd: string;
  extendedEnd: string;
  headline: string;
}

export function maintenanceClock(sapVersion?: string | null): MaintenanceClock {
  const onEcc = isOnEcc(sapVersion);
  return {
    onEcc,
    mainstreamEnd: "end of 2027",
    extendedEnd: "2030",
    headline: onEcc
      ? "Your SAP ECC mainstream maintenance ends at the end of 2027 (extended support to 2030, at a premium)."
      : "Your platform is already past ECC — the clock now is the pace of AI and innovation, not a support deadline.",
  };
}
