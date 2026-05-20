import type { Metadata } from "next";
import { fetchServerViewer } from "@/shared/api/fetch-server-viewer";
import { FeedShell } from "@/widgets/feed-shell/ui/FeedShell";
import { UserPostsView } from "@/widgets/user-posts-view/ui/UserPostsView";
import styles from "@/views/profile/ui/ProfilePage.module.css";

export const metadata: Metadata = {
  title: "Сохранённые посты",
  robots: { index: false, follow: true },
};

export default async function SavedPostsPage() {
  const initialViewer = await fetchServerViewer();

  return (
    <FeedShell>
      <main id="main-content" className={styles.main}>
        <UserPostsView
          mode="saved"
          initialViewer={initialViewer}
          title="Сохранённые посты"
        />
      </main>
    </FeedShell>
  );
}
