import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/shared/lib/auth-cookies";
import { getBackendErrorCodeFromPayload } from "@/shared/lib/getBackendErrorCode";
import { getBackendUrl } from "@/shared/lib/env";
import type { BackendSuccess } from "@/shared/types/api";

type Ctx = { params: Promise<{ chatId: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const { chatId } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const backendRes = await fetch(
    `${getBackendUrl()}/chats/${encodeURIComponent(chatId)}/messages`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
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
  return NextResponse.json(
    { success: true, data: { messages: payload.data } },
    { status: 200 },
  );
}

export async function POST(request: Request, { params }: Ctx) {
  const { chatId } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }
  const body = await request.text();
  const backendRes = await fetch(
    `${getBackendUrl()}/chats/${encodeURIComponent(chatId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body,
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
  return NextResponse.json(
    { success: true, data: { message: payload.data } },
    { status: 200 },
  );
}
