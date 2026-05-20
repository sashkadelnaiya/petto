"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { createPortal } from "react-dom";
import styles from "./PhotoViewerModal.module.css";

type Props = {
  open: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const SWIPE_THRESHOLD = 60;
const EXIT_MS = 220;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type Point = { x: number; y: number };

export function PhotoViewerModal({ open, images, initialIndex, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [swipe, setSwipe] = useState(0);
  const [animateSwipe, setAnimateSwipe] = useState(true);
  const [gestureActive, setGestureActive] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const gestureRef = useRef<{
    mode: "none" | "pan" | "swipe" | "pinch";
    startOffset: Point;
    startZoom: number;
    startDistance: number;
    startMid: Point;
    startPointer: Point;
  }>({
    mode: "none",
    startOffset: { x: 0, y: 0 },
    startZoom: 1,
    startDistance: 0,
    startMid: { x: 0, y: 0 },
    startPointer: { x: 0, y: 0 },
  });

  const canSlide = images.length > 1;

  useEffect(() => {
    if (open) {
      setMounted(true);
      setIndex(initialIndex);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setSwipe(0);
      const t = window.setTimeout(() => setEntered(true), 20);
      return () => window.clearTimeout(t);
    }
    if (!mounted) return;
    setEntered(false);
    const t = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open, initialIndex, mounted]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const goNext = useCallback(() => {
    if (!canSlide) return;
    setIndex((p) => (p + 1) % images.length);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [canSlide, images.length]);

  const goPrev = useCallback(() => {
    if (!canSlide) return;
    setIndex((p) => (p - 1 + images.length) % images.length);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [canSlide, images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "+" || e.key === "=")
        setZoom((z) => clamp(z + 0.25, MIN_ZOOM, MAX_ZOOM));
      if (e.key === "-") {
        setZoom((z) => {
          const next = clamp(z - 0.25, MIN_ZOOM, MAX_ZOOM);
          if (next === 1) setOffset({ x: 0, y: 0 });
          return next;
        });
      }
      if (e.key === "0") {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, goNext, goPrev]);

  const setPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };

  const removePointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button === 2) return;
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    setPointer(e);
    setGestureActive(true);
    setAnimateSwipe(false);

    const pts = [...pointersRef.current.values()];
    if (pts.length === 2) {
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      gestureRef.current = {
        mode: "pinch",
        startOffset: offset,
        startZoom: zoom,
        startDistance: Math.hypot(dx, dy) || 1,
        startMid: {
          x: (pts[0].x + pts[1].x) / 2,
          y: (pts[0].y + pts[1].y) / 2,
        },
        startPointer: { x: e.clientX, y: e.clientY },
      };
      return;
    }

    gestureRef.current = {
      mode: zoom > 1 ? "pan" : "swipe",
      startOffset: offset,
      startZoom: zoom,
      startDistance: 0,
      startMid: { x: 0, y: 0 },
      startPointer: { x: e.clientX, y: e.clientY },
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    setPointer(e);
    const g = gestureRef.current;

    if (g.mode === "pinch") {
      const pts = [...pointersRef.current.values()];
      if (pts.length < 2) return;
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const distance = Math.hypot(dx, dy) || 1;
      const nextZoom = clamp(
        g.startZoom * (distance / g.startDistance),
        MIN_ZOOM,
        MAX_ZOOM,
      );
      setZoom(nextZoom);
      if (nextZoom === 1) setOffset({ x: 0, y: 0 });
      return;
    }

    const dx = e.clientX - g.startPointer.x;
    const dy = e.clientY - g.startPointer.y;

    if (g.mode === "pan") {
      setOffset({
        x: g.startOffset.x + dx,
        y: g.startOffset.y + dy,
      });
      return;
    }

    if (g.mode === "swipe") {
      setSwipe(dx);
    }
  };

  const endGesture = (e: ReactPointerEvent<HTMLDivElement>) => {
    removePointer(e);
    const g = gestureRef.current;

    if (pointersRef.current.size >= 1 && g.mode === "pinch") {
      gestureRef.current = {
        ...g,
        mode: zoom > 1 ? "pan" : "swipe",
        startPointer: { x: e.clientX, y: e.clientY },
        startOffset: offset,
      };
      return;
    }

    if (pointersRef.current.size === 0) {
      setGestureActive(false);
      if (g.mode === "swipe") {
        setAnimateSwipe(true);
        if (Math.abs(swipe) > SWIPE_THRESHOLD) {
          if (swipe < 0) goNext();
          else goPrev();
        }
        setSwipe(0);
      }
      gestureRef.current.mode = "none";
    }
  };

  const onWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((z) => {
      const next = clamp(z + delta, MIN_ZOOM, MAX_ZOOM);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const current = useMemo(() => images[index] ?? null, [images, index]);
  if (!mounted || typeof document === "undefined" || !current) return null;

  const overlayClass = `${styles.overlay} ${entered ? styles.overlayOpen : ""}`;
  const shellClass = `${styles.shell} ${entered ? styles.shellOpen : ""}`;

  const imageTransform = `translate3d(${offset.x + swipe}px, ${offset.y}px, 0) scale(${zoom})`;
  const imageTransition =
    gestureActive && !animateSwipe ? "none" : undefined;

  return createPortal(
    <div
      className={overlayClass}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div className={shellClass}>
        <header className={styles.topBar}>
          {canSlide ? (
            <span className={styles.counter} aria-live="polite">
              {index + 1} / {images.length}
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onClose}
            aria-label="Закрыть"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div
          ref={stageRef}
          className={styles.stage}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endGesture}
          onPointerCancel={endGesture}
          onWheel={onWheel}
          onDoubleClick={() => {
            if (zoom > 1) {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            } else {
              setZoom(2);
            }
          }}
        >
          {canSlide ? (
            <button
              type="button"
              className={`${styles.iconBtn} ${styles.navBtn} ${styles.navPrev}`}
              onClick={goPrev}
              aria-label="Предыдущее фото"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}

          <img
            src={current}
            alt=""
            draggable={false}
            className={styles.image}
            style={{
              transform: imageTransform,
              transition: imageTransition,
              cursor:
                zoom > 1
                  ? gestureActive
                    ? "grabbing"
                    : "grab"
                  : "zoom-in",
            }}
            onDragStart={(e) => e.preventDefault()}
          />

          {canSlide ? (
            <button
              type="button"
              className={`${styles.iconBtn} ${styles.navBtn} ${styles.navNext}`}
              onClick={goNext}
              aria-label="Следующее фото"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
        </div>

        <footer className={styles.bottomBar}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Уменьшить"
            onClick={() =>
              setZoom((z) => {
                const next = clamp(z - 0.25, MIN_ZOOM, MAX_ZOOM);
                if (next === 1) setOffset({ x: 0, y: 0 });
                return next;
              })
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Сбросить масштаб"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 8V5a1 1 0 011-1h3M20 8V5a1 1 0 00-1-1h-3M4 16v3a1 1 0 001 1h3M20 16v3a1 1 0 01-1 1h-3"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Увеличить"
            onClick={() =>
              setZoom((z) => clamp(z + 0.25, MIN_ZOOM, MAX_ZOOM))
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
