"only server";

import prisma from "@/lib/prisma";

/**
 * Crea una nueva sesión en la base de datos para un usuario.
 *
 * @param {Object} params - Parámetros necesarios para crear la sesión.
 * @param {string} params.userId - ID del usuario asociado a la sesión.
 * @param {string} [params.ipAddress] - Dirección IP del usuario (opcional).
 * @param {string} [params.userAgent] - Información del navegador o dispositivo del usuario (opcional).
 * @param {string} [params.location] - Ubicación geográfica aproximada del usuario (opcional).
 * @returns {Promise<Object>} - Objeto de sesión creado en la base de datos.
 *
 * @example
 * const session = await createServerSession({
 *   userId: "user123",
 *   ipAddress: "192.168.1.1",
 *   userAgent: "Mozilla/5.0",
 *   location: "New York, USA",
 * });
 */
export async function createServerSession({
  userId,
  ipAddress,
  userAgent,
  location,
}: {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day

  const session = await prisma.session.create({
    data: {
      userId,
      ipAddress,
      userAgent,
      location,
      lastActivity: now,
      expiresAt,
    },
  });

  return session;
}

/**
 * Obtiene una sesión activa del servidor asociada a un usuario.
 *
 * @param {string} userId - ID del usuario cuya sesión se va a buscar.
 * @returns {Promise<Object|null>} - Objeto de sesión activa o null si no se encuentra.
 *
 * @example
 * const session = await getServerSession("user123");
 * if (!session) {
 *   console.log("No hay sesión activa");
 * }
 */
export async function getServerSession(userId: string) {
  const now = new Date();

  const session = await prisma.session.findFirst({
    where: {
      userId,
      isActive: true,
      expiresAt: { gte: now },
    },
  });

  if (!session) {
    return null;
  }

  // Actualiza la actividad de la sesión
  await prisma.session.update({
    where: { id: session.id },
    data: { lastActivity: now },
  });

  return session;
}

/**
 * Elimina todas las sesiones activas asociadas a un usuario.
 *
 * @param {string} userId - ID del usuario cuyas sesiones se van a eliminar.
 * @returns {Promise<void>} - No retorna nada.
 *
 * @example
 * await deleteServerSession("user123");
 * console.log("Sesión eliminada");
 */
export async function deleteServerSession(userId: string) {
  await prisma.session.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false, terminatedAt: new Date() },
  });
}
