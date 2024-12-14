/* eslint-disable @typescript-eslint/no-explicit-any */

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const NAME_AUTH_SESSION = "auth_session";
const SECRET_KEY = process.env.SESSION_SECRET;

if (!SECRET_KEY) {
  throw new Error("La variable de entorno SESSION_SECRET no está configurada.");
}

// Codifica la clave secreta para encriptación/desencriptación
const encodedKey = new TextEncoder().encode(SECRET_KEY);

/**
 * Encripta los datos en un JWT.
 * @param data Objeto a encriptar.
 * @returns Token encriptado.
 */
export async function encryptData(data: Record<string, any>): Promise<string> {
  return await new SignJWT(data)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d") // 1 día de expiración
    .sign(encodedKey);
}

/**
 * Desencripta un JWT.
 * @param token Token JWT a desencriptar.
 * @returns Datos desencriptados o null si falla.
 */
export async function decryptData(
  token: string
): Promise<Record<string, any> | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as Record<string, any>;
  } catch (error) {
    console.error("Error al desencriptar los datos:", error);
    return null;
  }
}

/**
 * Crea una sesión en las cookies con los datos encriptados.
 * @param data Datos del usuario.
 */
export async function createClientSession(data: Record<string, any>) {
  const expiresAt = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 día
  const sessionToken = await encryptData(data);

  (await cookies()).set(NAME_AUTH_SESSION, sessionToken, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Obtiene y desencripta la sesión desde las cookies.
 * @returns Datos del usuario o null si no hay sesión válida.
 */
export async function getClientSession(): Promise<Record<string, any> | null> {
  const sessionToken = (await cookies()).get(NAME_AUTH_SESSION)?.value;
  if (!sessionToken) return null;

  return await decryptData(sessionToken);
}

/**
 * Elimina la sesión del cliente eliminando las cookies.
 */
export async function deleteClientSession() {
  (await cookies()).delete(NAME_AUTH_SESSION);
}

/**
 * Procesa la cookie y devuelve los datos desencriptados.
 * @param cookieToken Token de sesión enviado desde el cliente.
 * @returns Datos desencriptados o null.
 */
export async function processSessionCookie(
  cookieToken: string
): Promise<Record<string, any> | null> {
  if (!cookieToken) return null;
  return await decryptData(cookieToken);
}
