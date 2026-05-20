"use client";

import type { Post } from "@/entities/post/model/types";
import bookmarkFilled1 from "@/shared/assets/bookmark.png";
import bookmarkFilled2 from "@/shared/assets/bookmark@2x.png";
import bookmarkFilled3 from "@/shared/assets/bookmark@3x.png";
import bookmarkEmpty1 from "@/shared/assets/bookmark-empty.png";
import bookmarkEmpty2 from "@/shared/assets/bookmark-empty@2x.png";
import bookmarkEmpty3 from "@/shared/assets/bookmark-empty@3x.png";
import avatarDefault1 from "@/shared/assets/avatar.png";
import avatarDefault2 from "@/shared/assets/avatar@2x.png";
import avatarDefault3 from "@/shared/assets/avatar@3x.png";
import { DensityImage } from "@/shared/ui/density-image/DensityImage";
import { useAuth } from "@/features/auth/model/auth-context";
import { type MouseEvent, type TouchEvent, useEffect, useRef } from "react";
import { formatEventDateRu } from "@/shared/lib/formatEventDate";
import { absoluteUploadUrl } from "@/shared/lib/mediaUrl";
import { truncateText } from "@/shared/lib/truncateText";
import { PostCardImage } from "./PostCardImage";
import styles from "./PostCard.module.css";

const MAX_DESC = 160;
const MAX_ALT = 100;

function firstPhotoPath(post: Post): string | null {
  const p = post.photos?.[0];
  if (!p?.path) return null;
  return p.path;
}

type Props = {
  post: Post;
  viewerUserId?: number | null;
  viewerAvatarUrl?: string | null;
  onFavoritePress?: (post: Post) => void;
  favoriteDisabled?: boolean;
  onOpenPress?: (post: Post) => void;
  onOpenCommentsPress?: (post: Post) => void;
  onContactPress?: (post: Post) => void;
  onOwnPostLongPress?: (post: Post) => void;
};

export function PostCard({
  post,
  viewerUserId = null,
  viewerAvatarUrl = null,
  onFavoritePress,
  favoriteDisabled = false,
  onOpenPress,
  onOpenCommentsPress,
  onContactPress,
  onOwnPostLongPress,
}: Props) {
  const { user } = useAuth();
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const photoUrl = firstPhotoPath(post);
  const imageSrc = photoUrl ? absoluteUploadUrl(photoUrl) : null;
  const commentsCount = Number(post.comments_count) || 0;
  const eventIso = post.event_date;
  const timeLabel = formatEventDateRu(eventIso);
  const isLost = post.status === "lost";
  const isFavorited = post.is_favorited === true;

  const resolvedViewerId = user?.id ?? viewerUserId;
  const isOwnPost =
    resolvedViewerId != null &&
    Number(resolvedViewerId) === Number(post.author_id);
  const authorLabel = isOwnPost ? "Я" : post.author_name;

  const avatarPathRaw = isOwnPost
    ? (user?.avatar ?? viewerAvatarUrl)?.trim() || null
    : post.author_avatar?.trim() || null;
  const avatarUploadUrl = avatarPathRaw ? absoluteUploadUrl(avatarPathRaw) : null;

  const clearLongPress = () => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => clearLongPress, []);

  const startLongPress = (event: MouseEvent<HTMLElement> | TouchEvent<HTMLElement>) => {
    if (!isOwnPost || !onOwnPostLongPress) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button")) return;
    longPressTriggeredRef.current = false;
    clearLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      onOwnPostLongPress(post);
    }, 500);
  };

  return (
    <article
      className={styles.article}
      onClick={
        onOpenPress
          ? () => {
              if (longPressTriggeredRef.current) {
                longPressTriggeredRef.current = false;
                return;
              }
              onOpenPress(post);
            }
          : undefined
      }
      onMouseDown={startLongPress}
      onMouseUp={clearLongPress}
      onMouseLeave={clearLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={clearLongPress}
      onTouchCancel={clearLongPress}
      itemScope
      itemType="https://schema.org/SocialMediaPosting"
    >
      {imageSrc ? (
        <PostCardImage
          key={imageSrc}
          src={imageSrc}
          alt={
            post.description
              ? truncateText(post.description, MAX_ALT)
              : `Объявление: ${post.address || "без адреса"}`
          }
        />
      ) : (
        <div className={styles.imageWrap} aria-hidden />
      )}
      <div className={styles.body}>
        <div className={styles.meta}>
          <div className={styles.authorRow}>
            <span className={styles.avatar} aria-hidden>
              {avatarUploadUrl ? (
                <img src={avatarUploadUrl} alt="" className={styles.avatarImg} />
              ) : (
                <DensityImage
                  src1x={avatarDefault1}
                  src2x={avatarDefault2}
                  src3x={avatarDefault3}
                  alt=""
                  width={28}
                  height={28}
                  className={styles.avatarImg}
                />
              )}
            </span>
            <span className={styles.authorName} itemProp="author">
              {authorLabel}
            </span>
          </div>
          <time
            className={styles.time}
            dateTime={eventIso}
            itemProp="datePublished"
          >
            {timeLabel}
          </time>
        </div>

        {post.address ? (
          <address className={styles.address} itemProp="contentLocation">
            {post.address}
          </address>
        ) : null}

        {post.description ? (
          <p className={styles.description} itemProp="description">
            {truncateText(post.description, MAX_DESC)}
          </p>
        ) : null}

        <div className={styles.tags}>
          {post.status ? (
            <span
              className={`${styles.tag} ${isLost ? styles.tagStatusLost : styles.tagStatusFound}`}
            >
              {isLost ? "потерян" : "найден"}
            </span>
          ) : null}
          {post.hashtag ? (
            <span className={`${styles.tag} ${styles.tagHash}`}>
              #{post.hashtag}
            </span>
          ) : null}
        </div>

        <footer
          className={`${styles.footer} ${isOwnPost ? styles.footerOwnPost : ""}`}
        >
          {!isOwnPost ? (
            <button
              type="button"
              className={styles.contact}
              onClick={(e) => {
                e.stopPropagation();
                onContactPress?.(post);
              }}
            >
              Связаться
            </button>
          ) : null}
          <button
            type="button"
            className={styles.comments}
            aria-label={`Комментарии, ${commentsCount}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenCommentsPress?.(post);
            }}
          >
            Комментарии({commentsCount})
          </button>
          <button
            type="button"
            className={styles.bookmark}
            aria-label={
              onFavoritePress
                ? isFavorited
                  ? "Убрать из избранного"
                  : "В избранное"
                : isFavorited
                  ? "В избранном"
                  : "Войдите, чтобы добавить в избранное"
            }
            disabled={Boolean(!onFavoritePress || favoriteDisabled)}
            onClick={
              onFavoritePress
                ? (e) => {
                    e.stopPropagation();
                    onFavoritePress(post);
                  }
                : undefined
            }
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
        </footer>
      </div>
    </article>
  );
}
