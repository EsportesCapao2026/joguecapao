import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isAdminSessionValid } from "@/lib/adminAuth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isPublicAdminRoute = pathname === "/admin" || pathname === "/admin/logout";

  if (!isAdminRoute || isPublicAdminRoute) {
    return NextResponse.next();
  }

  const session = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!isAdminSessionValid(session)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.searchParams.set("bloqueado", "1");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
