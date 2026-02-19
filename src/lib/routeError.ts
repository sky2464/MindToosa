import { NextResponse } from "next/server";
import { AppError, AuthError, ValidationError } from "@/lib/errors";

/**
 * Converts a caught error into a typed NextResponse.
 * - ValidationError → 400
 * - AuthError       → 403
 * - AppError        → 500
 * - unknown         → 500
 */
export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
  }
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 403 });
  }
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }
  const message = error instanceof Error ? error.message : "An unknown error occurred";
  return NextResponse.json({ error: message }, { status: 500 });
}
