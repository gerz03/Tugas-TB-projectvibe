import { timingSafeEqual } from "node:crypto";
import { fail } from "@/lib/api";

export function requireAdminApiKey(request: Request) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return fail("Admin API is disabled until ADMIN_API_KEY is configured.", 503);

  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
    return fail("Admin API key is missing or invalid.", 401);
  }
  return null;
}
