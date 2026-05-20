import type { Metadata } from "next";
import { Suspense } from "react";
import { FeedShell } from "@/widgets/feed-shell/ui/FeedShell";
import { HomeFeedSection } from "@/widgets/feed-home/ui/HomeFeedSection";
import { PostsGridSkeleton } from "@/widgets/posts-grid/ui/PostsGridSkeleton";
import styles from "./HomePage.module.css";

export const metadata: Metadata = {
  title: "Лента",
  description: "Лента объявлений Petto — потерянные и найденные питомцы",
};

export default function HomePage() {
  return (
    <FeedShell>
      <main
        id="main-content"
        className={styles.main}
        aria-label="Лента объявлений"
      >
        <Suspense fallback={<PostsGridSkeleton />}>
          <HomeFeedSection />
        </Suspense>
      </main>
    </FeedShell>
  );
}
