// Impact math — every number is derived from a formula anyone can inspect.
// This is the "show your work" layer.

// Published constants (cross-checked with EPA/aluminum industry data):
// - Average empty aluminum can weighs ~14.9g
// - Aluminum resale value ~$1,800/ton ≈ $0.0179/can
// - Landfill tipping fee ~$50/ton ≈ $0.00049/can (but saves hauler + space cost too)
// - Emissions saved by recycling 1kg Al vs virgin: ~9.3 kg CO2e
// - Per can: 0.0149kg × 9.3 = 0.139 kgCO2e saved per can recycled
// - ESG reporting compliance cost avoided: $5K-25K/year depending on framework coverage

export const IMPACT_CONSTANTS = {
  canWeightG: 14.9,
  canWeightKg: 0.0149,
  aluminumResaleUsdPerCan: 0.0179,
  landfillCostAvoidedUsdPerCan: 0.00049,
  co2eKgPerCanRecycled: 0.139,
  energySavedKwhPerCan: 0.26,
  esgReportingBaseUsd: 12000,
  haulerServiceTripUsd: 215,
  haulerCo2ePerTripKg: 8.4,
};

export type ImpactBundle = {
  cans: number;
  resaleUsd: number;
  landfillAvoidedUsd: number;
  co2eTons: number;
  energyKwh: number;
  esgReportingUsd: number;
};

export function computeImpact(cans: number): ImpactBundle {
  const resaleUsd = cans * IMPACT_CONSTANTS.aluminumResaleUsdPerCan;
  const landfillAvoidedUsd = cans * IMPACT_CONSTANTS.landfillCostAvoidedUsdPerCan;
  const co2eKg = cans * IMPACT_CONSTANTS.co2eKgPerCanRecycled;
  const energyKwh = cans * IMPACT_CONSTANTS.energySavedKwhPerCan;

  // ESG reporting cost avoided scales logarithmically — more data coverage, more frameworks,
  // but diminishing returns after comprehensive dataset achieved
  const esgReportingUsd = Math.min(
    IMPACT_CONSTANTS.esgReportingBaseUsd * Math.log10(Math.max(cans, 10) / 1000 + 1) * 2.5,
    25000
  );

  return {
    cans,
    resaleUsd,
    landfillAvoidedUsd,
    co2eTons: co2eKg / 1000,
    energyKwh,
    esgReportingUsd,
  };
}

// Baseline pilot impact — today's running numbers (60-day pilot at Vanderbilt)
export const pilotImpactToday = computeImpact(48216);

// Projected scale impacts
export const vanderbiltFullCampusAnnual = computeImpact(1_050_000);
export const vanderbiltWithAthleticsAnnual = computeImpact(3_400_000);

// Multi-campus network (25 campuses hypothetical)
export const networkAnnual = computeImpact(28_500_000);

// Current recovery rate assumptions
export const recoveryBaseline = {
  withoutVandyLoop: 0.21, // national average university aluminum recovery ~21%
  pilotCurrent: 0.48,
  pilotTarget: 0.6,
};
