type BackendErrJson = {
  success?: boolean;
  code?: string;
  error?: string;
};

export function getBackendErrorCodeFromPayload(
  payload: BackendErrJson,
): string {
  if (payload.success !== false) {
    return "REQUEST_FAILED";
  }
  const code = payload.code ?? payload.error;
  return typeof code === "string" && code.length > 0 ? code : "REQUEST_FAILED";
}
