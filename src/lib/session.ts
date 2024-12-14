"only server";

import { SignJWT, jwtVerify } from "jose";
import { NAME_AUTH_SESSION, SessionPayload } from "@/types/session";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  if (!session) return;
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    console.error("Failed to verify session", error);
  }
}

export async function getSession() {
  const session = (await cookies()).get(NAME_AUTH_SESSION)?.value;
  const payload = await decrypt(session);

  if (!session || !payload) {
    return null;
  }

  return payload as SessionPayload;
}

export async function createSession({
  userId,
  tokenSession,
  tokenRefresh,
}: SessionPayload) {
  // Genera el token JWT
  const sessionToken = await encrypt({
    userId,
    tokenSession,
    tokenRefresh,
  });

  const expiresAt = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day

  // Obtiene el objeto cookies y establece la cookie
  (await cookies()).set(NAME_AUTH_SESSION, sessionToken, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });

  // Devuelve el token generado
  return sessionToken;
}

export async function updateSession() {
  const session = (await cookies()).get(NAME_AUTH_SESSION)?.value;
  const payload = await decrypt(session);

  if (!session || !payload) {
    return null;
  }

  const expiresAt = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day

  const cookieStore = await cookies();
  cookieStore.set(NAME_AUTH_SESSION, session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(NAME_AUTH_SESSION);
}
