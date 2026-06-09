import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Accept trailing-slash URLs (e.g. /login/) by rewriting to the canonical route.
 * Next.js App Router uses paths without trailing slashes by default.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return NextResponse.rewrite(new URL(pathname.slice(0, -1), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
