import { loginAction } from "@/app/admin/actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-serif text-3xl tracking-tight">Admin login</h1>
      <p className="mt-3 text-sm text-muted">Sign in to manage series, artwork, and news posts.</p>

      <form action={loginAction} className="mt-8 space-y-4 border border-line bg-white/50 p-6">
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
        {sp.error ? (
          <p className="text-sm text-red-700">Could not sign in. Check the password and try again.</p>
        ) : null}
        <button
          type="submit"
          className="w-full border border-ink bg-ink px-4 py-3 text-xs tracking-[0.18em] text-paper uppercase hover:bg-ink/90"
        >
          Sign in
        </button>
        <p className="text-xs text-muted">
          Configure <span className="text-ink/80">ADMIN_PASSWORD</span> and{" "}
          <span className="text-ink/80">SESSION_SECRET</span> in <span className="text-ink/80">.env.local</span>.
        </p>
      </form>
    </div>
  );
}
