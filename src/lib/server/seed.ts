// Initial seed for the Challenge product. Loaded once when the DB file is empty.
// Bins mirror the pitch-site fleet so the two halves of the app tell one story.
// Teams are seeded into a March Madness bracket with funded baseline points so the
// bracket is populated on day one (real student deposits accrue on top).

import type { Bin, Reward, Team } from "./types";

// Coordinates are real Vanderbilt campus locations (approx) so the geofence is
// meaningful in a live test on campus.
export const seedBins: Bin[] = [
  { code: "MM-01", name: "Munchie Mart · Main", locationType: "retail", lat: 36.14542, lng: -86.80312 },
  { code: "MM-08", name: "Munchie Mart · Patio", locationType: "retail", lat: 36.14556, lng: -86.80298 },
  { code: "RND-02", name: "Rand Dining · North", locationType: "dining", lat: 36.14861, lng: -86.80444 },
  { code: "RND-03", name: "Rand Dining · South", locationType: "dining", lat: 36.14848, lng: -86.80451 },
  { code: "ATH-04", name: "Memorial Gym · Concourse", locationType: "athletics", lat: 36.14417, lng: -86.80556 },
  { code: "ATH-05", name: "FirstBank Stadium · Gate 4", locationType: "athletics", lat: 36.14072, lng: -86.80861 },
  { code: "RES-06", name: "Towers Residence · Lobby", locationType: "residence", lat: 36.14939, lng: -86.80083 },
  { code: "ACD-07", name: "Stevenson Center · Atrium", locationType: "academic", lat: 36.14583, lng: -86.80222 },
];

export const seedTeams: Team[] = [
  // West region
  { id: "team-towers", name: "Towers", type: "dorm", region: "West", seed: 1, baselinePoints: 4200 },
  { id: "team-kissam", name: "Kissam", type: "dorm", region: "West", seed: 2, baselinePoints: 2600 },
  // East region
  { id: "team-commons", name: "The Commons", type: "dorm", region: "East", seed: 1, baselinePoints: 3800 },
  { id: "team-highland", name: "Highland Quad", type: "dorm", region: "East", seed: 2, baselinePoints: 2400 },
  // South region
  { id: "team-greek", name: "Greek Row", type: "org", region: "South", seed: 1, baselinePoints: 3100 },
  { id: "team-athletics", name: "Club Sports", type: "org", region: "South", seed: 2, baselinePoints: 1900 },
  // Midwest region
  { id: "team-engineering", name: "Engineering Council", type: "org", region: "Midwest", seed: 1, baselinePoints: 2900 },
  { id: "team-greenfund", name: "SPEAR / Green Fund", type: "org", region: "Midwest", seed: 2, baselinePoints: 1500 },
];

export const seedRewards: Reward[] = [
  {
    id: "rw-coffee",
    name: "Free coffee · Suzie's",
    cost: 120,
    description: "Any drip or hot tea at a campus Suzie's location.",
    sponsor: "Vanderbilt Campus Dining",
  },
  {
    id: "rw-meal",
    name: "$5 Meal Money credit",
    cost: 500,
    description: "Loaded to your Commodore Card meal-money balance.",
    sponsor: "Vanderbilt Sustainability (pilot fund)",
  },
  {
    id: "rw-tee",
    name: "VandyLoop limited tee",
    cost: 800,
    description: "Recycled-cotton challenge tee. While supplies last.",
    sponsor: "Recoup",
  },
  {
    id: "rw-tickets",
    name: "Basketball ticket upgrade",
    cost: 1500,
    description: "Lower-bowl upgrade for a Commodores home game.",
    sponsor: "Vanderbilt Athletics",
  },
  {
    id: "rw-tree",
    name: "Plant a tree in your name",
    cost: 300,
    description: "A tree planted on campus grounds, tagged with your class year.",
    sponsor: "Vanderbilt Grounds",
  },
];

// A small amount of realistic prior activity so leaderboards/admin aren't empty
// before the first live signup. Marked clearly as seed users (handles start "demo_").
export const seedDemoUsers = [
  { handle: "demo_jmorales", name: "J. Morales", teamId: "team-towers", lifetimePoints: 740, deposits: 74 },
  { handle: "demo_kpatel", name: "K. Patel", teamId: "team-commons", lifetimePoints: 620, deposits: 62 },
  { handle: "demo_achoi", name: "A. Choi", teamId: "team-towers", lifetimePoints: 580, deposits: 58 },
  { handle: "demo_sbrooks", name: "S. Brooks", teamId: "team-greek", lifetimePoints: 510, deposits: 51 },
  { handle: "demo_rlao", name: "R. Lao", teamId: "team-engineering", lifetimePoints: 470, deposits: 47 },
  { handle: "demo_tnovak", name: "T. Novak", teamId: "team-commons", lifetimePoints: 430, deposits: 43 },
  { handle: "demo_dfields", name: "D. Fields", teamId: "team-highland", lifetimePoints: 360, deposits: 36 },
  { handle: "demo_mgarza", name: "M. Garza", teamId: "team-kissam", lifetimePoints: 300, deposits: 30 },
];
