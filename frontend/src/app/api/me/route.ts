import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/shared/lib/auth-cookies";
import { getBackendErrorCodeFromPayload } from "@/shared/lib/getBackendErrorCode";
import { getBackendUrl } from "@/shared/lib/env";
import type { BackendSuccess } from "@/shared/types/api";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const backendRes = await fetch(`${getBackendUrl()}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const payload = (await backendRes.json()) as
    | BackendSuccess<unknown>
    | { success: false; code?: string; error?: string };

  if (!backendRes.ok || !payload.success) {
    const code = getBackendErrorCodeFromPayload(payload);
    return NextResponse.json({ success: false, code }, { status: backendRes.status });
  }

  return NextResponse.json(payload);
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const backendRes = await fetch(`${getBackendUrl()}/me`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await backendRes.json()) as
    | BackendSuccess<unknown>
    | { success: false; code?: string };

  return NextResponse.json(payload, { status: backendRes.status });
}
