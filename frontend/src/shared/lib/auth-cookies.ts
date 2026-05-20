export const ACCESS_COOKIE = "petto_access";
export const REFRESH_COOKIE = "petto_refresh";

const ONE_DAY_SEC = 60 * 60 * 24;
const THIRTY_DAYS_SEC = 30 * 24 * 60 * 60;

function baseOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function accessCookieOptions() {
  return { ...baseOptions(), maxAge: ONE_DAY_SEC };
}

export function refreshCookieOptions() {
  return { ...baseOptions(), maxAge: THIRTY_DAYS_SEC };
}
