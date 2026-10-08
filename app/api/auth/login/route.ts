import { z } from "zod";
import { NextResponse } from "next/server";
import { fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { signSession, verifyPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session-cookie";

const schema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(72)
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await verifyPassword(input.password, user.password_hash))) return fail("Invalid credentials", 401);
    const response = NextResponse.json({ data: { user: { user_id: user.user_id, username: user.username, email: user.email } } });
    return setSessionCookie(response, await signSession({ user_id: user.user_id, username: user.username }));
  } catch (error) {
    return handleError(error);
  }
}
