import type { ReactNode } from "react";
import background from "@/shared/assets/Background.png";
import { AppSidebar } from "@/widgets/app-sidebar/ui/AppSidebar";
import styles from "./FeedShell.module.css";

type Props = {
  children: ReactNode;
};

export function FeedShell({ children }: Props) {
  return (
    <div
      className={styles.page}
      style={{ backgroundImage: `url(${background.src})` }}
    >
      <div className={styles.shell}>
        <div className={styles.row}>
          <AppSidebar />
          <div className={styles.main}>
            <div className={styles.mainInner}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
