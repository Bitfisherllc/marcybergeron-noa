import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { FORM_GUARD_FIELDS, type FormChallenge } from "@/lib/formGuardTypes";

/** Humans cannot read and fill a form this quickly. */
const MIN_FILL_MS = 3_000;
/** Pages may sit open (or cached) for a while before someone submits. */
const MAX_TOKEN_AGE_MS = 24 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_SUBMISSIONS = 5;
const MAX_LINKS = 2;

const SPAM_PATTERNS = [
  /\[url=/i,
  /<a\s+href/i,
  /\b(viagra|cialis|casino|porn|xxx|escort|payday loan|forex|crypto ?currency|bitcoin|binance|airdrop)\b/i,
  /\b(seo (services|agency|expert)|backlinks?|guest post|domain authority|rank (your|on) google)\b/i,
  /\b(web ?design (services|agency)|lead generation|increase (your )?(traffic|sales))\b/i,
];

const recentSubmissions = new Map<string, number[]>();

function guardSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return `form-guard:${secret}`;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is required for form verification.");
  return "form-guard:development";
}

function sign(issuedAt: number, nonce: string, answer: number): string {
  return createHmac("sha256", guardSecret()).update(`${issuedAt}.${nonce}.${answer}`).digest("base64url");
}

export function createFormChallenge(): FormChallenge {
  const a = randomInt(1, 10);
  const b = randomInt(1, 10);
  const issuedAt = Date.now();
  const nonce = randomBytes(9).toString("base64url");
  return {
    token: `${issuedAt}.${nonce}.${sign(issuedAt, nonce, a + b)}`,
    question: `What is ${a} plus ${b}?`,
  };
}

function countLinks(text: string): number {
  return text.match(/https?:\/\/|www\./gi)?.length ?? 0;
}

function looksLikeSpam(fields: { name?: string; text: string[] }): boolean {
  const name = fields.name ?? "";
  if (name.length > 100 || countLinks(name) > 0) return true;
  const body = fields.text.join("\n");
  if (countLinks(body) > MAX_LINKS) return true;
  return SPAM_PATTERNS.some((pattern) => pattern.test(`${name}\n${body}`));
}

async function clientKey(form: string): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return `${form}:${ip}`;
}

/** Best effort per server instance; resets when the server restarts. */
function overRateLimit(key: string): boolean {
  const now = Date.now();
  const recent = (recentSubmissions.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_SUBMISSIONS) {
    recentSubmissions.set(key, recent);
    return true;
  }
  recent.push(now);
  recentSubmissions.set(key, recent);
  return false;
}

function answerMatches(token: string, rawAnswer: string): "ok" | "wrong" | "expired" | "too-fast" | "invalid" {
  const [issuedRaw, nonce, signature] = token.split(".");
  const issuedAt = Number(issuedRaw);
  if (!issuedAt || !nonce || !signature) return "invalid";
  const age = Date.now() - issuedAt;
  if (age < MIN_FILL_MS) return "too-fast";
  if (age > MAX_TOKEN_AGE_MS) return "expired";
  const answer = Number.parseInt(rawAnswer.trim(), 10);
  if (!Number.isFinite(answer)) return "wrong";
  const expected = Buffer.from(sign(issuedAt, nonce, answer));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given) ? "ok" : "wrong";
}

/**
 * - `spam`: pretend the form was sent, but store and email nothing.
 * - `challenge` / `rate`: show the visitor an error so a real person can retry.
 */
export async function checkFormSubmission(
  formData: FormData,
  options: { form: string; name?: string; text: string[] },
): Promise<"ok" | "spam" | "challenge" | "rate"> {
  if (String(formData.get(FORM_GUARD_FIELDS.honeypot) ?? "").trim()) return "spam";

  const result = answerMatches(
    String(formData.get(FORM_GUARD_FIELDS.token) ?? ""),
    String(formData.get(FORM_GUARD_FIELDS.answer) ?? ""),
  );
  if (result === "invalid" || result === "too-fast") return "spam";
  if (looksLikeSpam({ name: options.name, text: options.text })) return "spam";
  if (overRateLimit(await clientKey(options.form))) return "rate";
  if (result !== "ok") return "challenge";
  return "ok";
}

export function formValues(formData: FormData, keys: string[]): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {};
  for (const key of keys) {
    const all = formData.getAll(key).map((v) => String(v));
    values[key] = all.length > 1 ? all : (all[0] ?? "");
  }
  return values;
}

export function logBlockedSubmission(form: string, reason: string) {
  console.warn(`[form-guard] blocked ${form} submission: ${reason}`);
}
