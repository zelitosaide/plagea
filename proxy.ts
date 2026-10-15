import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

const PUBLIC_API_ROUTES = ["/api/auth/login", "/api/auth/logout", "/api/auth/me"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_API_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (pathname.startsWith("/api/")) {
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (pathname.startsWith("/api/departments") && session.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (pathname.startsWith("/api/admin/") && session.role !== "admin" && session.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin/departments")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "superadmin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "admin" && session.role !== "superadmin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
