import type { Metadata } from "next";
import { FeedShell } from "@/widgets/feed-shell/ui/FeedShell";
import { MessagesList } from "./MessagesList";
import styles from "./MessagesPage.module.css";

export const metadata: Metadata = {
  title: "Сообщения",
  description: "Сообщения Petto",
  robots: { index: false, follow: true },
};

export default function MessagesPage() {
  return (
    <FeedShell>
      <main id="main-content" className={styles.main}>
        <MessagesList />
      </main>
    </FeedShell>
  );
}
