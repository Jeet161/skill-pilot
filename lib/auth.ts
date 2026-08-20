import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";

const COOKIE_NAME = "skillpilot_uid";

/**
 * SkillPilot's focus is the adaptive assessment engine, not auth
 * plumbing. This module provisions a lightweight per-browser identity
 * via an httpOnly cookie so that every assessment session has a real
 * owning user (required for the ownership checks in the orchestrator),
 * without pulling in a full auth provider.
 *
 * Swap this for NextAuth / Clerk / your identity provider in production —
 * every other module only depends on a `userId: string`, so this is a
 * one-file change.
 */
export async function getOrCreateUserId(): Promise<string> {
  const store = cookies();
  const existing = store.get(COOKIE_NAME)?.value;

  if (existing) {
    const user = await prisma.user.findUnique({ where: { id: existing } });
    if (user) return user.id;
  }

  const user = await prisma.user.create({
    data: { email: `guest-${cryptoRandomId()}@skillpilot.local` },
  });

  store.set(COOKIE_NAME, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return user.id;
}

function cryptoRandomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
