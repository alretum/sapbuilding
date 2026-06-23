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
  const onS4 = !!sapVersion && sapVersion.includes("S/4HANA");

  let headline: string;
  if (onEcc) {
    headline =
      "Your SAP ECC mainstream maintenance ends at the end of 2027 (extended support to 2030, at a premium) — a hard deadline to plan around.";
  } else if (onS4) {
    headline =
      "You're already on S/4HANA, so there's no support-deadline pressure. The urgency now is AI: SAP's newest AI (Joule, agents) lands in the cloud first, so every month off-cloud is a month behind.";
  } else {
    headline =
      "Most companies here are still on SAP ECC, whose mainstream maintenance ends at the end of 2027. Confirm your SAP version to ground this in your own timeline.";
  }

  return { onEcc, mainstreamEnd: "end of 2027", extendedEnd: "2030", headline };
}
