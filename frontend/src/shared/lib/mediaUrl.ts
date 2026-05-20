import { getPublicBackendUrl } from "@/shared/lib/env";

export function absoluteUploadUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const base = getPublicBackendUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
