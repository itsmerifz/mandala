import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Permission as PrismaPermissionEnum } from "@root/prisma/generated";

const protectedRoutesConfig: Record<string, PrismaPermissionEnum[]> = {
  "/roster/manage": [PrismaPermissionEnum.MANAGE_ROSTER],
  "/settings": [PrismaPermissionEnum.MANAGE_WEB, PrismaPermissionEnum.ADMINISTRATOR],
  "/events/manage": [PrismaPermissionEnum.MANAGE_EVENT],
  "/training/manage": [PrismaPermissionEnum.MANAGE_TRAINING],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

  if (!token && pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/main", request.url));
  }

  if (token && token.appPermissions) {
    const userPermissions = token.appPermissions as PrismaPermissionEnum[];

    const isAdmin = userPermissions.includes(PrismaPermissionEnum.ADMINISTRATOR);

    if (isAdmin) {
      return NextResponse.next();
    }

    for (const pathPrefix in protectedRoutesConfig) {
      if (pathname.startsWith(pathPrefix)) {
        const requiredPermissions = protectedRoutesConfig[pathPrefix];
        const hasRequiredPermission = requiredPermissions.some(rp => userPermissions.includes(rp));

        if (!hasRequiredPermission) {
          console.log(`User tidak diizinkan mengakses ${pathname}. Permission dibutuhkan: ${requiredPermissions.join(', ')}. Permission dimiliki: ${userPermissions.join(', ')}`);
          return NextResponse.redirect(new URL("/main?error=unauthorized", request.url));
        }
        return NextResponse.next();
      }
    }
  } else if (pathname !== "/" && Object.keys(protectedRoutesConfig).some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};