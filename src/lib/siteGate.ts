import { createHash, timingSafeEqual } from "node:crypto";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { SITE_GATE_COOKIE_NAME, SITE_GATE_JWT_TYP } from "@/lib/siteGateConstants";

function gatePasswordExpected(): string | null {
  const p = process.env.SITE_GATE_PASSWORD?.trim();
  return p ? p : null;
}

export function isSiteGateEnabled(): boolean {
  return gatePasswordExpected() !== null;
}

export function verifySiteGatePassword(password: string): boolean {
  const expected = gatePasswordExpected();
  if (!expected) return true;
  const ha = createHash("sha256").update(password, "utf8").digest();
  const hb = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

function getSecretBytes() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET must be set (min 16 chars) when SITE_GATE_PASSWORD is enabled.");
  }
  return new TextEncoder().encode(s);
}

export async function setSiteGateCookie() {
  const token = await new SignJWT({ typ: SITE_GATE_JWT_TYP })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretBytes());

  (await cookies()).set(SITE_GATE_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
