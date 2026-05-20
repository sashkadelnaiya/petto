import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/shared/lib/auth-cookies";
import { getBackendUrl } from "@/shared/lib/env";
import type { BackendSuccess } from "@/shared/types/api";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const formData = await request.formData();

  const backendRes = await fetch(`${getBackendUrl()}/me/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
    cache: "no-store",
  });

  const payload = (await backendRes.json()) as
    | BackendSuccess<unknown>
    | { success: false; code?: string };

  return NextResponse.json(payload, { status: backendRes.status });
}

export async function DELETE() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const backendRes = await fetch(`${getBackendUrl()}/me/avatar`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const payload = (await backendRes.json()) as
    | BackendSuccess<unknown>
    | { success: false; code?: string };

  return NextResponse.json(payload, { status: backendRes.status });
}
