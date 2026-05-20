"use client";

import { useEffect, useMemo, useRef } from "react";
import type { PostWithCoordinates } from "@/entities/post/lib/filterPostsWithCoordinates";
import { escapeHtmlAttributeValue } from "@/shared/lib/htmlEscape";
import { loadYandexMaps } from "@/shared/lib/loadYandexMaps";
import { absoluteUploadUrl } from "@/shared/lib/mediaUrl";
import { MAP_SINGLE_POINT_PADDING } from "@/widgets/posts-map/config";
import styles from "./PostsMapInner.module.css";

type Props = {
  posts: PostWithCoordinates[];
  onOpenPost?: (post: PostWithCoordinates, openComments: boolean) => void;
};

export default function PostsMapInner({ posts, onOpenPost }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<InstanceType<NonNullable<Window["ymaps"]>["Map"]> | null>(null);

  const bounds = useMemo(() => {
    if (posts.length === 0) return null;
    const lats = posts.map((p) => Number(p.latitude));
    const lngs = posts.map((p) => Number(p.longitude));
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);
    let minLng = Math.min(...lngs);
    let maxLng = Math.max(...lngs);
    if (posts.length === 1) {
      minLat -= MAP_SINGLE_POINT_PADDING;
      maxLat += MAP_SINGLE_POINT_PADDING;
      minLng -= MAP_SINGLE_POINT_PADDING;
      maxLng += MAP_SINGLE_POINT_PADDING;
    }
    return [
      [minLat, minLng],
      [maxLat, maxLng],
    ] as [[number, number], [number, number]];
  }, [posts]);

  if (!bounds) {
    return (
      <div className={styles.empty} role="status">
        <p className={styles.emptyText}>Постов с координатами пока нет</p>
      </div>
    );
  }

  useEffect(() => {
    let cancelled = false;
    const mount = async () => {
      if (!containerRef.current || !bounds) return;
      const ymaps = await loadYandexMaps();
      if (cancelled || !containerRef.current) return;

      const map = new ymaps.Map(
        containerRef.current,
        {
          center: [
            (bounds[0][0] + bounds[1][0]) / 2,
            (bounds[0][1] + bounds[1][1]) / 2,
          ],
          zoom: 10,
        },
        { suppressMapOpenBlock: true },
      );
      mapRef.current = map;
      map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 48 });

      posts.forEach((post) => {
        const point: [number, number] = [Number(post.latitude), Number(post.longitude)];
        const borderColor = post.status === "lost" ? "#ffca92" : "#9eb71a";
        const photoPath = post.photos?.[0]?.path;
        const photoUrl = photoPath ? absoluteUploadUrl(photoPath) : "";
        const safePhotoUrl = photoUrl ? escapeHtmlAttributeValue(photoUrl) : "";
        const iconContentLayout = (window.ymaps as NonNullable<Window["ymaps"]>).templateLayoutFactory.createClass(
          safePhotoUrl
            ? `<div class="petto-pin" style="border-color:${borderColor}"><img src="${safePhotoUrl}" alt="" /></div>`
            : `<div class="petto-pin petto-pin-empty" style="border-color:${borderColor};background:${borderColor}"><span class="petto-pin-dot"></span></div>`,
        );
        const placemark = new ymaps.Placemark(
          point,
          { hintContent: post.description || "Публикация" },
          {
            iconLayout: "default#imageWithContent",
            iconImageHref:
              "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=",
            iconImageSize: [40, 40],
            iconImageOffset: [-20, -20],
            iconContentSize: [40, 40],
            iconContentOffset: [-20, -20],
            iconContentLayout,
          },
        );
        placemark.events?.add?.("click", () => onOpenPost?.(post, false));
        map.geoObjects.add(placemark);
      });
    };
    void mount();

    return () => {
      cancelled = true;
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [bounds, onOpenPost, posts]);

  return <div ref={containerRef} className={styles.map} />;
}
