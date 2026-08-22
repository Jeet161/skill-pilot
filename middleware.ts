export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Protect all routes except:
     *   - /login
     *   - /api/auth/* (NextAuth routes)
     *   - /_next/* (Next.js internals)
     *   - /favicon.*, /icon.* (static assets)
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon|icon).*)",
  ],
};
