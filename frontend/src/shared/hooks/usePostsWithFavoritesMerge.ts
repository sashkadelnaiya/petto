"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Post } from "@/entities/post/model/types";
import { bffFetch } from "@/shared/api/bff-client";
import { isBffError, parseBffJson } from "@/shared/lib/parseBffJson";

export function usePostsWithFavoritesMerge(
  posts: Post[],
  viewerUserId: number | null,
): readonly [Post[], Dispatch<SetStateAction<Post[]>>] {
  const [localPosts, setLocalPosts] = useState(posts);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (viewerUserId == null) {
        if (!cancelled) {
          setLocalPosts(posts.map((p) => ({ ...p, is_favorited: false })));
        }
        return;
      }

      const res = await bffFetch("/api/me/favorites");
      const json = await parseBffJson<Post[]>(res);
      if (cancelled) return;

      const favOk =
        res.ok && !isBffError(json) && Array.isArray(json.data);
      const favIds = favOk
        ? new Set(json.data.map((p) => p.id))
        : null;

      if (!cancelled) {
        setLocalPosts(
          posts.map((p) => ({
            ...p,
            is_favorited: favIds
              ? favIds.has(p.id)
              : p.is_favorited === true,
          })),
        );
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [posts, viewerUserId]);

  return [localPosts, setLocalPosts] as const;
}
