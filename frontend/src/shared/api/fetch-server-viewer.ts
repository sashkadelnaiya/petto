import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/shared/lib/auth-cookies";
import { getBackendUrl } from "@/shared/lib/env";

export type ServerViewer = {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
};

export async function fetchServerViewer(): Promise<ServerViewer | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  const res = await fetch(`${getBackendUrl()}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const payload = (await res.json()) as {
    success?: boolean;
    data?: { user?: ServerViewer };
  };

  if (!res.ok || !payload.success || !payload.data?.user) return null;
  const u = payload.data.user;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar ?? null,
  };
}
