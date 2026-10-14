import { headers } from "next/headers";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RESPONSE_FIELD = "cf-turnstile-response";
/** Error codes that mean our own setup is wrong, not that the visitor is a bot. */
const CONFIG_ERROR_CODES = new Set(["missing-input-secret", "invalid-input-secret", "internal-error"]);

let warnedDisabled = false;

async function clientIp(): Promise<string | undefined> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    undefined
  );
}

/**
 * Checks the Cloudflare Turnstile token posted with a form.
 *
 * Skipped (returns true) until both `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are set.
 * A missing or rejected token fails; a misconfigured secret or unreachable Cloudflare is logged and passes,
 * so the other spam checks (and the admin password) still apply instead of locking everyone out.
 */
export async function verifyTurnstile(formData: FormData, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    if (!warnedDisabled) {
      warnedDisabled = true;
      console.warn(
        "[turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY are not both set; skipping Turnstile checks.",
      );
    }
    return true;
  }

  const token = String(formData.get(RESPONSE_FIELD) ?? "");
  if (!token || token.length > 2048) return false;

  const body = new URLSearchParams({ secret, response: token });
  const remoteip = ip ?? (await clientIp());
  if (remoteip) body.set("remoteip", remoteip);

  let result: { success?: boolean; "error-codes"?: string[] };
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`siteverify responded ${res.status}`);
    result = await res.json();
  } catch (err) {
    console.error("[turnstile] could not reach Cloudflare; allowing submission:", err);
    return true;
  }

  if (result.success) return true;
  const codes = result["error-codes"] ?? [];
  if (codes.some((code) => CONFIG_ERROR_CODES.has(code))) {
    console.error(`[turnstile] check is misconfigured (${codes.join(", ")}); allowing submission.`);
    return true;
  }
  console.warn(`[turnstile] rejected submission (${codes.join(", ") || "no error code"})`);
  return false;
}
