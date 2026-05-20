"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./ToastProvider.module.css";

type ToastKind = "error" | "success";

type ToastItem = { id: string; kind: ToastKind; message: string };

type ToastContextValue = {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DISMISS_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      setItems((prev) => [...prev, { id, kind, message }]);
      const timer = setTimeout(() => dismiss(id), DISMISS_MS);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const showError = useCallback(
    (message: string) => {
      push("error", message);
    },
    [push],
  );

  const showSuccess = useCallback(
    (message: string) => {
      push("success", message);
    },
    [push],
  );

  const value = useMemo(
    () => ({ showError, showSuccess }),
    [showError, showSuccess],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ul
        className={styles.region}
        aria-live="polite"
        aria-relevant="additions text"
      >
        {items.map((t) => (
          <li
            key={t.id}
            className={`${styles.item} ${t.kind === "error" ? styles.error : styles.success}`}
            role={t.kind === "error" ? "alert" : "status"}
          >
            {t.message}
          </li>
        ))}
      </ul>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
