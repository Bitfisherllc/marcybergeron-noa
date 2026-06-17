import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

export const adminLinkVariants = {
  menu: "focus-ring block border border-line bg-white/50 p-6 transition hover:bg-white/80",
  primary:
    "focus-ring inline-flex items-center justify-center border border-ink px-4 py-3 text-xs tracking-[0.18em] uppercase transition hover:bg-black/[0.03]",
  secondary:
    "focus-ring inline-flex items-center justify-center border border-line px-3 py-1.5 text-xs tracking-[0.16em] uppercase transition hover:bg-black/[0.03]",
  back:
    "focus-ring inline-flex items-center justify-center border border-line px-5 py-3 text-xs tracking-[0.18em] uppercase transition hover:bg-black/[0.03]",
  bar: "focus-ring inline-flex items-center justify-center border border-paper/25 bg-paper/10 px-3 py-1.5 text-xs tracking-wide text-paper transition hover:bg-paper/20",
  barAction:
    "focus-ring inline-flex items-center justify-center border border-paper bg-paper px-4 py-2 text-xs tracking-[0.16em] text-ink uppercase transition hover:bg-paper/90",
} as const;

export const adminBtnPrimary =
  "focus-ring inline-flex items-center justify-center border border-ink bg-ink px-5 py-3 text-xs tracking-[0.18em] text-paper uppercase transition hover:bg-ink/90";

export const adminBtnDanger =
  "focus-ring inline-flex items-center justify-center border border-red-200 px-3 py-1.5 text-xs tracking-[0.16em] text-red-800 uppercase transition hover:bg-red-50";

type AdminLinkVariant = keyof typeof adminLinkVariants;

function linkClass(variant: AdminLinkVariant, className?: string) {
  return [adminLinkVariants[variant], className].filter(Boolean).join(" ");
}

type AdminLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: AdminLinkVariant;
};

export function AdminLink({ variant = "secondary", className, ...props }: AdminLinkProps) {
  return <Link className={linkClass(variant, className)} {...props} />;
}

type AdminExternalLinkProps = ComponentPropsWithoutRef<"a"> & {
  variant?: AdminLinkVariant;
};

export function AdminExternalLink({ variant = "secondary", className, ...props }: AdminExternalLinkProps) {
  return <a className={linkClass(variant, className)} {...props} />;
}
