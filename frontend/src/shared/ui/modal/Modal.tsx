"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";

type ModalSize = "lg" | "sm";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: ModalSize;
  onAfterClose?: () => void;
};

const EXIT_MS = 320;

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "lg",
  onAfterClose,
}: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAfterCloseRef = useRef(onAfterClose);

  useEffect(() => {
    onAfterCloseRef.current = onAfterClose;
  }, [onAfterClose]);

  useEffect(() => {
    if (open) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      if (mounted) return;
      const openTimer = window.setTimeout(() => {
        setMounted(true);
        setPanelEntered(false);
      }, 0);
      return () => window.clearTimeout(openTimer);
    }
    if (!mounted) return;
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setMounted(false);
      onAfterCloseRef.current?.();
    }, EXIT_MS);
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open, mounted]);

  useEffect(() => {
    if (!open || !mounted) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setPanelEntered(true);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !panelEntered) return;
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      )?.focus();
    }, 80);
    return () => window.clearTimeout(t);
  }, [open, panelEntered]);

  if (typeof document === "undefined") return null;
  if (!mounted) return null;

  const panelClass = [
    styles.panel,
    size === "sm" ? styles.panelSm : null,
    open && panelEntered ? styles.panelOpen : null,
  ]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <div
      className={`${styles.overlay} ${!open ? styles.overlayClosing : ""}`}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        {title ? (
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
        ) : (
          <div className={styles.header}>
            <span />
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
