import { NextResponse } from "next/server";

/**
 * Standardized API response helpers.
 * Use these instead of raw NextResponse.json() for consistency.
 */

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}) },
    { status: 400 }
  );
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function tooManyRequests(resetAt: number) {
  return NextResponse.json(
    {
      error: "Too many requests. Please slow down.",
      retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    }
  );
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}