import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Retries a Prisma operation up to `maxAttempts` times with exponential backoff.
 * This handles Neon free-tier cold starts where the DB takes a few seconds to wake.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 2000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isConnectionError =
        err?.message?.includes("Can't reach database") ||
        err?.message?.includes("Connection refused") ||
        err?.message?.includes("ECONNREFUSED") ||
        err?.message?.includes("ConnectionReset") ||
        err?.message?.includes("10054") ||
        err?.message?.includes("forcibly closed") ||
        err?.message?.includes("Server has closed the connection") ||
        err?.code === "P1001" || // Prisma: can't reach server
        err?.code === "P1002" || // Prisma: timed out reaching server
        err?.code === "P1017" || // Prisma: server closed connection
        err?.code === "P2024";   // Prisma: connection pool timeout

      if (!isConnectionError || attempt === maxAttempts) throw err;

      const delay = baseDelayMs * attempt;
      console.warn(
        `[DB] Connection attempt ${attempt}/${maxAttempts} failed (Neon cold start?). Retrying in ${delay}ms…`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
