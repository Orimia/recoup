// ILLUSTRATIVE seed data for the narrative / pitch pages only. These are NOT real
// model outputs. The AI layer is intentionally not built yet (trusted data first,
// AI second). The live product's real, verified data lives in the database
// (src/lib/server). What is real vs illustrative: docs/simulated-vs-real.md.
//
// AI insights & recommendations shown on the dashboard and AI insights page.
// Each insight has: model lineage, confidence, reasoning, recommended action.

export type InsightKind =
  | "behavior"
  | "contamination"
  | "servicing"
  | "incentive"
  | "anomaly";

export type Insight = {
  id: string;
  kind: InsightKind;
  title: string;
  body: string;
  reasoning: string;
  confidence: number;
  model: string;
  recommendation?: string;
  impact?: string;
  createdMinutesAgo: number;
  location?: string;
};

export const insights: Insight[] = [
  {
    id: "ins-01",
    kind: "incentive",
    title: "Instant rewards outperform raffle by 22% on first-time returners",
    body: "Cohort B (instant $0.10 meal money) posted a 61% first-return rate vs 38% for raffle-only across 840 matched students over 12 days.",
    reasoning:
      "Bayesian A/B with weakly-informative prior · posterior win-probability 0.94 · lift 95% CI: [12%, 31%] · matched on residence hall + meal plan tier.",
    confidence: 0.94,
    model: "incentive-bandit/v2 (Thompson sampling)",
    recommendation: "Roll instant rewards to all Munchie Mart + Rand Dining bins by Friday.",
    impact: "Projected +1,240 returns/week · +$48 resale/week · −0.9pp contamination.",
    createdMinutesAgo: 14,
    location: "Munchie Mart · Rand Dining",
  },
  {
    id: "ins-02",
    kind: "contamination",
    title: "Contamination spikes 18% after 8 PM at Munchie Mart",
    body: "Evening contamination rate climbs to 11.8% after 8 PM vs 4.1% daytime, driven mostly by lidded coffee cups mis-sorted as aluminum.",
    reasoning:
      "Classifier confusion matrix flagged coffee-cup false-positives; correlated with ambient lighting below 180 lux at bin station.",
    confidence: 0.87,
    model: "vision-contam/v3 · ResNet-50 fine-tuned on 14K Vanderbilt labels",
    recommendation: "Add secondary lighting + update signage (two-state icon) for Munchie Mart evening hours.",
    impact: "Projected −6.2pp evening contamination · $310/mo saved hauler fees.",
    createdMinutesAgo: 37,
    location: "Munchie Mart",
  },
  {
    id: "ins-03",
    kind: "servicing",
    title: "Service route can drop 1 trip/week with zero overflow risk",
    body: "Fill-forecast model shows Towers, Stevenson, and Munchie Mart Patio stay under 85% fill with a Tue+Fri schedule (vs current Mon/Wed/Fri).",
    reasoning:
      "Forecasts built from 14 days of per-bin fill curves · 95th-percentile overflow risk < 3% across 10,000 Monte Carlo simulations.",
    confidence: 0.91,
    model: "fill-forecast/v1 · temporal CNN + weekly seasonality",
    recommendation: "Switch 3 low-volume bins to Tue+Fri collection starting next week.",
    impact: "Projected −$880/mo servicing · −104 kg CO2e/mo vehicle emissions.",
    createdMinutesAgo: 52,
    location: "3 low-volume bins",
  },
  {
    id: "ins-04",
    kind: "behavior",
    title: "Athletics venue recovery peaks 20 min after halftime",
    body: "Post-halftime window (21:30–21:50) drives 38% of weekly athletics returns. Current reward schedule is flat across the night.",
    reasoning:
      "Fan-behavior clustering identified 4 return-motivation segments; 'social-moment' cluster (n=1,204) concentrates in halftime window.",
    confidence: 0.89,
    model: "behavior-segmenter/v2 · clustering + temporal kernel",
    recommendation: "Trigger 2× reward boost from 21:25–22:00 on game nights.",
    impact: "Projected +540 returns/game · aluminum recovery 52% → 63%.",
    createdMinutesAgo: 78,
    location: "FirstBank Stadium · Memorial Gym",
  },
  {
    id: "ins-05",
    kind: "anomaly",
    title: "Rand Dining South bin running 14% hotter than forecast",
    body: "Fill rate ran 96% by 2 PM today vs forecast of 82%. Likely a dining-hall event drove unusual aluminum traffic.",
    reasoning:
      "Residual exceeded 2σ control limit; correlated with on-campus event feed (Rand Hall lunch takeover).",
    confidence: 0.82,
    model: "anomaly-detector/v1 · STL decomposition + isolation forest",
    recommendation: "Dispatch same-day service + flag as 'event' for learning.",
    impact: "Avoids overflow · improves forecast calibration.",
    createdMinutesAgo: 6,
    location: "Rand Dining · South",
  },
];

export const recommendedActions = [
  {
    id: "act-01",
    title: "Roll instant rewards campus-wide",
    owner: "Ops · Priya",
    impact: "+1,240 returns/wk",
    status: "pending" as const,
  },
  {
    id: "act-02",
    title: "Dispatch same-day service to Rand South",
    owner: "Facilities",
    impact: "Avoid overflow",
    status: "in-progress" as const,
  },
  {
    id: "act-03",
    title: "Add signage + lighting at Munchie Mart evening",
    owner: "Facilities",
    impact: "−6.2pp contamination",
    status: "pending" as const,
  },
  {
    id: "act-04",
    title: "Switch 3 bins to Tue+Fri schedule",
    owner: "Logistics",
    impact: "−$880/mo",
    status: "pending" as const,
  },
];
