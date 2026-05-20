"use client";

import { useState } from "react";
import { PostCard } from "@/entities/post/ui/PostCard";
import type { Post } from "@/entities/post/model/types";
import { PostViewModal } from "@/widgets/post-view-modal";
import styles from "./PostsGrid.module.css";

type Props = {
  posts: Post[];
  viewerUserId?: number | null;
  viewerAvatarUrl?: string | null;
  emptyMessage?: string;
  onFavoritePress?: (post: Post) => void;
  favoriteDisabled?: boolean;
  onPostOpen?: (post: Post, openComments: boolean) => void;
  onPostCommentsCountChange?: (postId: number, count: number) => void;
  onPostContactPress?: (post: Post) => void;
  onOwnPostLongPress?: (post: Post) => void;
};

export function PostsGrid({
  posts,
  viewerUserId = null,
  viewerAvatarUrl = null,
  emptyMessage = "Пока нет публикаций. Зайдите позже.",
  onFavoritePress,
  favoriteDisabled = false,
  onPostOpen,
  onPostCommentsCountChange,
  onPostContactPress,
  onOwnPostLongPress,
}: Props) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [openCommentsOnStart, setOpenCommentsOnStart] = useState(false);

  if (posts.length === 0) {
    return (
      <p className={styles.empty} role="status">
        {emptyMessage}
      </p>
    );
  }

  const openPost = (post: Post, comments: boolean) => {
    if (onPostOpen) {
      onPostOpen(post, comments);
      return;
    }
    setOpenCommentsOnStart(comments);
    setSelectedPost(post);
    setModalOpen(true);
  };

  return (
    <>
      <ul className={styles.list}>
        {posts.map((post) => (
          <li key={post.id} className={styles.item}>
            <PostCard
              post={post}
              viewerUserId={viewerUserId}
              viewerAvatarUrl={viewerAvatarUrl}
              onFavoritePress={onFavoritePress}
              favoriteDisabled={favoriteDisabled}
              onOpenPress={(next) => openPost(next, false)}
              onOpenCommentsPress={(next) => openPost(next, true)}
              onContactPress={onPostContactPress}
              onOwnPostLongPress={onOwnPostLongPress}
            />
          </li>
        ))}
      </ul>
      {!onPostOpen ? (
        <PostViewModal
          post={selectedPost}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onAfterClose={() => {
            setSelectedPost(null);
            setOpenCommentsOnStart(false);
          }}
          viewerUserId={viewerUserId}
          viewerAvatarUrl={viewerAvatarUrl}
          onFavoritePress={onFavoritePress}
          favoriteDisabled={favoriteDisabled}
          openCommentsOnStart={openCommentsOnStart}
          onCommentsCountChange={(postId, count) => {
            setSelectedPost((prev) =>
              prev && prev.id === postId && prev.comments_count !== count
                ? { ...prev, comments_count: count }
                : prev,
            );
            onPostCommentsCountChange?.(postId, count);
          }}
        />
      ) : null}
    </>
  );
}
