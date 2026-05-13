import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { isSiteGateEnabled } from "@/lib/siteGate";
import { redirect } from "next/navigation";
import { unlockSiteGate } from "@/app/site-gate/actions";

export const metadata: Metadata = {
  title: `Site access — ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default async function SiteGatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  if (!isSiteGateEnabled()) {
    redirect("/");
  }

  const sp = await searchParams;
  const next = safeNextPath(sp.next ?? null);
  const configError = sp.error === "config";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <p className="text-xs tracking-[0.22em] text-muted uppercase">Private preview</p>
      <h1 className="mt-4 font-serif text-3xl tracking-tight text-ink">Enter site password</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        This site is not public yet. Ask the studio for the password, or return when it launches.
      </p>

      <form action={unlockSiteGate} className="mt-8 space-y-4 border border-line bg-white/50 p-6">
        <input type="hidden" name="next" value={next} />
        <label className="block text-sm text-muted">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm text-ink"
          />
        </label>
        {sp.error === "1" ? (
          <p className="text-sm text-red-700">That password did not match. Try again.</p>
        ) : null}
        {configError ? (
          <p className="text-sm text-red-700">
            This preview lock needs <span className="font-medium text-ink/90">SESSION_SECRET</span> (16+ characters)
            in the server environment. Add it, redeploy, then try again.
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full border border-ink bg-ink px-4 py-3 text-xs tracking-[0.18em] text-paper uppercase hover:bg-ink/90"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
