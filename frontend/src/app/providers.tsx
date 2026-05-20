"use client";

import { AuthProvider } from "@/features/auth/model/auth-context";
import { ToastProvider } from "@/shared/ui/toast/ToastProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}
