import type { Metadata } from "next";
import { FeedShell } from "@/widgets/feed-shell/ui/FeedShell";
import { MessagesThreadView } from "./MessagesThreadView";
import styles from "./MessagesThreadPage.module.css";

export const metadata: Metadata = {
  title: "Чат",
  description: "Диалог Petto",
  robots: { index: false, follow: true },
};

type Props = {
  params: Promise<{ chatId: string }>;
};

export default async function MessagesThreadPage({ params }: Props) {
  const { chatId } = await params;
  return (
    <FeedShell>
      <main id="main-content" className={styles.main}>
        <MessagesThreadView chatId={chatId} />
      </main>
    </FeedShell>
  );
}
