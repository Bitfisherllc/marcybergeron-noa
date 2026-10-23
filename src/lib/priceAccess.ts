import { createHash, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "mbn_prices";
const PASSWORD = "letmein";

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET must be set (min 16 chars) for price viewing.");
  }
  return new TextEncoder().encode(s);
}

export function verifyPriceViewPassword(password: string) {
  const ha = createHash("sha256").update(password, "utf8").digest();
  const hb = createHash("sha256").update(PASSWORD, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

export async function createPriceViewSession() {
  const token = await new SignJWT({ role: "prices" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroyPriceViewSession() {
  (await cookies()).delete(COOKIE);
}

export async function hasPriceViewSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === "prices";
  } catch {
    return false;
  }
}
