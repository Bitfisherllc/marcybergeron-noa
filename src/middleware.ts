import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SITE_GATE_COOKIE_NAME, SITE_GATE_JWT_TYP } from "@/lib/siteGateConstants";

const ADMIN_COOKIE = "mbn_admin";

function siteGatePasswordConfigured(): boolean {
  return Boolean(process.env.SITE_GATE_PASSWORD?.trim());
}

function shouldSkipSiteGate(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/site-gate" ||
    pathname.startsWith("/site-gate/")
  );
}

async function hasValidSiteGateCookie(req: NextRequest): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return false;
  const token = req.cookies.get(SITE_GATE_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload.typ === SITE_GATE_JWT_TYP;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/gallery" || pathname === "/gallery/") {
    return NextResponse.redirect(new URL("/art", req.url));
  }

  if (siteGatePasswordConfigured() && !shouldSkipSiteGate(pathname)) {
    const ok = await hasValidSiteGateCookie(req);
    if (!ok) {
      const url = new URL("/site-gate", req.url);
      url.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(url);
    }
  }

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack-hmr).*)",
    "/gallery",
    "/gallery/",
  ],
};
