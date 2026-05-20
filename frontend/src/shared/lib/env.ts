export function getBackendUrl(): string {
  const url = process.env.BACKEND_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function getPublicBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}
