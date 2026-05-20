import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from "@/shared/lib/auth-cookies";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const hasSession =
    Boolean(cookieStore.get(ACCESS_COOKIE)?.value) ||
    Boolean(cookieStore.get(REFRESH_COOKIE)?.value);

  if (!hasSession) {
    redirect("/login");
  }

  return children;
}
