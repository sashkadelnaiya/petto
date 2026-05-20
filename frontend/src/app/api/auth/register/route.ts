import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/shared/lib/auth-cookies";
import { getBackendErrorCodeFromPayload } from "@/shared/lib/getBackendErrorCode";
import { getBackendUrl } from "@/shared/lib/env";
import type { BackendSuccess } from "@/shared/types/api";

type RegisterData = {
  user: { id: number; email: string; name: string };
  accessToken: string;
  refreshToken: string;
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const backendRes = await fetch(`${getBackendUrl()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await backendRes.json()) as
    | BackendSuccess<RegisterData>
    | { success: false; code?: string; error?: string };

  if (!backendRes.ok || !payload.success) {
    const code = getBackendErrorCodeFromPayload(payload);
    return NextResponse.json({ success: false, code }, { status: backendRes.status });
  }

  const { user, accessToken, refreshToken } = payload.data;
  const response = NextResponse.json({ success: true, data: { user } }, { status: 201 });
  response.cookies.set(ACCESS_COOKIE, accessToken, accessCookieOptions());
  response.cookies.set(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return response;
}
