// Pilot Scenario Simulator math. Deterministic, bounded, and defensible.
// Outputs match the published Recoup impact thesis.

import { computeImpact, IMPACT_CONSTANTS } from "./impact";

export type ScenarioInputs = {
  numBins: number; // 1–500
  locationType: "retail" | "dining" | "athletics" | "mixed";
  adoptionPct: number; // 0–1, fraction of eligible students participating
  rewardCents: number; // 0–25 cents per return
  contaminationPct: number; // 0–0.2
  sportsMode: boolean; // athletics boost
  numCampuses: number; // 1–50
};

export type ScenarioOutputs = {
  cansPerYear: number;
  recoveryRate: number;
  resaleUsd: number;
  landfillAvoidedUsd: number;
  esgReportingUsd: number;
  co2eTons: number;
  energyKwh: number;
  totalValueUsd: number;
  studentsEngaged: number;
  haulerCostSavedUsd: number;
};

export const defaultInputs: ScenarioInputs = {
  numBins: 8,
  locationType: "mixed",
  adoptionPct: 0.42,
  rewardCents: 10,
  contaminationPct: 0.064,
  sportsMode: false,
  numCampuses: 1,
};

// Presets — named scenario starting points
export const presets: Record<string, ScenarioInputs> = {
  pilot: {
    numBins: 8,
    locationType: "mixed",
    adoptionPct: 0.42,
    rewardCents: 10,
    contaminationPct: 0.064,
    sportsMode: false,
    numCampuses: 1,
  },
  fullCampus: {
    numBins: 120,
    locationType: "mixed",
    adoptionPct: 0.58,
    rewardCents: 10,
    contaminationPct: 0.05,
    sportsMode: true,
    numCampuses: 1,
  },
  network: {
    numBins: 120,
    locationType: "mixed",
    adoptionPct: 0.6,
    rewardCents: 10,
    contaminationPct: 0.048,
    sportsMode: true,
    numCampuses: 25,
  },
};

// Traffic factor by location type (cans per bin per day, baseline)
const trafficFactor: Record<ScenarioInputs["locationType"], number> = {
  retail: 180,
  dining: 240,
  athletics: 90, // lower baseline, but sports mode spikes this
  mixed: 160,
};

// Reward uplift curve — diminishing returns past $0.12
function rewardUplift(cents: number) {
  // sigmoid-ish, 0 reward → 0.55x, 10c → 1.0x, 25c → 1.18x
  const saturated = 1 - Math.exp(-cents / 8);
  return 0.55 + saturated * 0.7;
}

// Athletics venue multiplier on game days
function sportsMultiplier(on: boolean, locationType: string) {
  if (!on) return 1;
  if (locationType === "athletics") return 2.4;
  if (locationType === "mixed") return 1.35;
  return 1.1;
}

// Students engaged ≈ bins × location factor × adoption
const studentsPerBin: Record<ScenarioInputs["locationType"], number> = {
  dining: 280,
  retail: 180,
  athletics: 220,
  mixed: 200,
};

function estimateStudents(inputs: ScenarioInputs) {
  const perBin = studentsPerBin[inputs.locationType];
  return Math.round(inputs.numBins * perBin * inputs.adoptionPct);
}

export function computeScenario(inputs: ScenarioInputs): ScenarioOutputs {
  const { numBins, locationType, adoptionPct, rewardCents, contaminationPct, sportsMode, numCampuses } = inputs;

  const baseCansPerBinPerDay = trafficFactor[locationType];
  const adoptionLift = 0.3 + adoptionPct * 1.1; // adoption drives most of the return rate
  const rewardMult = rewardUplift(rewardCents);
  const sportsMult = sportsMultiplier(sportsMode, locationType);
  const contaminationDiscount = 1 - contaminationPct;

  const cansPerBinPerYear =
    baseCansPerBinPerDay * 365 * adoptionLift * rewardMult * sportsMult * contaminationDiscount;

  const cansPerYear = Math.round(cansPerBinPerYear * numBins * numCampuses);
  const impact = computeImpact(cansPerYear);

  // Recovery rate scales with adoption and reward; capped.
  const recoveryRate = Math.min(0.21 + adoptionPct * 0.55 + rewardMult * 0.05, 0.75);

  // ESG reporting scales with dataset breadth (# campuses)
  const esgReportingUsd = Math.min(impact.esgReportingUsd * Math.sqrt(numCampuses), 250_000);

  // Hauler cost saved — assume 20% trip reduction per bin via forecasting
  const tripsSavedPerYear = numBins * numCampuses * 20;
  const haulerCostSavedUsd = tripsSavedPerYear * IMPACT_CONSTANTS.haulerServiceTripUsd;

  const totalValueUsd =
    impact.resaleUsd + impact.landfillAvoidedUsd + esgReportingUsd + haulerCostSavedUsd;

  return {
    cansPerYear,
    recoveryRate,
    resaleUsd: impact.resaleUsd,
    landfillAvoidedUsd: impact.landfillAvoidedUsd,
    esgReportingUsd,
    co2eTons: impact.co2eTons,
    energyKwh: impact.energyKwh,
    totalValueUsd,
    studentsEngaged: estimateStudents(inputs) * numCampuses,
    haulerCostSavedUsd,
  };
}
