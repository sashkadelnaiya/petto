import type { Post } from "@/entities/post/model/types";

export function withNormalizedFavoriteFlag(p: Post): Post {
  const raw = (p as { is_favorited?: unknown }).is_favorited;
  return {
    ...p,
    is_favorited: raw === true || raw === 1 || raw === "1",
  };
}
