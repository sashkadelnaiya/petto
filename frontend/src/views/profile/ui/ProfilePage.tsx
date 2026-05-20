import type { Metadata } from "next";
import { fetchServerViewer } from "@/shared/api/fetch-server-viewer";
import { FeedShell } from "@/widgets/feed-shell/ui/FeedShell";
import { ProfileView } from "./ProfileView";
import styles from "./ProfilePage.module.css";

export const metadata: Metadata = {
  title: "Профиль",
  description: "Профиль пользователя Petto",
  robots: { index: false, follow: true },
};

export default async function ProfilePage() {
  const initialUser = await fetchServerViewer();

  return (
    <FeedShell>
      <main id="main-content" className={styles.main}>
        <ProfileView initialUser={initialUser} />
      </main>
    </FeedShell>
  );
}
