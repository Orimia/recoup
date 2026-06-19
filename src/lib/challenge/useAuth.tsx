"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ChallengeUser, Stats } from "./types";

type AuthValue = {
  user: ChallengeUser | null;
  stats: Stats | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setAuth: (user: ChallengeUser, stats: Stats | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ChallengeUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const json = await res.json();
      setUser(json.user ?? null);
      setStats(json.stats ?? null);
    } catch {
      setUser(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the session once on mount. State updates land in the promise callbacks
  // (deferred, not synchronous in the effect body), and we guard against unmount.
  useEffect(() => {
    let active = true;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        setUser(json.user ?? null);
        setStats(json.stats ?? null);
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setStats(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setAuth = (u: ChallengeUser, s: Stats | null) => {
    setUser(u);
    setStats(s);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setStats(null);
  };

  return (
    <AuthContext.Provider value={{ user, stats, loading, refresh, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
