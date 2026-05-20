export type BackendSuccess<T> = { success: true; data: T };

export type BackendErrorBody = { success: false; code: string };
