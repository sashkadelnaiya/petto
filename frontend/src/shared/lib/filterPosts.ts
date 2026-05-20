import type { Post } from "@/entities/post/model/types";

export type PostStatusFilter = "lost" | "found" | null;

export function filterPostsBySearchAndStatus(
  posts: Post[],
  search: string,
  statusFilter: PostStatusFilter,
): Post[] {
  let list = posts;
  const q = search.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (p) =>
        p.hashtag?.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false),
    );
  }
  if (statusFilter) {
    list = list.filter((p) => p.status === statusFilter);
  }
  return list;
}
