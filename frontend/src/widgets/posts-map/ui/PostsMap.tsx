"use client";

import dynamic from "next/dynamic";
import type { Post } from "@/entities/post/model/types";
import { filterPostsWithCoordinates } from "@/entities/post/lib/filterPostsWithCoordinates";
import styles from "./PostsMap.module.css";

const PostsMapInner = dynamic(() => import("./PostsMapInner"), {
  ssr: false,
  loading: () => (
    <div className={styles.loading} role="status">
      Загрузка карты…
    </div>
  ),
});

type Props = {
  posts: Post[];
  onOpenPost?: (post: Post, openComments: boolean) => void;
};

export function PostsMap({ posts, onOpenPost }: Props) {
  const withCoords = filterPostsWithCoordinates(posts);
  return <PostsMapInner posts={withCoords} onOpenPost={onOpenPost} />;
}
