// ILLUSTRATIVE seed data for the narrative / pitch pages only. Real bin and event
// data lives in the database (src/lib/server). See docs/simulated-vs-real.md.

export type BinStatus = "online" | "full" | "service" | "offline";

export type Bin = {
  id: string;
  name: string;
  location: string;
  locationType: "retail" | "dining" | "athletics" | "residence" | "academic";
  status: BinStatus;
  fillPct: number;
  todayReturns: number;
  weekReturns: number;
  contaminationRate: number;
  uptime: number;
  lastEventMinutesAgo: number;
  activeUsersWeek: number;
};

export const bins: Bin[] = [
  {
    id: "bin-mm-01",
    name: "Munchie Mart · Main",
    location: "Munchie Mart entrance",
    locationType: "retail",
    status: "online",
    fillPct: 62,
    todayReturns: 287,
    weekReturns: 1842,
    contaminationRate: 0.041,
    uptime: 0.998,
    lastEventMinutesAgo: 2,
    activeUsersWeek: 641,
  },
  {
    id: "bin-rnd-02",
    name: "Rand Dining · North",
    location: "Rand Hall dining",
    locationType: "dining",
    status: "online",
    fillPct: 78,
    todayReturns: 412,
    weekReturns: 2611,
    contaminationRate: 0.071,
    uptime: 0.994,
    lastEventMinutesAgo: 5,
    activeUsersWeek: 1054,
  },
  {
    id: "bin-rnd-03",
    name: "Rand Dining · South",
    location: "Rand Hall dining",
    locationType: "dining",
    status: "full",
    fillPct: 96,
    todayReturns: 388,
    weekReturns: 2198,
    contaminationRate: 0.068,
    uptime: 0.997,
    lastEventMinutesAgo: 11,
    activeUsersWeek: 912,
  },
  {
    id: "bin-ath-04",
    name: "Memorial Gym · Concourse",
    location: "Memorial Gym",
    locationType: "athletics",
    status: "online",
    fillPct: 41,
    todayReturns: 52,
    weekReturns: 1407,
    contaminationRate: 0.093,
    uptime: 0.991,
    lastEventMinutesAgo: 28,
    activeUsersWeek: 488,
  },
  {
    id: "bin-ath-05",
    name: "FirstBank Stadium · Gate 4",
    location: "FirstBank Stadium",
    locationType: "athletics",
    status: "service",
    fillPct: 14,
    todayReturns: 0,
    weekReturns: 3211,
    contaminationRate: 0.118,
    uptime: 0.985,
    lastEventMinutesAgo: 214,
    activeUsersWeek: 1782,
  },
  {
    id: "bin-res-06",
    name: "Towers Residence · Lobby",
    location: "Towers Residence",
    locationType: "residence",
    status: "online",
    fillPct: 37,
    todayReturns: 118,
    weekReturns: 842,
    contaminationRate: 0.029,
    uptime: 0.999,
    lastEventMinutesAgo: 8,
    activeUsersWeek: 329,
  },
  {
    id: "bin-acd-07",
    name: "Stevenson Center · Atrium",
    location: "Stevenson Center",
    locationType: "academic",
    status: "online",
    fillPct: 55,
    todayReturns: 91,
    weekReturns: 612,
    contaminationRate: 0.035,
    uptime: 0.996,
    lastEventMinutesAgo: 16,
    activeUsersWeek: 244,
  },
  {
    id: "bin-mm-08",
    name: "Munchie Mart · Patio",
    location: "Munchie Mart patio",
    locationType: "retail",
    status: "online",
    fillPct: 44,
    todayReturns: 163,
    weekReturns: 1102,
    contaminationRate: 0.052,
    uptime: 0.997,
    lastEventMinutesAgo: 4,
    activeUsersWeek: 412,
  },
];

export const pilotKpis = {
  returnsToday: bins.reduce((a, b) => a + b.todayReturns, 0),
  returnsWeek: bins.reduce((a, b) => a + b.weekReturns, 0),
  returnsMonth: 48216,
  activeUsersToday: 1482,
  activeUsersWeek: bins.reduce((a, b) => a + b.activeUsersWeek, 0),
  activeUsersMonth: 8419,
  contaminationRate: 0.064,
  uptime: 0.996,
  rewardRedemptionRate: 0.812,
  recyclingIndex: 74,
};

export function binStatusLabel(status: BinStatus) {
  switch (status) {
    case "online":
      return "Online";
    case "full":
      return "Needs service";
    case "service":
      return "In service";
    case "offline":
      return "Offline";
  }
}

export function locationTypeLabel(lt: Bin["locationType"]) {
  switch (lt) {
    case "retail":
      return "Retail";
    case "dining":
      return "Dining";
    case "athletics":
      return "Athletics";
    case "residence":
      return "Residence";
    case "academic":
      return "Academic";
  }
}
