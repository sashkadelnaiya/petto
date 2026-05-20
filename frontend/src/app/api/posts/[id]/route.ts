import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/shared/lib/auth-cookies";
import { getBackendErrorCodeFromPayload } from "@/shared/lib/getBackendErrorCode";
import { getBackendUrl } from "@/shared/lib/env";
import type { BackendSuccess } from "@/shared/types/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  }
  const body = await request.text();
  const backendRes = await fetch(`${getBackendUrl()}/posts/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
  });
  const payload = (await backendRes.json()) as BackendSuccess<unknown> | { success: false; code?: string };
  if (!backendRes.ok || !payload.success) {
    const code = getBackendErrorCodeFromPayload(payload);
    return NextResponse.json({ success: false, code }, { status: backendRes.status });
  }
  return NextResponse.json(payload, { status: backendRes.status });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const { id } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  }
  const backendRes = await fetch(`${getBackendUrl()}/posts/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const payload = (await backendRes.json()) as BackendSuccess<unknown> | { success: false; code?: string };
  if (!backendRes.ok || !payload.success) {
    const code = getBackendErrorCodeFromPayload(payload);
    return NextResponse.json({ success: false, code }, { status: backendRes.status });
  }
  return NextResponse.json(payload, { status: backendRes.status });
}
