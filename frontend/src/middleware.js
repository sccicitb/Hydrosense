import { NextResponse } from "next/server";

export function middleware(request) {
  const { cookies, nextUrl } = request;
  const token = cookies.get("token");
  const { pathname } = nextUrl;

  const validPaths = ["/login", "/dashboard", "/statistics", "/maps", "/titik-maps", "/3d-layer", "/reports", "/summary"];

  const publicPaths = ["/login"];

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  const isValidPath = validPaths.some((path) => pathname.startsWith(path)) || pathname === "/";

  if (!isValidPath) {
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }

  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url), 302); // ← status 302 untuk redirect
  }

  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url), 302);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
