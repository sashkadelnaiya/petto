"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ServerViewer } from "@/shared/api/fetch-server-viewer";
import type { Post } from "@/entities/post/model/types";
import filter1 from "@/shared/assets/filter.png";
import filter2 from "@/shared/assets/filter@2x.png";
import filter3 from "@/shared/assets/filter@3x.png";
import search1 from "@/shared/assets/search.png";
import search2 from "@/shared/assets/search@2x.png";
import search3 from "@/shared/assets/search@3x.png";
import { useAuth } from "@/features/auth/model/auth-context";
import { bffFetch } from "@/shared/api/bff-client";
import { getServerErrorMessage } from "@/shared/lib/getServerErrorMessage";
import {
  isBffError,
  parseBffJson,
} from "@/shared/lib/parseBffJson";
import {
  filterPostsBySearchAndStatus,
  type PostStatusFilter,
} from "@/shared/lib/filterPosts";
import { Modal } from "@/shared/ui/modal/Modal";
import { PostStatusFilterPanel } from "@/shared/ui/post-status-filter/PostStatusFilterPanel";
import { DensityImage } from "@/shared/ui/density-image/DensityImage";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import { EditPostModal } from "@/widgets/edit-post-modal/ui/EditPostModal";
import { PostsGrid } from "@/widgets/posts-grid/ui/PostsGrid";
import { PostsGridSkeleton } from "@/widgets/posts-grid/ui/PostsGridSkeleton";
import styles from "./UserPostsView.module.css";

type Mode = "saved" | "my";

type Props = {
  mode: Mode;
  initialViewer: ServerViewer | null;
  title: string;
};

export function UserPostsView({ mode, initialViewer, title }: Props) {
  const { user, refreshUser } = useAuth();
  const { showError } = useToast();
  const searchPanelId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [rawPosts, setRawPosts] = useState<Post[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PostStatusFilter>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [actionPost, setActionPost] = useState<Post | null>(null);
  const [postActionOpen, setPostActionOpen] = useState(false);
  const [editPostOpen, setEditPostOpen] = useState(false);

  const viewerId = user?.id ?? initialViewer?.id ?? null;
  const viewerAvatar = user?.avatar ?? initialViewer?.avatar ?? null;

  const fetchData = useCallback(
    async (silent: boolean) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        if (mode === "saved") {
          const res = await bffFetch("/api/me/favorites");
          const json = await parseBffJson<Post[]>(res);
          if (!res.ok || isBffError(json) || !Array.isArray(json.data)) {
            showError(
              getServerErrorMessage(
                !isBffError(json) ? undefined : json.code,
              ),
            );
            setRawPosts([]);
            return;
          }
          setRawPosts(json.data);
        } else {
          const [myRes, favRes] = await Promise.all([
            bffFetch("/api/posts/my-posts"),
            bffFetch("/api/me/favorites"),
          ]);
          const myJson = await parseBffJson<Post[]>(myRes);
          if (!myRes.ok || isBffError(myJson) || !Array.isArray(myJson.data)) {
            showError(
              getServerErrorMessage(
                !isBffError(myJson) ? undefined : myJson.code,
              ),
            );
            setRawPosts([]);
            return;
          }
          setRawPosts(myJson.data);
          const favJson = await parseBffJson<Post[]>(favRes);
          if (
            favRes.ok &&
            !isBffError(favJson) &&
            Array.isArray(favJson.data)
          ) {
            setFavoriteIds(new Set(favJson.data.map((p) => p.id)));
          } else {
            setFavoriteIds(new Set());
          }
        }
      } catch {
        showError(getServerErrorMessage(undefined));
        setRawPosts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mode, showError],
  );

  useEffect(() => {
    void fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    if (!searchOpen) return;
    const id = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [searchOpen]);

  const filtered = useMemo(
    () => filterPostsBySearchAndStatus(rawPosts, search, statusFilter),
    [rawPosts, search, statusFilter],
  );

  const displayPosts = useMemo(
    () =>
      filtered.map((p) => ({
        ...p,
        is_favorited:
          mode === "saved" ? true : favoriteIds.has(p.id),
      })),
    [filtered, mode, favoriteIds],
  );

  const handleRefresh = () => {
    void fetchData(true);
  };

  const handleFavorite = async (post: Post) => {
    if (favoriteBusy) return;
    setFavoriteBusy(true);
    try {
      if (mode === "saved") {
        const res = await bffFetch(`/api/posts/${post.id}/favorite`, {
          method: "DELETE",
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
        setRawPosts((prev) => prev.filter((p) => p.id !== post.id));
        await refreshUser();
      } else {
        const isFav = favoriteIds.has(post.id);
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
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (isFav) next.delete(post.id);
          else next.add(post.id);
          return next;
        });
      }
    } catch {
      showError(getServerErrorMessage(undefined));
    } finally {
      setFavoriteBusy(false);
    }
  };

  const handleCommentsCountChange = useCallback((postId: number, count: number) => {
    setRawPosts((prev) =>
      prev.map((p) =>
        p.id === postId && p.comments_count !== count
          ? { ...p, comments_count: count }
          : p,
      ),
    );
  }, []);

  const handleOwnPostLongPress = useCallback(
    (post: Post) => {
      if (viewerId == null || Number(post.author_id) !== Number(viewerId)) return;
      setActionPost(post);
      setPostActionOpen(true);
    },
    [viewerId],
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
      setRawPosts((prev) => prev.filter((p) => p.id !== actionPost.id));
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(actionPost.id);
        return next;
      });
      setPostActionOpen(false);
      setActionPost(null);
    } catch {
      showError(getServerErrorMessage(undefined));
    }
  }, [actionPost, showError]);

  const emptyAll =
    mode === "saved"
      ? "Сохраненных постов пока нет"
      : "У вас пока нет объявлений";

  const emptyFiltered = "Нет постов по заданным условиям";

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.toolbar}>
        <div className={styles.toolbarRow}>
          <div className={styles.searchCluster}>
            <button
              type="button"
              className={styles.toolBtn}
              aria-label={searchOpen ? "Скрыть поиск" : "Поиск"}
              aria-expanded={searchOpen}
              aria-controls={searchPanelId}
              onClick={() => {
                setSearchOpen((v) => {
                  if (v) setSearch("");
                  return !v;
                });
              }}
            >
              <DensityImage
                src1x={search1}
                src2x={search2}
                src3x={search3}
                alt=""
                width={36}
                height={36}
                className={styles.toolIcon}
              />
            </button>
            <div
              id={searchPanelId}
              className={`${styles.searchGrow} ${searchOpen ? styles.searchGrowOpen : ""}`}
              aria-hidden={!searchOpen}
            >
              <div className={styles.searchGrowInner}>
                <div className={styles.searchFieldWrap}>
                  <div className={styles.searchShell}>
                    <input
                      ref={searchInputRef}
                      type="text"
                      inputMode="search"
                      enterKeyHint="search"
                      autoComplete="off"
                      className={styles.searchInput}
                      placeholder="Поиск по хештегу или описанию…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      tabIndex={searchOpen ? 0 : -1}
                      aria-label="Поиск"
                      role="searchbox"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            className={styles.toolBtn}
            aria-label="Фильтр по статусу"
            onClick={() => setFilterOpen(true)}
          >
            <DensityImage
              src1x={filter1}
              src2x={filter2}
              src3x={filter3}
              alt=""
              width={36}
              height={36}
              className={styles.toolIcon}
            />
          </button>
        </div>
      </div>

      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Фильтр" size="sm">
        <PostStatusFilterPanel
          value={statusFilter}
          onChange={(next) => {
            setStatusFilter(next);
            setFilterOpen(false);
          }}
        />
      </Modal>

      <div className={styles.listWrap}>
        {loading ? (
          <PostsGridSkeleton />
        ) : filtered.length === 0 ? (
          <p className={styles.hint} role="status">
            {rawPosts.length === 0 ? emptyAll : emptyFiltered}
          </p>
        ) : (
          <PostsGrid
            posts={displayPosts}
            viewerUserId={viewerId}
            viewerAvatarUrl={viewerAvatar}
            onFavoritePress={handleFavorite}
            favoriteDisabled={favoriteBusy}
            emptyMessage={emptyAll}
            onPostCommentsCountChange={handleCommentsCountChange}
            onOwnPostLongPress={handleOwnPostLongPress}
          />
        )}
      </div>

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
          setRawPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...patch } : p)));
        }}
      />

      {!loading ? (
        <button
          type="button"
          className={styles.refreshBtn}
          disabled={refreshing}
          onClick={handleRefresh}
        >
          {refreshing ? "Обновление…" : "Обновить"}
        </button>
      ) : null}
    </div>
  );
}
