"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/features/auth/model/auth-context";
import { bffFetch } from "@/shared/api/bff-client";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import styles from "./LogoutButton.module.css";

type Props = {
  variant?: "default" | "ghost";
};

export function LogoutButton({ variant = "default" }: Props) {
  const router = useRouter();
  const { setUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      const res = await bffFetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        showError("Не удалось выйти из аккаунта");
        return;
      }
      setUser(null);
      showSuccess("Вы вышли из аккаунта");
      router.push("/login");
      router.refresh();
    } catch {
      showError("Не удалось выйти из аккаунта");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className={variant === "ghost" ? styles.ghost : styles.button}
      type="button"
      onClick={logout}
      disabled={loading}
    >
      {loading ? "Выход…" : "Выйти"}
    </button>
  );
}
