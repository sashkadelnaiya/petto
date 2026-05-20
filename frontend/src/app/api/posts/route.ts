import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/shared/lib/auth-cookies";
import { getBackendErrorCodeFromPayload } from "@/shared/lib/getBackendErrorCode";
import { getBackendUrl } from "@/shared/lib/env";
import type { BackendSuccess } from "@/shared/types/api";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const incomingUrl = new URL(request.url);
  const backendUrl = new URL(`${getBackendUrl()}/posts`);
  incomingUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  const headers: HeadersInit = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const backendRes = await fetch(backendUrl.toString(), {
    method: "GET",
    headers,
    cache: "no-store",
  });

  const payload = (await backendRes.json()) as
    | BackendSuccess<unknown>
    | { success: false; code?: string };

  if (!backendRes.ok || !payload.success) {
    const code = getBackendErrorCodeFromPayload(payload);
    return NextResponse.json({ success: false, code }, { status: backendRes.status });
  }

  return NextResponse.json(payload, { status: backendRes.status });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const body = await request.text();
  const backendRes = await fetch(`${getBackendUrl()}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
  });

  const payload = (await backendRes.json()) as
    | BackendSuccess<unknown>
    | { success: false; code?: string };

  if (!backendRes.ok || !payload.success) {
    const code = getBackendErrorCodeFromPayload(payload);
    return NextResponse.json({ success: false, code }, { status: backendRes.status });
  }

  return NextResponse.json(payload, { status: backendRes.status });
}
