import { loginToViewPrices, logoutPriceView } from "@/app/(site)/exhibitions/actions";

const buttonClass =
  "inline-flex border border-ink bg-ink px-4 py-3 text-xs tracking-[0.18em] text-paper uppercase transition hover:bg-ink/90 focus-ring";

export function ExhibitionPriceGate({
  returnTo,
  signedIn,
  error,
}: {
  returnTo: string;
  signedIn: boolean;
  error?: boolean;
}) {
  if (signedIn) {
    return (
      <form action={logoutPriceView} className="mt-6">
        <input type="hidden" name="returnTo" value={returnTo} />
        <button type="submit" className="link-quiet text-sm">
          Hide prices
        </button>
      </form>
    );
  }

  return (
    <form action={loginToViewPrices} className="mt-8 max-w-sm">
      <p className="text-sm leading-relaxed text-muted">Prices are hidden. Enter the password to see them.</p>
      {error ? <p className="mt-2 text-sm leading-relaxed text-ink">That password is not right.</p> : null}
      <label className="mt-4 block text-sm text-muted">
        Password
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </label>
      <input type="hidden" name="returnTo" value={returnTo} />
      <button type="submit" className={`${buttonClass} mt-4`}>
        See prices
      </button>
    </form>
  );
}
