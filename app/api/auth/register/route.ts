import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma, withRetry } from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await withRetry(() =>
      prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })
    );

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await withRetry(() =>
      prisma.user.create({
        data: {
          name: name?.trim() || null,
          email: email.toLowerCase(),
          password: hashedPassword,
        },
      })
    );

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[register] error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
