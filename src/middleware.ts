import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session"; // Para validar la sesión en la base de datos
import { processSessionCookie } from "@/lib/client-session"; // Para desencriptar la cookie
import { NAME_AUTH_SESSION } from "./types/session";

const protectedRoutes = ["/settings"];
const authRoutes = ["/login"];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.includes(path);
  const isAuthRoute = authRoutes.includes(path);

  // 1. Extrae la cookie del request
  const sessionCookie = req.cookies.get(NAME_AUTH_SESSION)?.value;

  // 2. Validación adicional: si no hay cookie, redirige a la página principal o login
  if (!sessionCookie) {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
    return NextResponse.redirect(new URL("/", req.nextUrl)); // Redirige a la página principal
  }

  // 3. Desencripta la cookie y extrae los datos del usuario
  const userData = await processSessionCookie(sessionCookie);

  if (!userData) {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
    return NextResponse.redirect(new URL("/", req.nextUrl)); // Redirige a la página principal
  }

  // 4. Verifica la sesión en el servidor usando el userId
  const session = await getServerSession(userData.userId);

  if (!session) {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
    return NextResponse.redirect(new URL("/", req.nextUrl)); // Redirige a la página principal
  }

  // 5. Redirige al dashboard si el usuario autenticado accede a una ruta de login
  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // 6. Si todo es válido, permite continuar
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
