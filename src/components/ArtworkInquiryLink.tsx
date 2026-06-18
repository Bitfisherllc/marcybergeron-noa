import Link from "next/link";
import { artworkInquiryHref } from "@/lib/artworkInquiry";

export function ArtworkInquiryLink({
  artworkId,
  variant = "default",
}: {
  artworkId: string;
  variant?: "default" | "lightbox";
}) {
  const className =
    variant === "lightbox"
      ? "text-sm tracking-wide text-white/75 underline decoration-white/25 underline-offset-2 transition hover:text-white hover:decoration-white/50"
      : "link-quiet text-sm tracking-wide";

  return (
    <Link href={artworkInquiryHref(artworkId)} className={className}>
      Inquire about purchase →
    </Link>
  );
}
