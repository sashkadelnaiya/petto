import type { ReactNode } from "react";
import background from "@/shared/assets/Background.png";
import styles from "./AuthScreenLayout.module.css";

type Props = {
  children: ReactNode;
};

export function AuthScreenLayout({ children }: Props) {
  return (
    <div
      className={styles.wrap}
      style={{ backgroundImage: `url(${background.src})` }}
    >
      <main id="main-content" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
