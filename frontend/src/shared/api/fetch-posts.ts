import { cookies } from "next/headers";
import type { Post } from "@/entities/post/model/types";
import { BACKEND_PATHS } from "@/shared/api/backendPaths";
import { ACCESS_COOKIE } from "@/shared/lib/auth-cookies";
import { getBackendUrl } from "@/shared/lib/env";
import { withNormalizedFavoriteFlag } from "@/shared/lib/withNormalizedFavoriteFlag";

type FetchPostsParams = {
  status?: string | null;
  hashtag?: string | null;
  limit?: number;
  offset?: number;
};

export async function fetchPosts(params: FetchPostsParams = {}): Promise<Post[]> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const url = new URL(`${getBackendUrl()}${BACKEND_PATHS.posts}`);
    if (params.status) url.searchParams.set("status", params.status);
    if (params.hashtag) url.searchParams.set("hashtag", params.hashtag);
    if (typeof params.limit === "number") {
      url.searchParams.set("limit", String(params.limit));
    }
    if (typeof params.offset === "number") {
      url.searchParams.set("offset", String(params.offset));
    }

    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers,
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      success?: boolean;
      data?: Post[];
    };
    if (!json.success || !Array.isArray(json.data)) return [];
    return json.data.map((p) => withNormalizedFavoriteFlag(p as Post));
  } catch {
    return [];
  }
}
