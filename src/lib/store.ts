"use client";

import { create } from "zustand";

export type Scale = "pilot" | "campus" | "network";

type AppState = {
  scale: Scale;
  setScale: (s: Scale) => void;
  liveTick: number;
  tick: () => void;
  resetDemo: () => void;
  demoResetKey: number;
};

export const useAppStore = create<AppState>((set) => ({
  scale: "pilot",
  setScale: (scale) => set({ scale }),
  liveTick: 0,
  tick: () => set((s) => ({ liveTick: s.liveTick + 1 })),
  demoResetKey: 0,
  resetDemo: () => set((s) => ({ demoResetKey: s.demoResetKey + 1, liveTick: 0 })),
}));
