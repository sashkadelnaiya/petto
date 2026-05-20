import type { BackendErrorBody, BackendSuccess } from "@/shared/types/api";

export async function parseBffJson<T>(
  res: Response,
): Promise<BackendSuccess<T> | BackendErrorBody> {
  return res.json() as Promise<BackendSuccess<T> | BackendErrorBody>;
}

export function isBffError(
  body: BackendSuccess<unknown> | BackendErrorBody,
): body is BackendErrorBody {
  return !body.success;
}
