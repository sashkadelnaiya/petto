import { fetchPosts } from "@/shared/api/fetch-posts";
import { fetchServerViewer } from "@/shared/api/fetch-server-viewer";
import { FeedHomeView } from "./FeedHomeView";

const FEED_PAGE_SIZE = 40;

export async function HomeFeedSection() {
  const [posts, viewer] = await Promise.all([
    fetchPosts({ limit: FEED_PAGE_SIZE, offset: 0 }),
    fetchServerViewer(),
  ]);
  return (
    <FeedHomeView
      posts={posts}
      viewerUserId={viewer?.id ?? null}
      viewerAvatarUrl={viewer?.avatar ?? null}
    />
  );
}
