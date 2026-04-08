import { NextResponse } from "next/server";

export interface ApiErrorShape {
  code: string;
  message: string;
}

export function apiSuccess<T>(
  data: T,
  status: number = 200,
  init?: ResponseInit,
) {
  return NextResponse.json({ success: true, data }, { status, ...init });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  init?: ResponseInit,
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      } satisfies ApiErrorShape,
    },
    { status, ...init },
  );
}
