import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "joguecapao_admin_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isPublicAdminRoute = pathname === "/admin" || pathname === "/admin/logout";

  if (!isAdminRoute || isPublicAdminRoute) {
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(request.cookies.get(ADMIN_COOKIE_NAME)?.value);

  if (!hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.searchParams.set("bloqueado", "1");
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
