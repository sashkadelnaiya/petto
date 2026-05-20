"use client";

import { useEffect, useId, useRef } from "react";
import iconFilter1 from "@/shared/assets/filter.png";
import iconFilter2 from "@/shared/assets/filter@2x.png";
import iconFilter3 from "@/shared/assets/filter@3x.png";
import iconMap1 from "@/shared/assets/map-f.png";
import iconMap2 from "@/shared/assets/map-f@2x.png";
import iconMap3 from "@/shared/assets/map-f@3x.png";
import iconMapActive1 from "@/shared/assets/map-f_active.png";
import iconMapActive2 from "@/shared/assets/map-f_active@2x.png";
import iconMapActive3 from "@/shared/assets/map-f_active@3x.png";
import iconPostAdd1 from "@/shared/assets/post_add.png";
import iconPostAdd2 from "@/shared/assets/post_add@2x.png";
import iconPostAdd3 from "@/shared/assets/post_add@3x.png";
import iconReader1 from "@/shared/assets/reader.png";
import iconReader2 from "@/shared/assets/reader@2x.png";
import iconReader3 from "@/shared/assets/reader@3x.png";
import iconReaderActive1 from "@/shared/assets/readerActive.png";
import iconReaderActive2 from "@/shared/assets/readerActive@2x.png";
import iconReaderActive3 from "@/shared/assets/readerActive@3x.png";
import iconSearch1 from "@/shared/assets/search.png";
import iconSearch2 from "@/shared/assets/search@2x.png";
import iconSearch3 from "@/shared/assets/search@3x.png";
import { densitySrcSet, DensityImage } from "@/shared/ui/density-image/DensityImage";
import styles from "./FeedToolbar.module.css";

export type FeedToolbarMode = "feed" | "map";

type Props = {
  mode: FeedToolbarMode;
  onModeChange: (mode: FeedToolbarMode) => void;
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onFilterClick: () => void;
  onCreatePostClick: () => void;
};

function ReaderToggleIcon({ active }: { active: boolean }) {
  return (
    <span className={styles.toggleIconPair} aria-hidden>
      <img
        src={iconReader1.src}
        srcSet={densitySrcSet(iconReader1, iconReader2, iconReader3)}
        alt=""
        width={20}
        height={20}
        className={`${styles.toggleIconLayer} ${active ? styles.toggleIconOff : styles.toggleIconOn}`}
      />
      <img
        src={iconReaderActive1.src}
        srcSet={densitySrcSet(iconReaderActive1, iconReaderActive2, iconReaderActive3)}
        alt=""
        width={20}
        height={20}
        className={`${styles.toggleIconLayer} ${active ? styles.toggleIconOn : styles.toggleIconOff}`}
      />
    </span>
  );
}

function MapToggleIcon({ active }: { active: boolean }) {
  return (
    <span className={styles.toggleIconPair} aria-hidden>
      <img
        src={iconMap1.src}
        srcSet={densitySrcSet(iconMap1, iconMap2, iconMap3)}
        alt=""
        width={20}
        height={20}
        className={`${styles.toggleIconLayer} ${active ? styles.toggleIconOff : styles.toggleIconOn}`}
      />
      <img
        src={iconMapActive1.src}
        srcSet={densitySrcSet(iconMapActive1, iconMapActive2, iconMapActive3)}
        alt=""
        width={20}
        height={20}
        className={`${styles.toggleIconLayer} ${active ? styles.toggleIconOn : styles.toggleIconOff}`}
      />
    </span>
  );
}

export function FeedToolbar({
  mode,
  onModeChange,
  searchOpen,
  onSearchOpenChange,
  searchValue,
  onSearchValueChange,
  onFilterClick,
  onCreatePostClick,
}: Props) {
  const isFeed = mode === "feed";
  const isMap = mode === "map";
  const searchPanelId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    const id = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [searchOpen]);

  return (
    <header className={styles.bar} aria-label="Переключение вида ленты">
      <div className={styles.toggle} role="group" aria-label="Лента или карта">
        <button
          type="button"
          className={`${styles.toggleSegment} ${isFeed ? styles.toggleSegmentActive : ""}`}
          aria-pressed={isFeed}
          onClick={() => onModeChange("feed")}
        >
          <ReaderToggleIcon active={isFeed} />
          Лента
        </button>
        <button
          type="button"
          className={`${styles.toggleSegment} ${isMap ? styles.toggleSegmentActive : ""}`}
          aria-pressed={isMap}
          onClick={() => onModeChange("map")}
        >
          <MapToggleIcon active={isMap} />
          Карта
        </button>
      </div>
      <div className={styles.actions}>
        <div className={styles.searchCluster}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={searchOpen ? "Скрыть поиск" : "Поиск"}
            aria-expanded={searchOpen}
            aria-controls={searchPanelId}
            onClick={() => {
              onSearchOpenChange(!searchOpen);
              if (searchOpen) onSearchValueChange("");
            }}
          >
            <DensityImage
              src1x={iconSearch1}
              src2x={iconSearch2}
              src3x={iconSearch3}
              alt=""
              width={36}
              height={36}
              className={styles.iconBtnImg}
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
                    placeholder="Хештег или описание…"
                    value={searchValue}
                    onChange={(e) => onSearchValueChange(e.target.value)}
                    tabIndex={searchOpen ? 0 : -1}
                    aria-label="Поиск в ленте"
                    role="searchbox"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Фильтр по статусу"
          onClick={onFilterClick}
        >
          <DensityImage
            src1x={iconFilter1}
            src2x={iconFilter2}
            src3x={iconFilter3}
            alt=""
            width={36}
            height={36}
            className={styles.iconBtnImg}
          />
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Создать пост"
          onClick={onCreatePostClick}
        >
          <DensityImage
            src1x={iconPostAdd1}
            src2x={iconPostAdd2}
            src3x={iconPostAdd3}
            alt=""
            width={36}
            height={36}
            className={styles.iconBtnImg}
          />
        </button>
      </div>
    </header>
  );
}
