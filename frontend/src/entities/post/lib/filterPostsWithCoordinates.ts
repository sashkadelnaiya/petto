import type { Post } from "@/entities/post/model/types";

export type PostWithCoordinates = Post & {
  latitude: number;
  longitude: number;
};

function hasValidCoordinates(p: Post): p is PostWithCoordinates {
  if (p.latitude == null || p.longitude == null) return false;
  const lat = Number(p.latitude);
  const lng = Number(p.longitude);
  return !Number.isNaN(lat) && !Number.isNaN(lng);
}

export function filterPostsWithCoordinates(posts: Post[]): PostWithCoordinates[] {
  return posts.filter(hasValidCoordinates);
}
