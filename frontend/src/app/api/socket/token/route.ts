import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/shared/lib/auth-cookies";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true, data: { token: accessToken } }, { status: 200 });
}
