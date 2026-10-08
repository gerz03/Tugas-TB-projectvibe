import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, handleError, ok } from "@/lib/api";
import { hashPassword, signSession } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session-cookie";

const schema = z.object({
  username: z.string().trim().min(3).max(30),
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(72)
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const exists = await prisma.user.findFirst({ where: { OR: [{ email: input.email }, { username: input.username }] } });
    if (exists) return fail("Email or username already exists", 409);
    const user = await prisma.user.create({ data: { username: input.username, email: input.email, password_hash: await hashPassword(input.password) } });
    const response = NextResponse.json({ data: { user: { user_id: user.user_id, username: user.username, email: user.email } } }, { status: 201 });
    return setSessionCookie(response, await signSession({ user_id: user.user_id, username: user.username }));
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return fail("Email or username already exists", 409);
    }
    return handleError(error);
  }
}
