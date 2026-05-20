import {
  SERVER_ERROR_FALLBACK,
  serverErrorMap,
  type ServerErrorCode,
} from "@/shared/i18n/serverErrorMap";

export function getServerErrorMessage(code: string | undefined): string {
  if (!code) return SERVER_ERROR_FALLBACK;
  if (code in serverErrorMap) {
    return serverErrorMap[code as ServerErrorCode];
  }
  return SERVER_ERROR_FALLBACK;
}
