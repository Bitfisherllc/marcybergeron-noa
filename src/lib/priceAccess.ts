import { createHash, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { priceGuide } from "@/db/schema";

const COOKIE = "mbn_prices";
const PRICE_GUIDE_ID = "default";
const DEFAULT_PASSWORD = "letmein";

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET must be set (min 16 chars) for price viewing.");
  }
  return new TextEncoder().encode(s);
}

function passwordDigest(password: string) {
  return createHash("sha256").update(password, "utf8").digest("hex");
}

export async function getPriceGuidePassword(): Promise<string> {
  const [row] = await getDb()
    .select({ password: priceGuide.password })
    .from(priceGuide)
    .where(eq(priceGuide.id, PRICE_GUIDE_ID));
  const value = row?.password.trim();
  return value || DEFAULT_PASSWORD;
}

export async function setPriceGuidePassword(password: string) {
  const updatedAt = new Date();
  await getDb()
    .insert(priceGuide)
    .values({ id: PRICE_GUIDE_ID, password, updatedAt })
    .onConflictDoUpdate({ target: priceGuide.id, set: { password, updatedAt } });
}

export async function verifyPriceViewPassword(password: string) {
  const current = await getPriceGuidePassword();
  const ha = createHash("sha256").update(password, "utf8").digest();
  const hb = createHash("sha256").update(current, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

export async function createPriceViewSession() {
  const token = await new SignJWT({ role: "prices", pw: passwordDigest(await getPriceGuidePassword()) })
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
    if (payload.role !== "prices" || typeof payload.pw !== "string") return false;
    const current = passwordDigest(await getPriceGuidePassword());
    if (payload.pw.length !== current.length) return false;
    return timingSafeEqual(Buffer.from(payload.pw), Buffer.from(current));
  } catch {
    return false;
  }
}
