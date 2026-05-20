"use client";

import type { PostStatusFilter } from "@/shared/lib/filterPosts";
import styles from "./PostStatusFilter.module.css";

type Props = {
  value: PostStatusFilter;
  onChange: (next: PostStatusFilter) => void;
};

export function PostStatusFilterPanel({ value, onChange }: Props) {
  return (
    <div className={styles.options}>
      <button
        type="button"
        className={`${styles.btn} ${value === null ? styles.btnActive : ""}`}
        onClick={() => onChange(null)}
      >
        Все
      </button>
      <button
        type="button"
        className={`${styles.btn} ${value === "lost" ? styles.btnActive : ""}`}
        onClick={() => onChange("lost")}
      >
        Потерян
      </button>
      <button
        type="button"
        className={`${styles.btn} ${value === "found" ? styles.btnActive : ""}`}
        onClick={() => onChange("found")}
      >
        Найден
      </button>
    </div>
  );
}
