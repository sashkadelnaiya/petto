"use client";

import type { User } from "@/entities/user/model/types";
import { bffFetch } from "@/shared/api/bff-client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const res = await bffFetch("/api/me");
      if (!res.ok) {
        setUser(null);
        return;
      }
      const json = (await res.json()) as
        | { success: true; data: { user?: User } }
        | { success: false };
      if (!json.success) {
        setUser(null);
        return;
      }
      setUser(json.data.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, setUser, refreshUser }),
    [user, refreshUser],
  );

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
