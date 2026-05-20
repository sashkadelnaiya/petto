"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Post, PostComment, PostPhoto } from "@/entities/post/model/types";
import bookmarkFilled1 from "@/shared/assets/bookmark.png";
import bookmarkFilled2 from "@/shared/assets/bookmark@2x.png";
import bookmarkFilled3 from "@/shared/assets/bookmark@3x.png";
import bookmarkEmpty1 from "@/shared/assets/bookmark-empty.png";
import bookmarkEmpty2 from "@/shared/assets/bookmark-empty@2x.png";
import bookmarkEmpty3 from "@/shared/assets/bookmark-empty@3x.png";
import avatarDefault1 from "@/shared/assets/avatar.png";
import avatarDefault2 from "@/shared/assets/avatar@2x.png";
import avatarDefault3 from "@/shared/assets/avatar@3x.png";
import { bffFetch } from "@/shared/api/bff-client";
import { formatEventDateRu } from "@/shared/lib/formatEventDate";
import { getServerErrorMessage } from "@/shared/lib/getServerErrorMessage";
import { absoluteUploadUrl } from "@/shared/lib/mediaUrl";
import { isBffError, parseBffJson } from "@/shared/lib/parseBffJson";
import { DensityImage } from "@/shared/ui/density-image/DensityImage";
import { Modal } from "@/shared/ui/modal/Modal";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import { PhotoViewerModal } from "./PhotoViewerModal";
import styles from "./PostViewModal.module.css";

type Props = {
  post: Post | null;
  open: boolean;
  onClose: () => void;
  onAfterClose?: () => void;
  onCommentsCountChange?: (postId: number, count: number) => void;
  viewerUserId?: number | null;
  viewerAvatarUrl?: string | null;
  onFavoritePress?: (post: Post) => void;
  favoriteDisabled?: boolean;
  openCommentsOnStart?: boolean;
};

export function PostViewModal({
  post,
  open,
  onClose,
  onAfterClose,
  onCommentsCountChange,
  viewerUserId = null,
  viewerAvatarUrl = null,
  onFavoritePress,
  favoriteDisabled = false,
  openCommentsOnStart = false,
}: Props) {
  const router = useRouter();
  const { showError } = useToast();
  const [photos, setPhotos] = useState<PostPhoto[]>([]);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [editingComment, setEditingComment] = useState(false);
  const [actionComment, setActionComment] = useState<PostComment | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [dragDelta, setDragDelta] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartXRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);
  const trackWidthRef = useRef(0);
  const longPressTimerRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
  const lastSyncedCommentsCountRef = useRef<Map<number, number>>(new Map());

  const isOwnPost =
    post != null &&
    viewerUserId != null &&
    Number(viewerUserId) === Number(post.author_id);

  const authorLabel = isOwnPost ? "Я" : (post?.author_name ?? "");
  const avatarPathRaw = isOwnPost
    ? (viewerAvatarUrl?.trim() ?? null)
    : (post?.author_avatar?.trim() ?? null);
  const avatarUploadUrl = avatarPathRaw ? absoluteUploadUrl(avatarPathRaw) : null;
  const isFavorited = post?.is_favorited === true;

  const photoUrls = useMemo(
    () =>
      photos
        .map((photo) => photo.path)
        .filter(Boolean)
        .map((path) => absoluteUploadUrl(path)),
    [photos],
  );

  const loadPostDetails = useCallback(async (targetPost: Post) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    try {
      const [photosRes, commentsRes] = await Promise.all([
        bffFetch(`/api/posts/${targetPost.id}/photos`),
        bffFetch(`/api/posts/${targetPost.id}/comments`),
      ]);
      const photosJson = await parseBffJson<PostPhoto[]>(photosRes);
      const commentsJson = await parseBffJson<PostComment[]>(commentsRes);
      if (reqId !== requestIdRef.current) return;

      if (!photosRes.ok || isBffError(photosJson) || !Array.isArray(photosJson.data)) {
        showError(
          getServerErrorMessage(isBffError(photosJson) ? photosJson.code : undefined),
        );
        setPhotos(targetPost.photos ?? []);
      } else {
        setPhotos(photosJson.data);
      }

      if (
        !commentsRes.ok ||
        isBffError(commentsJson) ||
        !Array.isArray(commentsJson.data)
      ) {
        showError(
          getServerErrorMessage(
            isBffError(commentsJson) ? commentsJson.code : undefined,
          ),
        );
        setComments([]);
      } else {
        const nextCount = commentsJson.data.length;
        setComments(commentsJson.data);
        if (onCommentsCountChange) {
          const prevSynced = lastSyncedCommentsCountRef.current.get(targetPost.id);
          if (prevSynced !== nextCount) {
            onCommentsCountChange(targetPost.id, nextCount);
            lastSyncedCommentsCountRef.current.set(targetPost.id, nextCount);
          }
        }
      }
    } catch {
      if (reqId !== requestIdRef.current) return;
      showError(getServerErrorMessage(undefined));
      setPhotos(targetPost.photos ?? []);
      setComments([]);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, [onCommentsCountChange, showError]);

  useEffect(() => {
    if (!open || !post) return;
    setCommentText("");
    setActivePhotoIndex(0);
    const currentCount = Number(post.comments_count) || 0;
    lastSyncedCommentsCountRef.current.set(post.id, currentCount);
    void loadPostDetails(post);
  }, [open, post, loadPostDetails]);

  useEffect(() => {
    if (open) return;
    requestIdRef.current += 1;
    setLoading(false);
    setActionModalOpen(false);
    setEditingComment(false);
    setActionComment(null);
    setEditCommentText("");
  }, [open]);

  useEffect(() => {
    if (!open || !openCommentsOnStart) return;
    const id = window.setTimeout(() => {
      const commentsEl = document.getElementById("post-view-comments");
      commentsEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(id);
  }, [open, openCommentsOnStart]);

  const handleSendComment = useCallback(async () => {
    if (!post || !commentText.trim() || sendingComment) return;
    setSendingComment(true);
    try {
      const res = await bffFetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: commentText.trim() }),
      });
      const json = await parseBffJson<unknown>(res);
      if (!res.ok || isBffError(json)) {
        showError(
          getServerErrorMessage(json.success === false ? json.code : undefined),
        );
        return;
      }
      setCommentText("");
      await loadPostDetails(post);
    } catch {
      showError(getServerErrorMessage(undefined));
    } finally {
      setSendingComment(false);
    }
  }, [commentText, loadPostDetails, post, sendingComment, showError]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearLongPressTimer, [clearLongPressTimer]);

  const openCommentActions = useCallback((comment: PostComment) => {
    setActionComment(comment);
    setEditingComment(false);
    setEditCommentText(comment.text ?? "");
    setActionModalOpen(true);
  }, []);

  const startLongPress = useCallback((comment: PostComment, isOwn: boolean) => {
    if (!isOwn) return;
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      openCommentActions(comment);
      clearLongPressTimer();
    }, 420);
  }, [clearLongPressTimer, openCommentActions]);

  const handleDeleteComment = useCallback(async () => {
    if (!post || !actionComment || actionBusy) return;
    if (!window.confirm("Удалить комментарий? Это действие нельзя отменить.")) {
      return;
    }
    setActionBusy(true);
    try {
      const res = await bffFetch(`/api/comments/${actionComment.id}`, {
        method: "DELETE",
      });
      const json = await parseBffJson<unknown>(res);
      if (!res.ok || isBffError(json)) {
        showError(
          getServerErrorMessage(json.success === false ? json.code : undefined),
        );
        return;
      }
      setActionModalOpen(false);
      setActionComment(null);
      setEditingComment(false);
      setEditCommentText("");
      await loadPostDetails(post);
    } catch {
      showError(getServerErrorMessage(undefined));
    } finally {
      setActionBusy(false);
    }
  }, [actionBusy, actionComment, loadPostDetails, post, showError]);

  const handleSaveEditedComment = useCallback(async () => {
    if (!post || !actionComment || actionBusy || !editCommentText.trim()) return;
    setActionBusy(true);
    try {
      const res = await bffFetch(`/api/comments/${actionComment.id}`, {
        method: "PUT",
        body: JSON.stringify({ text: editCommentText.trim() }),
      });
      const json = await parseBffJson<unknown>(res);
      if (!res.ok || isBffError(json)) {
        showError(
          getServerErrorMessage(json.success === false ? json.code : undefined),
        );
        return;
      }
      setActionModalOpen(false);
      setActionComment(null);
      setEditingComment(false);
      setEditCommentText("");
      await loadPostDetails(post);
    } catch {
      showError(getServerErrorMessage(undefined));
    } finally {
      setActionBusy(false);
    }
  }, [actionBusy, actionComment, editCommentText, loadPostDetails, post, showError]);

  if (!post) return null;

  const isLost = post.status === "lost";
  const hasPhotos = photoUrls.length > 0;
  const canSlidePhotos = photoUrls.length > 1;

  const handleCarouselPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canSlidePhotos) return;
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    dragStartXRef.current = e.clientX;
    dragMovedRef.current = false;
    trackWidthRef.current = e.currentTarget.clientWidth || 1;
    setDragging(true);
    setDragDelta(0);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handleCarouselPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current == null) return;
    const dx = e.clientX - dragStartXRef.current;
    if (Math.abs(dx) > 5) dragMovedRef.current = true;
    setDragDelta(dx);
  };

  const endCarouselDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current == null) return;
    const width = trackWidthRef.current || 1;
    const dx = e.clientX - dragStartXRef.current;
    dragStartXRef.current = null;
    setDragging(false);
    setDragDelta(0);
    const threshold = Math.min(90, width * 0.18);
    if (Math.abs(dx) > threshold) {
      if (dx < 0) {
        setActivePhotoIndex((prev) => (prev + 1) % photoUrls.length);
      } else {
        setActivePhotoIndex(
          (prev) => (prev - 1 + photoUrls.length) % photoUrls.length,
        );
      }
    }
  };

  const openPhotoViewer = () => {
    if (dragMovedRef.current) return;
    setPhotoViewerOpen(true);
  };

  const trackTransform = `translate3d(calc(${-activePhotoIndex * 100}% + ${dragDelta}px), 0, 0)`;

  return (
    <Modal open={open} onClose={onClose} onAfterClose={onAfterClose} size="lg">
      <div className={styles.root}>
        {loading ? (
          <div className={styles.skeletonWrap} aria-hidden>
            <div className={`${styles.skeletonPhoto} ${styles.shimmer}`} />
            <div className={styles.skeletonMeta}>
              <div className={styles.skeletonAuthorRow}>
                <div className={`${styles.skeletonAvatar} ${styles.shimmer}`} />
                <div className={`${styles.skeletonName} ${styles.shimmer}`} />
                <div className={`${styles.skeletonTime} ${styles.shimmer}`} />
              </div>
              <div className={`${styles.skeletonLine} ${styles.skeletonLineWide} ${styles.shimmer}`} />
              <div className={`${styles.skeletonLine} ${styles.shimmer}`} />
              <div className={`${styles.skeletonLine} ${styles.skeletonLineShort} ${styles.shimmer}`} />
              <div className={styles.skeletonTags}>
                <div className={`${styles.skeletonTag} ${styles.shimmer}`} />
                <div className={`${styles.skeletonTag} ${styles.shimmer}`} />
              </div>
              <div className={styles.skeletonActions}>
                <div className={`${styles.skeletonBtn} ${styles.shimmer}`} />
                <div className={`${styles.skeletonComments} ${styles.shimmer}`} />
                <div className={`${styles.skeletonBookmark} ${styles.shimmer}`} />
              </div>
            </div>
            <div className={styles.skeletonCommentsSection}>
              <div className={`${styles.skeletonLine} ${styles.skeletonLineTitle} ${styles.shimmer}`} />
              <div className={`${styles.skeletonComment} ${styles.shimmer}`} />
              <div className={`${styles.skeletonComment} ${styles.shimmer}`} />
              <div className={`${styles.skeletonInput} ${styles.shimmer}`} />
            </div>
          </div>
        ) : null}
        {!loading && hasPhotos ? (
          <div className={styles.carousel}>
            <div
              className={styles.carouselViewport}
              onPointerDown={handleCarouselPointerDown}
              onPointerMove={handleCarouselPointerMove}
              onPointerUp={endCarouselDrag}
              onPointerCancel={endCarouselDrag}
              onClick={openPhotoViewer}
              role="button"
              tabIndex={0}
              aria-label="Открыть фото на весь экран"
            >
              <div
                className={styles.carouselTrack}
                style={{
                  transform: trackTransform,
                  transition: dragging
                    ? "none"
                    : "transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
              >
                {photoUrls.map((url) => (
                  <div key={url} className={styles.carouselSlide}>
                    <img
                      src={url}
                      alt=""
                      className={styles.photo}
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                    />
                  </div>
                ))}
              </div>

              {canSlidePhotos ? (
                <>
                  <button
                    type="button"
                    className={`${styles.photoNav} ${styles.photoNavPrev}`}
                    aria-label="Предыдущее фото"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex(
                        (prev) => (prev - 1 + photoUrls.length) % photoUrls.length,
                      );
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M15 6l-6 6 6 6"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`${styles.photoNav} ${styles.photoNavNext}`}
                    aria-label="Следующее фото"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex((prev) => (prev + 1) % photoUrls.length);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </>
              ) : null}
            </div>

            {canSlidePhotos ? (
              <div className={styles.dots}>
                {photoUrls.map((url, idx) => (
                  <button
                    key={url}
                    type="button"
                    className={`${styles.dot} ${idx === activePhotoIndex ? styles.dotActive : ""}`}
                    onClick={() => setActivePhotoIndex(idx)}
                    aria-label={`Фото ${idx + 1}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {!loading ? (
        <div className={styles.meta}>
          <div className={styles.authorRow}>
            <div className={styles.authorInfo}>
              <span className={styles.avatar} aria-hidden>
                {avatarUploadUrl ? (
                  <img src={avatarUploadUrl} alt="" className={styles.avatarImg} />
                ) : (
                  <DensityImage
                    src1x={avatarDefault1}
                    src2x={avatarDefault2}
                    src3x={avatarDefault3}
                    alt=""
                    width={24}
                    height={24}
                    className={styles.avatarImg}
                  />
                )}
              </span>
              <span className={styles.authorName}>{authorLabel}</span>
            </div>
            <time className={styles.time} dateTime={post.event_date}>
              {formatEventDateRu(post.event_date)}
            </time>
          </div>

          {post.address ? <p className={styles.address}>{post.address}</p> : null}
          {post.description ? (
            <p className={styles.description}>{post.description}</p>
          ) : null}

          <div className={styles.tags}>
            {post.status ? (
              <span
                className={`${styles.tag} ${isLost ? styles.tagStatusLost : styles.tagStatusFound}`}
              >
                {isLost ? "потерян" : "найден"}
              </span>
            ) : null}
            {post.hashtag ? <span className={`${styles.tag} ${styles.tagHash}`}>#{post.hashtag}</span> : null}
          </div>

          <div className={styles.actions}>
            {!isOwnPost ? (
              <button
                type="button"
                className={styles.contact}
                onClick={async () => {
                  try {
                    const res = await bffFetch(`/api/posts/${post.id}/chat`, { method: "POST" });
                    const json = await parseBffJson<{ chat: { id: number } }>(res);
                    if (!res.ok || isBffError(json)) {
                      showError(
                        getServerErrorMessage(json.success === false ? json.code : undefined),
                      );
                      return;
                    }
                    onClose();
                    router.push(`/messages/${json.data.chat.id}`);
                  } catch {
                    showError(getServerErrorMessage(undefined));
                  }
                }}
              >
                Связаться
              </button>
            ) : null}
            <button
              type="button"
              className={styles.commentsLink}
              onClick={() => {
                const commentsEl = document.getElementById("post-view-comments");
                commentsEl?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Комментарии({comments.length || Number(post.comments_count) || 0})
            </button>
            <button
              type="button"
              className={styles.bookmark}
              disabled={Boolean(!onFavoritePress || favoriteDisabled)}
              onClick={onFavoritePress ? () => onFavoritePress(post) : undefined}
              aria-label={isFavorited ? "Убрать из избранного" : "В избранное"}
            >
              <DensityImage
                src1x={isFavorited ? bookmarkFilled1 : bookmarkEmpty1}
                src2x={isFavorited ? bookmarkFilled2 : bookmarkEmpty2}
                src3x={isFavorited ? bookmarkFilled3 : bookmarkEmpty3}
                alt=""
                width={22}
                height={22}
                className={styles.bookmarkImg}
              />
            </button>
          </div>
        </div>
        ) : null}

        {!loading ? (
        <section id="post-view-comments" className={styles.comments}>
          {!loading && comments.length === 0 ? (
            <p className={styles.emptyComments}>Пока нет комментариев</p>
          ) : null}
          {comments.map((comment) => {
            const isOwnComment =
              viewerUserId != null &&
              Number(comment.author_id) === Number(viewerUserId);
            const commentAvatarPath = isOwnComment
              ? (viewerAvatarUrl?.trim() ?? null)
              : (comment.author_avatar?.trim() ?? null);
            const commentAvatarUrl = commentAvatarPath
              ? absoluteUploadUrl(commentAvatarPath)
              : null;
            return (
              <article key={comment.id} className={styles.commentItem}>
                <div className={styles.commentHead}>
                  <span className={styles.commentAvatar} aria-hidden>
                    {commentAvatarUrl ? (
                      <img
                        src={commentAvatarUrl}
                        alt=""
                        className={styles.commentAvatarImg}
                      />
                    ) : (
                      <DensityImage
                        src1x={avatarDefault1}
                        src2x={avatarDefault2}
                        src3x={avatarDefault3}
                        alt=""
                        width={24}
                        height={24}
                        className={styles.commentAvatarImg}
                      />
                    )}
                  </span>
                  <p className={styles.commentAuthor}>
                    {isOwnComment ? "Я" : comment.author_name}
                  </p>
                  {isOwnComment ? (
                    <button
                      type="button"
                      className={styles.commentMenuBtn}
                      aria-label="Действия с комментарием"
                      onClick={() => openCommentActions(comment)}
                    >
                      ⋯
                    </button>
                  ) : null}
                </div>
                <p
                  className={styles.commentText}
                  onMouseDown={() => startLongPress(comment, isOwnComment)}
                  onMouseUp={clearLongPressTimer}
                  onMouseLeave={clearLongPressTimer}
                  onTouchStart={() => startLongPress(comment, isOwnComment)}
                  onTouchEnd={clearLongPressTimer}
                  onTouchCancel={clearLongPressTimer}
                >
                  {comment.text}
                </p>
                <time className={styles.commentDate} dateTime={comment.created_at}>
                  {formatEventDateRu(comment.created_at)}
                </time>
              </article>
            );
          })}

          <div className={styles.commentForm}>
            <textarea
              className={styles.commentInput}
              placeholder="Написать комментарий..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
            />
            <button
              type="button"
              className={styles.sendBtn}
              disabled={!commentText.trim() || sendingComment}
              onClick={handleSendComment}
            >
              {sendingComment ? "Отправка…" : "Отправить"}
            </button>
          </div>
        </section>
        ) : null}
      </div>
      <PhotoViewerModal
        open={photoViewerOpen}
        images={photoUrls}
        initialIndex={activePhotoIndex}
        onClose={() => setPhotoViewerOpen(false)}
      />
      <Modal
        open={actionModalOpen}
        onClose={() => {
          setActionModalOpen(false);
          setEditingComment(false);
        }}
        size="sm"
        title={editingComment ? "Редактировать комментарий" : "Комментарий"}
      >
        <div className={styles.commentActionSheet}>
          {editingComment ? (
            <>
              <textarea
                className={styles.commentEditInput}
                placeholder="Редактировать комментарий..."
                value={editCommentText}
                onChange={(e) => setEditCommentText(e.target.value)}
                rows={4}
              />
              <div className={styles.commentActionRow}>
                <button
                  type="button"
                  className={`${styles.commentActionBtn} ${styles.commentActionBtnCancel}`}
                  onClick={() => {
                    setEditingComment(false);
                    setEditCommentText(actionComment?.text ?? "");
                  }}
                  disabled={actionBusy}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className={`${styles.commentActionBtn} ${styles.commentActionBtnSave}`}
                  onClick={handleSaveEditedComment}
                  disabled={actionBusy || !editCommentText.trim()}
                >
                  {actionBusy ? "Сохранение…" : "Сохранить"}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.commentActionBtn}
                onClick={() => setEditingComment(true)}
              >
                Редактировать
              </button>
              <button
                type="button"
                className={`${styles.commentActionBtn} ${styles.commentActionBtnDelete}`}
                onClick={handleDeleteComment}
                disabled={actionBusy}
              >
                {actionBusy ? "Удаление…" : "Удалить"}
              </button>
            </>
          )}
        </div>
      </Modal>
    </Modal>
  );
}
