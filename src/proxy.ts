import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/cadastro", "/api/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // Valida a sessão de verdade (não só a presença do cookie).
  const session = await auth.api.getSession({ headers: request.headers });
  const isAuthPage = pathname === "/login" || pathname === "/cadastro";
  const target =
    !session && !isPublic ? "/login" : session && isAuthPage ? "/" : null;

  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
