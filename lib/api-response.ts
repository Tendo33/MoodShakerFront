import { NextResponse } from "next/server";

export interface ApiErrorShape {
  code: string;
  message: string;
  requestId?: string;
}

export interface ApiResponseOptions {
  /**
   * Correlation id echoed to the caller and written to the server logs, so a
   * user-reported failure can be traced without guessing from timestamps.
   */
  requestId?: string;
  headers?: HeadersInit;
}

export function apiSuccess<T>(
  data: T,
  status: number = 200,
  options: ApiResponseOptions = {},
) {
  return NextResponse.json(
    { success: true, data },
    { status, headers: options.headers },
  );
}

export function apiError(
  code: string,
  message: string,
  status: number,
  options: ApiResponseOptions = {},
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(options.requestId ? { requestId: options.requestId } : {}),
      } satisfies ApiErrorShape,
    },
    { status, headers: options.headers },
  );
}
