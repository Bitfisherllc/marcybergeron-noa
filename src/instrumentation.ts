import type { Instrumentation } from "next";

function pgCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err && typeof (err as { code: unknown }).code === "string") {
    return (err as { code: string }).code;
  }
  return undefined;
}

export function register() {
  /* optional hook — onRequestError below handles DB query failures */
}

export const onRequestError: Instrumentation.onRequestError = (err, _request, context) => {
  if (!(err instanceof Error)) return;

  const cause = err.cause;
  if (cause instanceof Error) {
    const code = pgCode(cause);
    console.error("[request-error]", context.routePath, cause.message, code ? `pg_code=${code}` : "");
    if (code === "42P01") {
      console.error(
        "[request-error] Missing table or relation — apply schema to this database: `npm run db:push` (with the same DATABASE_URL), or redeploy Vercel with DATABASE_URL set so prebuild can run drizzle-kit push.",
      );
    }
    if ((cause as NodeJS.ErrnoException).code === "ECONNREFUSED") {
      console.error(
        "[request-error] Postgres refused connection — start local DB (`docker compose up -d` in website/) or fix DATABASE_URL.",
      );
    }
  }
};
