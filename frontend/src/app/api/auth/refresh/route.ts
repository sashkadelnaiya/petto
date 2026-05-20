import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
} from "@/shared/lib/auth-cookies";
import { getBackendErrorCodeFromPayload } from "@/shared/lib/getBackendErrorCode";
import { getBackendUrl } from "@/shared/lib/env";
import type { BackendSuccess } from "@/shared/types/api";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, code: "REFRESH_TOKEN_REQUIRED" },
      { status: 401 },
    );
  }

  const backendRes = await fetch(`${getBackendUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const payload = (await backendRes.json()) as
    | BackendSuccess<{ accessToken: string }>
    | { success: false; code?: string; error?: string };

  if (!backendRes.ok || !payload.success) {
    const code = getBackendErrorCodeFromPayload(payload);
    const response = NextResponse.json(
      {
        success: false,
        code,
      },
      { status: backendRes.status },
    );
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  const response = NextResponse.json({ success: true, data: { ok: true } });
  response.cookies.set(
    ACCESS_COOKIE,
    payload.data.accessToken,
    accessCookieOptions(),
  );
  return response;
}
