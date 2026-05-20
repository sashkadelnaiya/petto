import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/shared/lib/auth-cookies";
import { getBackendErrorCodeFromPayload } from "@/shared/lib/getBackendErrorCode";
import { getBackendUrl } from "@/shared/lib/env";
import type { BackendSuccess } from "@/shared/types/api";

type Ctx = { params: Promise<{ commentId: string }> };

async function proxyComment(
  request: Request,
  { params }: Ctx,
  method: "PUT" | "DELETE",
) {
  const { commentId } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const backendRes = await fetch(
    `${getBackendUrl()}/comments/${encodeURIComponent(commentId)}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(method === "PUT" ? { "Content-Type": "application/json" } : {}),
      },
      body: method === "PUT" ? await request.text() : undefined,
      cache: "no-store",
    },
  );

  const payload = (await backendRes.json()) as
    | BackendSuccess<unknown>
    | { success: false; code?: string };

  if (!backendRes.ok || !payload.success) {
    const code = getBackendErrorCodeFromPayload(payload);
    return NextResponse.json({ success: false, code }, { status: backendRes.status });
  }

  return NextResponse.json(payload, { status: backendRes.status });
}

export async function PUT(request: Request, ctx: Ctx) {
  return proxyComment(request, ctx, "PUT");
}

export async function DELETE(request: Request, ctx: Ctx) {
  return proxyComment(request, ctx, "DELETE");
}
