import styles from "./PostsGridSkeleton.module.css";

const PLACEHOLDER_COUNT = 6;

function PostCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden>
      <div className={`${styles.image} ${styles.shimmer}`} />
      <div className={styles.body}>
        <div className={styles.row}>
          <div className={styles.author}>
            <div className={`${styles.avatar} ${styles.shimmer}`} />
            <div className={`${styles.line} ${styles.lineWide} ${styles.shimmer}`} />
          </div>
          <div className={`${styles.line} ${styles.lineShort} ${styles.shimmer}`} />
        </div>
        <div className={`${styles.line} ${styles.lineAddress} ${styles.shimmer}`} />
        <div className={`${styles.line} ${styles.lineDesc} ${styles.shimmer}`} />
        <div
          className={`${styles.line} ${styles.lineDesc} ${styles.lineDesc2} ${styles.shimmer}`}
        />
        <div className={styles.tags}>
          <div className={`${styles.tag} ${styles.shimmer}`} />
          <div className={`${styles.tag} ${styles.tagHash} ${styles.shimmer}`} />
        </div>
        <div className={styles.footer}>
          <div className={`${styles.btn} ${styles.shimmer}`} />
          <div className={`${styles.link} ${styles.shimmer}`} />
          <div className={`${styles.bookmark} ${styles.shimmer}`} />
        </div>
      </div>
    </div>
  );
}

export function PostsGridSkeleton() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite" aria-busy="true">
      <p className={styles.srOnly}>Загрузка публикаций…</p>
      <ul className={styles.list} aria-hidden="true">
        {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
          <li key={i} className={styles.item}>
            <PostCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
