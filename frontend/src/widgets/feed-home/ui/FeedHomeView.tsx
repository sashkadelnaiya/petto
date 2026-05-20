"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Post } from "@/entities/post/model/types";
import { useAuth } from "@/features/auth/model/auth-context";
import { bffFetch } from "@/shared/api/bff-client";
import { usePostsWithFavoritesMerge } from "@/shared/hooks/usePostsWithFavoritesMerge";
import { type PostStatusFilter } from "@/shared/lib/filterPosts";
import { getServerErrorMessage } from "@/shared/lib/getServerErrorMessage";
import { isBffError, parseBffJson } from "@/shared/lib/parseBffJson";
import { Modal } from "@/shared/ui/modal/Modal";
import { PostStatusFilterPanel } from "@/shared/ui/post-status-filter/PostStatusFilterPanel";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import {
  FeedToolbar,
  type FeedToolbarMode,
} from "@/widgets/feed-toolbar/ui/FeedToolbar";
import { PostsGrid } from "@/widgets/posts-grid/ui/PostsGrid";
import { PostsMap } from "@/widgets/posts-map/ui/PostsMap";
import { PostViewModal } from "@/widgets/post-view-modal";
import { CreatePostModal } from "@/widgets/create-post-modal/ui/CreatePostModal";
import { EditPostModal } from "@/widgets/edit-post-modal/ui/EditPostModal";
import styles from "./FeedHomeView.module.css";

type Props = {
  posts: Post[];
  viewerUserId?: number | null;
  viewerAvatarUrl?: string | null;
};

const FEED_PAGE_SIZE = 40;

export function FeedHomeView({
  posts,
  viewerUserId = null,
  viewerAvatarUrl = null,
}: Props) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { showError } = useToast();
  const [localPosts, setLocalPosts] = usePostsWithFavoritesMerge(
    posts,
    viewerUserId,
  );
  const [mode, setMode] = useState<"feed" | "map">("feed");
  const [mapMounted, setMapMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PostStatusFilter>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [actionPost, setActionPost] = useState<Post | null>(null);
  const [postActionOpen, setPostActionOpen] = useState(false);
  const [editPostOpen, setEditPostOpen] = useState(false);
  const [openCommentsOnStart, setOpenCommentsOnStart] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(posts.length >= FEED_PAGE_SIZE);
  const panelScrollRef = useRef<HTMLDivElement | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  const showMap = mode === "map";

  const handleModeChange = useCallback((next: FeedToolbarMode) => {
    setMode(next);
    if (next === "map") {
      setMapMounted(true);
    }
  }, []);

  const filteredPosts = useMemo(() => localPosts, [localPosts]);

  const canFavorite = viewerUserId != null;

  const handleOpenPost = useCallback((post: Post, openComments: boolean) => {
    setSelectedPost(post);
    setOpenCommentsOnStart(openComments);
    setPostModalOpen(true);
  }, []);

  const handleCommentsCountChange = useCallback((postId: number, count: number) => {
    setLocalPosts((prev) =>
      prev.map((p) =>
        p.id === postId && p.comments_count !== count
          ? { ...p, comments_count: count }
          : p,
      ),
    );
    setSelectedPost((prev) =>
      prev && prev.id === postId && prev.comments_count !== count
        ? { ...prev, comments_count: count }
        : prev,
    );
  }, [setLocalPosts]);

  const handleFavorite = useCallback(
    async (post: Post) => {
      if (viewerUserId == null || favoriteBusy) return;
      setFavoriteBusy(true);
      try {
        const isFav = post.is_favorited === true;
        const res = await bffFetch(`/api/posts/${post.id}/favorite`, {
          method: isFav ? "DELETE" : "POST",
        });
        const json = await parseBffJson<unknown>(res);
        if (!res.ok || isBffError(json)) {
          showError(
            getServerErrorMessage(
              json.success === false ? json.code : undefined,
            ),
          );
          return;
        }
        setLocalPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, is_favorited: !isFav } : p,
          ),
        );
        await refreshUser();
      } catch {
        showError(getServerErrorMessage(undefined));
      } finally {
        setFavoriteBusy(false);
      }
    },
    [viewerUserId, favoriteBusy, refreshUser, showError, setLocalPosts],
  );

  const handleContactAuthor = useCallback(
    async (post: Post) => {
      if (viewerUserId == null || Number(viewerUserId) === Number(post.author_id)) return;
      try {
        const res = await bffFetch(`/api/posts/${post.id}/chat`, { method: "POST" });
        const json = await parseBffJson<{ chat: { id: number } }>(res);
        if (!res.ok || isBffError(json)) {
          showError(getServerErrorMessage(json.success === false ? json.code : undefined));
          return;
        }
        router.push(`/messages/${json.data.chat.id}`);
      } catch {
        showError(getServerErrorMessage(undefined));
      }
    },
    [router, showError, viewerUserId],
  );

  const fetchFeedPage = useCallback(
    async (offset: number, append: boolean) => {
      const params = new URLSearchParams();
      params.set("limit", String(FEED_PAGE_SIZE));
      params.set("offset", String(offset));
      if (statusFilter) params.set("status", statusFilter);
      if (search.trim()) params.set("hashtag", search.trim().toLowerCase());

      const res = await bffFetch(`/api/posts?${params.toString()}`);
      const json = await parseBffJson<Post[]>(res);
      if (!res.ok || isBffError(json) || !Array.isArray(json.data)) {
        showError(getServerErrorMessage(isBffError(json) ? json.code : undefined));
        return;
      }
      const batch = json.data;
      setLocalPosts((prev) => (append ? [...prev, ...batch] : batch));
      setHasMore(batch.length >= FEED_PAGE_SIZE);
    },
    [search, setLocalPosts, showError, statusFilter],
  );

  useEffect(() => {
    void fetchFeedPage(0, false);
  }, [fetchFeedPage]);

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await fetchFeedPage(localPosts.length, true);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchFeedPage, hasMore, loadingMore, localPosts.length]);

  useEffect(() => {
    if (showMap) return;
    if (!panelScrollRef.current || !loadMoreSentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMorePosts();
        }
      },
      {
        root: panelScrollRef.current,
        rootMargin: "220px 0px 220px 0px",
        threshold: 0.01,
      },
    );
    observer.observe(loadMoreSentinelRef.current);
    return () => observer.disconnect();
  }, [loadMorePosts, showMap]);

  const handleOwnPostLongPress = useCallback(
    (post: Post) => {
      if (viewerUserId == null || Number(post.author_id) !== Number(viewerUserId)) return;
      setActionPost(post);
      setPostActionOpen(true);
    },
    [viewerUserId],
  );

  const handleDeletePost = useCallback(async () => {
    if (!actionPost) return;
    try {
      const res = await bffFetch(`/api/posts/${actionPost.id}`, { method: "DELETE" });
      const json = await parseBffJson<unknown>(res);
      if (!res.ok || isBffError(json)) {
        showError(getServerErrorMessage(json.success === false ? json.code : undefined));
        return;
      }
      setLocalPosts((prev) => prev.filter((p) => p.id !== actionPost.id));
      setSelectedPost((prev) => (prev?.id === actionPost.id ? null : prev));
      setPostActionOpen(false);
      setActionPost(null);
    } catch {
      showError(getServerErrorMessage(undefined));
    }
  }, [actionPost, setLocalPosts, showError]);

  return (
    <div className={styles.root}>
      <FeedToolbar
        mode={mode}
        onModeChange={handleModeChange}
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
        searchValue={search}
        onSearchValueChange={setSearch}
        onFilterClick={() => setFilterOpen(true)}
        onCreatePostClick={() => setCreatePostOpen(true)}
      />

      <Modal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Фильтр"
        size="sm"
      >
        <PostStatusFilterPanel
          value={statusFilter}
          onChange={(next) => {
            setStatusFilter(next);
            setFilterOpen(false);
          }}
        />
      </Modal>

      <div className={styles.viewport}>
        <div className={`${styles.track} ${showMap ? styles.trackMap : ""}`}>
          <section
            className={styles.panel}
            aria-label="Лента публикаций"
            aria-hidden={showMap}
            inert={showMap || undefined}
          >
            <div className={styles.panelScroll} ref={panelScrollRef}>
              <PostsGrid
                posts={filteredPosts}
                viewerUserId={viewerUserId}
                viewerAvatarUrl={viewerAvatarUrl}
                onFavoritePress={canFavorite ? handleFavorite : undefined}
                favoriteDisabled={favoriteBusy}
                onPostOpen={handleOpenPost}
                onPostContactPress={handleContactAuthor}
                onOwnPostLongPress={handleOwnPostLongPress}
                emptyMessage={
                  localPosts.length === 0
                    ? "Пока нет публикаций. Зайдите позже."
                    : "Нет публикаций по заданным условиям."
                }
              />
              <div ref={loadMoreSentinelRef} className={styles.loadMoreSentinel} aria-hidden />
              {loadingMore ? <p className={styles.loadMoreState}>Загрузка...</p> : null}
              {!hasMore && filteredPosts.length > 0 ? (
                <p className={styles.loadMoreState}>Все посты загружены</p>
              ) : null}
            </div>
          </section>
          <section
            className={`${styles.panel} ${styles.panelMap}`}
            aria-label="Карта публикаций"
            aria-hidden={!showMap}
            inert={!showMap || undefined}
          >
            {mapMounted ? (
              <PostsMap posts={filteredPosts} onOpenPost={handleOpenPost} />
            ) : (
              <div className={styles.mapStub} aria-hidden />
            )}
          </section>
        </div>
      </div>
      <PostViewModal
        post={selectedPost}
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onAfterClose={() => {
          setSelectedPost(null);
          setOpenCommentsOnStart(false);
        }}
        viewerUserId={viewerUserId}
        viewerAvatarUrl={viewerAvatarUrl}
        onFavoritePress={canFavorite ? handleFavorite : undefined}
        favoriteDisabled={favoriteBusy}
        openCommentsOnStart={openCommentsOnStart}
        onCommentsCountChange={handleCommentsCountChange}
      />
      <CreatePostModal
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onCreated={() => {
          setCreatePostOpen(false);
        }}
      />
      <Modal
        open={postActionOpen}
        onClose={() => {
          setPostActionOpen(false);
          setActionPost(null);
        }}
        title="Действия с постом"
        size="sm"
      >
        <div className={styles.actionSheet}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => {
              setPostActionOpen(false);
              setEditPostOpen(true);
            }}
          >
            Редактировать
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
            onClick={handleDeletePost}
          >
            Удалить
          </button>
        </div>
      </Modal>
      <EditPostModal
        open={editPostOpen}
        post={actionPost}
        onClose={() => {
          setEditPostOpen(false);
          setActionPost(null);
        }}
        onSaved={(postId, patch) => {
          setLocalPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, ...patch } : p)),
          );
          setSelectedPost((prev) =>
            prev && prev.id === postId ? { ...prev, ...patch } : prev,
          );
        }}
      />
    </div>
  );
}
