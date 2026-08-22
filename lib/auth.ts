import "server-only";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

/**
 * Returns the authenticated user's ID from the current Next.js server context.
 * Throws a 401-style error if the user is not signed in.
 *
 * Drop-in replacement for the old guest-cookie getOrCreateUserId() — every
 * API route that called that function continues to work because the function
 * signature is identical (returns Promise<string>).
 */
export async function getOrCreateUserId(): Promise<string> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  return session.user.id;
}

/**
 * Returns the full session object (or null if unauthenticated).
 * Useful in Server Components that need name/email/image too.
 */
export async function getSession() {
  return getServerSession(authOptions);
}
