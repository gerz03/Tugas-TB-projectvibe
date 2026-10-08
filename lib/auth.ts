import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const developmentSecret = "local-only-football-identity-development-secret";

function sessionSecret() {
  const configuredSecret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production" && (!configuredSecret || configuredSecret.length < 32)) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters in production.");
  }
  return new TextEncoder().encode(configuredSecret || developmentSecret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signSession(payload: { user_id: string; username: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(sessionSecret());
}

export async function readSession(token?: string) {
  if (!token) return null;
  const secret = sessionSecret();
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.user_id !== "string" || typeof payload.username !== "string") return null;
    return { user_id: payload.user_id, username: payload.username };
  } catch {
    return null;
  }
}
