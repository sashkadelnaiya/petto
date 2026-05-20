"use client";

import { useCallback, useState } from "react";
import styles from "./PostCard.module.css";

type Props = {
  src: string;
  alt: string;
};

export function PostCardImage({ src, alt }: Props) {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");

  const handleImgRef = useCallback((el: HTMLImageElement | null) => {
    if (!el) return;
    if (el.complete && el.naturalHeight > 0) {
      setPhase("ready");
    } else if (el.complete) {
      setPhase("error");
    }
  }, []);

  return (
    <div className={styles.imageWrap}>
      {phase === "error" ? (
        <div className={styles.imageFallback} role="img" aria-label={alt} />
      ) : (
        <>
          <img
            ref={handleImgRef}
            className={`${styles.image} ${phase === "ready" ? styles.imageReady : styles.imageLoading}`}
            src={src}
            alt={alt}
            itemProp="image"
            loading="eager"
            decoding="async"
            width={800}
            height={600}
            onLoad={() => setPhase("ready")}
            onError={() => setPhase("error")}
          />
          {phase === "loading" ? (
            <div className={styles.imageShimmer} aria-hidden />
          ) : null}
        </>
      )}
    </div>
  );
}
